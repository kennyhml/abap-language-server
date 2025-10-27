use std::vec;

use abap_lsp::edits::{position_to_byte_offset, position_to_char_index, position_to_point};
use abap_lsp::parser::load_parser;
use abap_lsp::tokens::{SemanticToken, TokenModifier, TokenType};
use adt_query::api::object::ObjectSourceRequestBuilder;
use adt_query::dispatch::StatelessDispatch;
use adt_query::response::CacheControlled;
use ropey::Rope;
use tokio::sync::{Mutex, OnceCell};
use tower_lsp::jsonrpc::{self, Error, Result};
use tower_lsp::lsp_types::{
    DidChangeTextDocumentParams, DidOpenTextDocumentParams, InitializedParams, MessageType,
    SemanticTokenType, SemanticTokens, SemanticTokensFullOptions, SemanticTokensLegend,
    SemanticTokensOptions, SemanticTokensParams, SemanticTokensResult, TextDocumentSyncCapability,
    TextDocumentSyncKind, WorkDoneProgressOptions,
};
use tower_lsp::{
    Client as LspClient, LanguageServer,
    lsp_types::{InitializeParams, InitializeResult, ServerCapabilities},
};
use tree_sitter::{InputEdit, Point, Query, QueryCursor, StreamingIterator as _, Tree};
use vfs::tree::VirtualFileTree;

pub type AdtClient = adt_query::Client<reqwest::Client>;

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
    pub async fn load(vfs_uri: &str, adt_uri: &str, client: &AdtClient) -> Self {
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

    pub fn apply_client_edit(&mut self, params: &DidChangeTextDocumentParams) -> Result<()> {
        todo!()
    }

    pub fn text(&mut self) -> &mut Rope {
        &mut self.rope
    }
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
                let end = node.end_position();
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

#[derive(Debug)]
pub struct Repository {
    source_objects: Vec<SourceCodeDocument>,
}

impl Repository {
    pub async fn store<'a>(&'a mut self, vfs_uri: &str, adt_uri: &str, client: &AdtClient) {
        let obj = SourceCodeDocument::load(vfs_uri, adt_uri, client).await;
        self.source_objects.push(obj);
    }

    pub async fn fetch(&mut self, vfs_uri: &str) -> Option<&mut SourceCodeDocument> {
        self.source_objects
            .iter_mut()
            .find(|o| o.vfs_uri == vfs_uri)
    }
}

/// Holds all context of a client/system connection, established through a call
/// to `connection/connect`. The data may persist for a little while even when
/// the client has disconnect in anticipation of having to reserve it shortly after.
#[derive(Debug)]
pub struct ClientContext {
    // Client to communicate with the ADT backend
    pub adt_client: AdtClient,

    pub filetree: Mutex<VirtualFileTree>,

    pub repository: Mutex<Repository>,
}

impl ClientContext {
    pub fn new(adt_client: AdtClient, system: String) -> Self {
        Self {
            adt_client,
            filetree: Mutex::new(VirtualFileTree::new(system)),
            repository: Mutex::new(Repository {
                source_objects: vec![],
            }),
        }
    }
}

#[derive(Debug)]
pub struct Backend {
    pub client: LspClient,

    pub client_ctx_once: OnceCell<ClientContext>,
}

impl Backend {
    pub fn new(client: LspClient) -> Self {
        return Self {
            client,
            client_ctx_once: OnceCell::new(),
        };
    }

    pub fn client(&self) -> &LspClient {
        &self.client
    }

    pub fn context(&self) -> Result<&ClientContext> {
        self.client_ctx_once.get().ok_or(Error::internal_error())
    }
}

fn print_cst(tree: &Tree, source: &Rope) {
    let root_node = tree.root_node();
    print_node(&root_node, source, 0);
}

fn print_node(node: &tree_sitter::Node, source: &Rope, indent: usize) {
    let indent_str = "  ".repeat(indent);
    let kind = node.kind();
    let start_pos = node.start_position();
    let end_pos = node.end_position();
    let text = source.slice(node.start_byte()..node.end_byte()).to_string();
    eprintln!(
        "{}[{}] {}:{} - {}:{}: {}",
        indent_str, kind, start_pos.row, start_pos.column, end_pos.row, end_pos.column, text
    );

    for i in 0..node.child_count() {
        if let Some(child) = node.child(i) {
            print_node(&child, source, indent + 1);
        }
    }
}

