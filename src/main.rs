use std::error::Error as _;
use std::fs::File;
use std::io::Read;

use adt_query::auth::Credentials;
use adt_query::dispatch::StatelessDispatch;
use adt_query::error::{DispatchError, OperationError};
use reqwest::{Certificate, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::io::AsyncReadExt;
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
        let hostname = params
            .get("hostname")
            .and_then(|v| v.as_str())
            .ok_or(Error::invalid_params("missing hostname"))?;

        let port = params
            .get("port")
            .and_then(|v| v.as_u64())
            .ok_or(Error::invalid_params("missing port"))?;

        let ssl = params
            .get("ssl")
            .and_then(|v| v.as_bool())
            .ok_or(Error::invalid_params("missing ssl/tls specification"))?;

        let mut dispatcher = reqwest::Client::builder();

        // Remove http / https from hostname since it will be added based on http / https
        let mut url = hostname.replace("http://", "").replace("https://", "");
        if ssl {
            url = format!("https://{hostname}");
            dispatcher = dispatcher.use_native_tls();

            if let Some(cert) = params.get("customCertificate").and_then(|v| v.as_str()) {
                let certificate = Certificate::from_pem(
                    &std::fs::read(cert)
                        .map_err(|_| Error::invalid_params("invalid custom certificate"))?,
                )
                .map_err(|_| Error::invalid_params("invalid custom certificate"))?;
                dispatcher = dispatcher.add_root_certificate(certificate);
            }

            if params
                .get("acceptInvalidHostname")
                .and_then(|v| v.as_bool())
                .unwrap_or(false)
            {
                dispatcher = dispatcher.danger_accept_invalid_hostnames(true);
            }
            if params
                .get("acceptInvalidCerts")
                .and_then(|v| v.as_bool())
                .unwrap_or(false)
            {
                dispatcher = dispatcher.danger_accept_invalid_certs(true);
            }
        } else {
            url = format!("http://{hostname}");
        }

        let mut url = Url::parse(&url).map_err(|_| Error::invalid_params("invalid hostname"))?;
        url.set_port(Some(port as u16))
            .map_err(|_| Error::invalid_params("invalid port"))?;

        let connection = HttpConnectionBuilder::default()
            .hostname(url)
            .client("001")
            .language("en")
            .build()
            .map_err(|_| Error::internal_error())?;

        let client = ClientBuilder::default()
            .connection_params(ConnectionParameters::Http(connection))
            .dispatcher(dispatcher.build().map_err(|_| Error::internal_error())?)
            .credentials(Credentials::new("Mock", "Test"))
            .build()
            .map_err(|_| Error::internal_error())?;

        let operation = adt_query::api::core::CoreDiscovery {};
        match operation.dispatch(&client).await {
            Err(OperationError::DispatchError(DispatchError::ReqwestError(e))) => {
                if e.is_connect() {
                    let mut err = Error::new(ErrorCode::InternalError);
                    err.message = e
                        .source()
                        .and_then(|e| e.source())
                        .map(|e| e.to_string())
                        .unwrap_or(e.to_string())
                        .into();
                    return Err(err);
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
