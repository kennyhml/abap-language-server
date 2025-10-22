use adt_query::api::object::ObjectSourceRequestBuilder;
use adt_query::dispatch::StatelessDispatch;
use adt_query::response::CacheControlled;
use syntax::cst::SyntaxTree;
use tokio::sync::{Mutex, OnceCell};
use tower_lsp::jsonrpc::{Error, Result};
use tower_lsp::lsp_types::{
    DidOpenTextDocumentParams, InitializedParams, MessageType, SemanticTokensLegend,
    SemanticTokensOptions, SemanticTokensParams, SemanticTokensResult, TextDocumentSyncCapability,
    TextDocumentSyncKind,
};
use tower_lsp::{
    Client as LspClient, LanguageServer,
    lsp_types::{InitializeParams, InitializeResult, ServerCapabilities},
};
use vfs::tree::VirtualFileTree;

pub type AdtClient = adt_query::Client<reqwest::Client>;

#[derive(Debug)]
pub struct SourceCodeObject {
    uri: String,

    contents: String,

    syntax_tree: SyntaxTree,
}

impl SourceCodeObject {
    pub async fn load(object_uri: &str, client: &AdtClient) -> Self {
        let req = ObjectSourceRequestBuilder::default()
            .object_uri(object_uri)
            .build()
            .unwrap();

        let result = req.dispatch(&client).await.unwrap();
        match result {
            CacheControlled::Modified(t) => {
                let content = t.into_body().inner();
                let tree = SyntaxTree::parse(&content);
                return Self {
                    uri: object_uri.to_owned(),
                    contents: content.into(),
                    syntax_tree: tree,
                };
            }
            _ => unimplemented!("Caching"),
        }
    }

    pub fn source(&self) -> &str {
        &self.contents
    }
}

#[derive(Debug)]
pub struct Repository {
    source_objects: Vec<SourceCodeObject>,
}

impl Repository {
    pub async fn fetch<'a>(&'a mut self, uri: &str, client: &AdtClient) -> &'a SourceCodeObject {
        if self.source_objects.iter().find(|o| o.uri == uri).is_none() {
            let obj = SourceCodeObject::load(uri, client).await;
            self.source_objects.push(obj);
        }
        return self.source_objects.iter().find(|o| o.uri == uri).unwrap();
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
                            token_types: vec!["variables".into()],
                            token_modifiers: vec![],
                        },
                        ..Default::default()
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
        self.client
            .log_message(MessageType::INFO, "semantic received.")
            .await;
        return Ok(None);
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
}
