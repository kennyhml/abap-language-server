use tokio::sync::Mutex;
use tower_lsp::jsonrpc::Result;
use tower_lsp::lsp_types::{InitializedParams, MessageType};
use tower_lsp::{
    Client as LspClient, LanguageServer,
    lsp_types::{InitializeParams, InitializeResult, ServerCapabilities},
};

pub type AdtClient = adt_query::Client<reqwest::Client>;

/// A connection to a system, holds the adt connector, open files,

#[derive(Debug)]
pub struct SystemConnection {
    // context: open files, locks, local file buffers
    pub adt: AdtClient,
}

impl SystemConnection {
    pub fn new(adt: AdtClient) -> Self {
        Self { adt }
    }
}

#[derive(Debug)]
pub struct Backend {
    pub client: LspClient,

    connection: Mutex<Option<SystemConnection>>,
}

impl Backend {
    pub fn new(client: LspClient) -> Self {
        return Self {
            client,
            connection: Mutex::new(None),
        };
    }

    pub fn connection(&self) -> &Mutex<Option<SystemConnection>> {
        &self.connection
    }

    pub async fn set_connection(&self, conn: SystemConnection) {
        *self.connection.lock().await = Some(conn);
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