#[tower_lsp::async_trait]
impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            capabilities: ServerCapabilities {
                text_document_sync: Some(TextDocumentSyncCapability::Kind(
                    TextDocumentSyncKind::INCREMENTAL,
                )),
                semantic_tokens_provider: Some(
                    SemanticTokensOptions {
                        legend: SemanticTokensLegend {
                            token_types: TokenType::names()
                                .to_vec()
                                .iter()
                                .map(|n| SemanticTokenType::new(n))
                                .collect(),
                            token_modifiers: vec![],
                        },
                        full: Some(SemanticTokensFullOptions::Bool(true)),
                        range: Some(false),
                        work_done_progress_options: WorkDoneProgressOptions {
                            work_done_progress: Some(false),
                        },
                    }
                    .into(),
                ),
                ..Default::default()
            },
            ..Default::default()
        })
    }

    async fn did_open(&self, params: DidOpenTextDocumentParams) {
        println!("Got a did_open message!");
    }

    async fn did_change(&self, params: DidChangeTextDocumentParams) -> () {
        let ctx = self.context().unwrap();
        let mut repo = ctx.repository.lock().await;

        for change in params.content_changes {
            if let Some(range) = change.range {
                let obj = repo.fetch(params.text_document.uri.as_str()).await.unwrap();
                let source = obj.text();
                let start_idx =
                    position_to_char_index(source, &range.start).expect("Invalid start index");
                let end_idx =
                    position_to_char_index(source, &range.end).expect("invalid end index");
                let start_byte =
                    position_to_byte_offset(source, &range.start).expect("Invalid start byte");
                let old_end_byte =
                    position_to_byte_offset(source, &range.end).expect("Invalid end byte");

                source.remove(start_idx..end_idx);
                if !change.text.is_empty() {
                    source.insert(start_idx, &change.text)
                }

                let new_end_byte = start_byte + change.text.len();

                let line = source.byte_to_line(new_end_byte);
                let new_end_pos = Point::new(line, new_end_byte - source.line_to_byte(line));

                obj.cst.edit(&InputEdit {
                    start_byte: start_byte,
                    start_position: position_to_point(&range.start),
                    old_end_byte,
                    old_end_position: position_to_point(&range.end),
                    new_end_byte: new_end_byte,
                    new_end_position: new_end_pos,
                });
            }
        }
        let obj = repo.fetch(params.text_document.uri.as_str()).await.unwrap();
        let source = obj.text().clone();
        obj.cst = load_parser()
            .parse(&source.to_string(), Some(&obj.cst))
            .unwrap();

        // let mut parser = load_parser();
        // obj.cst = parser.parse(source.to_string(), None).unwrap();
    }

    async fn initialized(&self, _: InitializedParams) {
        self.client
            .log_message(MessageType::INFO, "server initialized!")
            .await;
    }

    async fn semantic_tokens_full(
        &self,
        params: SemanticTokensParams,
    ) -> Result<Option<SemanticTokensResult>> {
        let ctx = self.context().unwrap();
        let mut repo = ctx.repository.lock().await;
        let obj = repo.fetch(params.text_document.uri.as_str()).await.unwrap();

        let mut nodes = obj.semantic_tokens();

        nodes.sort_by_key(|n| n.start_byte);

        let mut result: Vec<tower_lsp::lsp_types::SemanticToken> = vec![];
        let mut prev: Option<SemanticToken> = None;
        for i in 0..nodes.len() {
            let curr = nodes[i];
            if let Some(prev) = prev {
                result.push(tower_lsp::lsp_types::SemanticToken {
                    delta_line: curr.row - prev.row,
                    delta_start: if curr.row == prev.row {
                        curr.column - prev.column
                    } else {
                        curr.column
                    },
                    length: curr.length,
                    token_type: curr.token_type.index(),
                    token_modifiers_bitset: 0,
                })
            } else {
                result.push(tower_lsp::lsp_types::SemanticToken {
                    delta_line: curr.row,
                    delta_start: curr.column,
                    length: curr.length,
                    token_type: curr.token_type.index(),
                    token_modifiers_bitset: 0,
                })
            }
            prev = Some(curr);
        }

        return Ok(Some(
            SemanticTokens {
                result_id: None,
                data: result,
            }
            .into(),
        ));
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
}
