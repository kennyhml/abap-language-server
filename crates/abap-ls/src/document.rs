use adt_query::{
    api::object::ObjectSourceRequestBuilder, dispatch::StatelessDispatch as _,
    response::CacheControlled,
};
use ropey::Rope;
use tower_lsp::lsp_types::{Position, TextDocumentContentChangeEvent};
use tree_sitter::{InputEdit, Parser, Point, Query, QueryCursor, StreamingIterator as _, Tree};

use crate::{
    context::AdtClient,
    tokens::{SemanticToken, TokenModifier, TokenType},
};

#[derive(Debug)]
pub struct SourceCodeDocument {
    // The URI of the object in the virtual file explorer
    vfs_uri: String,

    // The ADT URI of the object.
    adt_uri: String,

    rope: Rope,

    cst: Tree,
}

impl SourceCodeDocument {
    pub fn vfs_uri(&self) -> &str {
        &self.vfs_uri
    }

    pub fn raw_content(&self) -> String {
        self.rope.to_string()
    }

    /// Fetches the documents source code from the ADT Backend and parses it.
    pub async fn fetch(vfs_uri: &str, adt_uri: &str, client: &AdtClient) -> Self {
        let req = ObjectSourceRequestBuilder::default()
            .object_uri(adt_uri)
            .build()
            .unwrap();

        let result = req.dispatch(&client).await.unwrap();
        match result {
            CacheControlled::Modified(t) => {
                let content = t.into_body().inner();
                return Self {
                    vfs_uri: vfs_uri.to_owned(),
                    adt_uri: adt_uri.to_owned(),
                    cst: load_parser().parse(&*content, None).unwrap(),
                    rope: content.into(),
                };
            }
            _ => unimplemented!("Caching"),
        }
    }

    /// Refreshes the document the same as the initial [fetch](Self::fetch) (no etag checks).
    pub async fn refresh(&mut self, client: &AdtClient) {
        let req = ObjectSourceRequestBuilder::default()
            .object_uri(&self.adt_uri)
            .build()
            .unwrap();

        let result = req.dispatch(&client).await.unwrap();
        match result {
            CacheControlled::Modified(t) => {
                let content = t.into_body().inner();
                self.cst = load_parser().parse(&*content, None).unwrap();
                self.rope = content.into();
            }
            _ => unimplemented!("Caching"),
        }
    }

    /// Applies a [TextDocumentContentChangeEvent] from the client to both the
    /// rope and the concrete syntax tree of the document to keep it in sync.
    ///
    /// The syntax tree however is not automatically reparsed as multiple content
    /// change events may arrive at once and re-parsing should happen only after
    /// all events have been handled for performance reasons.
    ///
    /// Thus you must call [reparse] after submitting all the client edits.
    pub fn apply_client_edit(&mut self, event: &TextDocumentContentChangeEvent) -> () {
        let (start, end) = self.document_change_range(event);

        let start_idx = position_to_char_index(&self.rope, &start).expect("Invalid start index");
        let end_idx = position_to_char_index(&self.rope, &end).expect("invalid end index");
        let start_byte = position_to_byte_offset(&self.rope, &start).expect("Invalid start byte");
        let old_end_byte = position_to_byte_offset(&self.rope, &end).expect("Invalid end byte");
        let new_end_byte = start_byte + event.text.len();

        // Edit the Rope BEFORE fetching the new end position, otherwise PANIC if its out of range :c
        self.rope.remove(start_idx..end_idx);
        if !event.text.is_empty() {
            self.rope.insert(start_idx, &event.text)
        }

        let new_end_pos = {
            let line = self.rope.byte_to_line(new_end_byte);
            Point::new(line, new_end_byte - self.rope.line_to_byte(line))
        };

        self.cst.edit(&InputEdit {
            start_byte: start_byte,
            start_position: position_to_point(&start),
            old_end_byte,
            old_end_position: position_to_point(&end),
            new_end_byte: new_end_byte,
            new_end_position: new_end_pos,
        });
    }

    /// Reparses the Concrete Syntax Tree of the document after applying one or more edits.
    pub fn reparse(&mut self) -> () {
        self.cst = load_parser()
            .parse(&self.rope.to_string(), Some(&self.cst))
            .expect("Failed to update CST.")
    }

    fn document_change_range(
        &self,
        event: &TextDocumentContentChangeEvent,
    ) -> (Position, Position) {
        match event.range.map(|v| (v.start, v.end)) {
            Some(v) => v,
            None => {
                // Whole document
                let line_count = self.rope.len_lines();
                let last_line_len = if line_count > 0 {
                    self.rope.line(line_count - 1).len_chars()
                } else {
                    0
                };
                (
                    Position::new(0, 0),
                    Position::new(line_count as u32, last_line_len as u32),
                )
            }
        }
    }

    /// Runs the highlighty query on the concrete syntax tree and extracts
    /// the nodes into their corresponding semantic tokens.
    pub fn semantic_tokens(&self) -> Vec<SemanticToken> {
        let query = Query::new(
            &tree_sitter_abap::LANGUAGE.into(),
            tree_sitter_abap::HIGHLIGHTS_QUERY,
        )
        .unwrap();

        let mut cursor = QueryCursor::new();

        // This creates a copy, optimize later.
        let text = self.rope.to_string();
        let mut matches = cursor.matches(&query, self.cst.root_node(), text.as_bytes());

        let mut tokens = vec![];
        while let Some(_match) = matches.next() {
            for capture in _match.captures {
                let node = capture.node;
                let capture_name = query.capture_names()[capture.index as usize];

                let start = node.start_position();
                let length = node.end_byte() - node.start_byte();

                let token = SemanticToken {
                    start_byte: node.start_byte(),
                    row: start.row as u32,
                    column: start.column as u32,
                    length: length as u32,
                    token_type: TokenType::from_name(capture_name),
                    token_modifiers_bitset: TokenModifier::None,
                };

                tokens.push(token);
            }
        }
        tokens
    }
}

pub fn position_to_char_index(rope: &Rope, position: &Position) -> Option<usize> {
    let (line, column) = (position.line as usize, position.character as usize);
    if line >= rope.len_lines() {
        return None;
    }
    let line_start_char = rope.line_to_char(line);
    let line_start_cu = rope.char_to_utf16_cu(line_start_char);
    let line_text = rope.line(line);
    let line_cu_count = line_text.chars().map(|c| c.len_utf16()).sum::<usize>();
    if column > line_cu_count {
        return None;
    }
    Some(rope.utf16_cu_to_char(line_start_cu + column))
}

pub fn position_to_byte_offset(rope: &Rope, position: &Position) -> Option<usize> {
    position_to_char_index(rope, position).map(|v| rope.char_to_byte(v))
}

pub fn position_to_point(position: &Position) -> Point {
    Point {
        row: position.line as usize,
        column: position.character as usize,
    }
}

fn load_parser() -> Parser {
    let mut parser = Parser::new();
    parser
        .set_language(&tree_sitter_abap::LANGUAGE.into())
        .expect("Error loading grammar");

    parser
}
