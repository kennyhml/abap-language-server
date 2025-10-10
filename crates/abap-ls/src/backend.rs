use std::{collections::HashMap, sync::Arc};

use tokio::sync::Mutex;
use tower_lsp::jsonrpc::Result;
use tower_lsp::lsp_types::{InitializedParams, MessageType};
use tower_lsp::{
    Client as LspClient, LanguageServer,
    lsp_types::{InitializeParams, InitializeResult, ServerCapabilities},
};

use adt_query::Client as AdtClient;

/// A connection to a system, holds the adt connector, open files,

#[derive(Debug)]
pub struct SystemConnection {
    // context: open files, locks, local file buffers
    pub adt_client: AdtClient<reqwest::Client>,
}

/// Map
pub type ConnectionRegistry = HashMap<String, Arc<SystemConnection>>;

#[derive(Debug)]
pub struct Backend {
    client: LspClient,

    persistent: Arc<PersistentBackend>,
}

#[derive(Debug, Default)]
pub struct PersistentBackend {
    connections: Mutex<ConnectionRegistry>,
}

impl Backend {
    pub fn new(client: LspClient, persistent: &Arc<PersistentBackend>) -> Self {
        return Self {
            client,
            persistent: persistent.clone(),
        };
    }

    pub async fn connection(&self, system: &str) -> Option<Arc<SystemConnection>> {
        self.persistent
            .connections
            .lock()
            .await
            .get(system)
            .cloned()
    }

    pub async fn add_connection(&self, system: &str, client: AdtClient<reqwest::Client>) {
        self.persistent.connections.lock().await.insert(
            system.into(),
            Arc::new(SystemConnection { adt_client: client }),
        );
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

impl Backend {}
