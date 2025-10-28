use abap_lsp::context::{CONTEXT_STORE, ClientContext};
use abap_lsp::tokens::{SemanticToken, TokenType};
use std::sync::Arc;
use std::vec;
use tokio::sync::OnceCell;
use tower_lsp::jsonrpc::{Error, Result};
use tower_lsp::lsp_types::{
    DidOpenTextDocumentParams, InitializedParams, MessageType, SemanticTokenType, SemanticTokens,
    SemanticTokensFullOptions, SemanticTokensLegend, SemanticTokensOptions, SemanticTokensParams,
    SemanticTokensResult, TextDocumentSyncCapability, TextDocumentSyncKind,
    WorkDoneProgressOptions,
};
use tower_lsp::{
    Client as LspClient, LanguageServer,
    lsp_types::{InitializeParams, InitializeResult, ServerCapabilities},
};

#[derive(Debug)]
pub struct Backend {
    pub client: LspClient,

    pub context: OnceCell<Arc<ClientContext>>,
}

impl Backend {
    pub fn new(client: LspClient) -> Self {
        return Self {
            client,
            context: OnceCell::new(),
        };
    }

    pub fn client(&self) -> &LspClient {
        &self.client
    }

    pub fn context(&self) -> Result<&Arc<ClientContext>> {
        self.context.get().ok_or(Error::internal_error())
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
        let obj = ctx
            .fetch_document(params.text_document.uri.as_str())
            .await
            .unwrap();

        let mut nodes = obj.lock().await.semantic_tokens();

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
        if let Ok(ctx) = self.context() {
            CONTEXT_STORE.start_ttl(ctx.system_id());
        }
        Ok(())
    }
}
