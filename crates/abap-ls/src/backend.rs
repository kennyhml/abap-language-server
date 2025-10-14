use tokio::sync::OnceCell;
use tower_lsp::jsonrpc::{Error, Result};
use tower_lsp::lsp_types::{InitializedParams, MessageType};
use tower_lsp::{
    Client as LspClient, LanguageServer,
    lsp_types::{InitializeParams, InitializeResult, ServerCapabilities},
};

pub type AdtClient = adt_query::Client<reqwest::Client>;

/// Holds all context of a client/system connection, established through a call
/// to `connection/connect`. The data may persist for a little while even when
/// the client has disconnect in anticipation of having to reserve it shortly after.
#[derive(Debug)]
pub struct ClientContext {
    // Client to communicate with the ADT backend
    pub adt_client: AdtClient,
}

impl ClientContext {
    pub fn new(adt_client: AdtClient) -> Self {
        Self { adt_client }
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

    pub async fn context(&self) -> Result<&ClientContext> {
        self.client_ctx_once.get().ok_or(Error::internal_error())
    }
}

#[tower_lsp::async_trait]
impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            capabilities: ServerCapabilities {
                ..Default::default()
            },
            ..Default::default()
        })
    }

    async fn initialized(&self, _: InitializedParams) {
        self.client
            .log_message(MessageType::INFO, "server initialized!")
            .await;
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
}
