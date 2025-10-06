use adt_query::auth::Credentials;
use adt_query::dispatch::StatelessDispatch;
use adt_query::error::{DispatchError, OperationError};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::net::TcpListener;
use tower_lsp::jsonrpc::{Error, ErrorCode, Result};
use tower_lsp::lsp_types::*;
use tower_lsp::{Client, LanguageServer, LspService, Server};

use adt_query::{ClientBuilder, ConnectionParameters, HttpConnectionBuilder};

#[derive(Debug)]
struct Backend {
    client: Client,
}

#[derive(Debug, Eq, PartialEq, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionParams {
    pub url: String,
    pub port: u16,

    pub client: Option<String>,
    pub language: Option<String>,
}

#[derive(Debug, Eq, PartialEq, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionResult {
    pub success: bool,
    pub message: String,
}

#[tower_lsp::async_trait]
impl LanguageServer for Backend {
    async fn initialize(&self, params: InitializeParams) -> Result<InitializeResult> {
        self.connect_to_adt(
            params
                .initialization_options
                .ok_or(Error::invalid_params("missing initialize options."))?,
        )
        .await?;
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

impl Backend {
    async fn connect_to_adt(&self, params: Value) -> Result<()> {
        let url = params
            .get("hostname")
            .and_then(|v| v.as_str())
            .ok_or(Error::invalid_params("missing hostname"))?;

        let port = params
            .get("port")
            .and_then(|v| v.as_u64())
            .ok_or(Error::invalid_params("missing port"))?;

        let mut url = Url::parse(url).unwrap();
        url.set_port(Some(port as u16)).unwrap();

        let connection = HttpConnectionBuilder::default()
            .hostname(url)
            .client("001")
            .language("en")
            .build()
            .unwrap();

        let client = ClientBuilder::default()
            .connection_params(ConnectionParameters::Http(connection))
            .dispatcher(reqwest::Client::new())
            .credentials(Credentials::new("Mock", "Test"))
            .build()
            .unwrap();

        let operation = adt_query::api::core::CoreDiscovery {};
        match operation.dispatch(&client).await {
            Err(OperationError::DispatchError(DispatchError::ReqwestError(e))) => {
                if e.is_connect() {
                    let mut e = Error::new(ErrorCode::InternalError);
                    e.message = "Server did not respond.".into();
                    return Err(e);
                }
            }
            _ => {}
        }
        return Ok(());
    }
}

#[tokio::main]
async fn main() {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();

    let (service, socket) = LspService::new(|client| Backend { client });
    Server::new(stdin, stdout, socket).serve(service).await;
}

// #[tokio::main]
// async fn main() -> Result<()> {
//     let listener = TcpListener::bind("127.0.0.1:5007").await.unwrap();

//     loop {
//         let (stream, _) = listener.accept().await.unwrap();
//         let (service, socket) = LspService::build(|client| Backend { client })
//             // .custom_method("connection/test", Backend::test_connection)
//             .finish();
//         let (read, write) = tokio::io::split(stream);
//         Server::new(read, write, socket).serve(service).await;
//     }
// }
