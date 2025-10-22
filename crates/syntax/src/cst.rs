use tree_sitter::{Parser, Query, QueryCursor, StreamingIterator as _, Tree};

use crate::{
    parser::load_parser,
    tokens::{SemanticToken, TokenModifier, TokenType},
};

#[derive(Debug)]
pub struct SyntaxTree {
    cst: Tree,
    source: String,
}

impl SyntaxTree {
    pub fn new(cst: Tree, source: String) -> Self {
        Self { cst, source }
    }

    pub fn parse(source: &str) -> Self {
        let mut parser = load_parser();
        Self {
            cst: parser.parse(source, None).unwrap(),
            source: source.to_string(),
        }
    }

    pub fn semantic_tokens(&self) -> Vec<SemanticToken> {
        let query = Query::new(
            &tree_sitter_abap::LANGUAGE.into(),
            tree_sitter_abap::HIGHLIGHTS_QUERY,
        )
        .unwrap();

        let mut cursor = QueryCursor::new();
        let mut matches = cursor.matches(&query, self.cst.root_node(), self.source.as_bytes());

        let mut tokens = vec![];
        while let Some(_match) = matches.next() {
            for capture in _match.captures {
                let node = capture.node;
                let capture_name = query.capture_names()[capture.index as usize];

                let start = node.start_position();
                let end = node.end_position();
                let length = node.end_byte() - node.start_byte();

                let token = SemanticToken {
                    start_byte: node.start_byte(),
                    row: start.row as u32,
                    column: start.column as u32,
                    length: length as u32,
                    token_type: TokenType::from_name(capture_name),
                    token_modifiers_bitset: TokenModifier::Declaration,
                };

                tokens.push(token);
            }
        }

        tokens
    }
}
