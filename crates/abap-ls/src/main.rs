use adt_query::auth::Credentials;
use adt_query::dispatch::StatelessDispatch;
use adt_query::error::{DispatchError, OperationError};
use reqwest::Certificate;
use serde::{Deserialize, Serialize};
use std::error::Error as _;
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
pub struct InitializeConnectionParams {
    pub hostname: String,

    pub port: u16,

    pub ssl: bool,

    pub custom_certificate: Option<String>,

    pub accept_invalid_hostname: bool,

    pub accept_invalid_certs: bool,
}

#[derive(Debug, Eq, PartialEq, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializeConnectionResult {
    /// The name of the resolved url based on ssl/tls, hostname & port
    pub resolved_url: String,
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

impl Backend {
    /// Handles `connection/initialize`, separate this from the process of initializing
    /// the language server itself as it makes defining the request more robust
    /// and handling a language server that fails to initialize is a pain in the ass.
    async fn initialize_connection(
        &self,
        params: InitializeConnectionParams,
    ) -> Result<InitializeConnectionResult> {
        let mut dispatcher = reqwest::Client::builder();

        // Remove http / https from hostname since it will be added based on http / https
        let mut url = params
            .hostname
            .replace("http://", "")
            .replace("https://", "");

        if params.ssl {
            url = format!("https://{url}:{}", params.port);
            dispatcher = dispatcher.use_native_tls();

            if let Some(cert) = params.custom_certificate {
                let pem = std::fs::read(cert)
                    .map_err(|_| Error::invalid_params("Invalid certificate path"))?;

                let cert = Certificate::from_pem(&pem)
                    .map_err(|_| Error::invalid_params("Invalid certificate"))?;
                dispatcher = dispatcher.add_root_certificate(cert);
            }
            dispatcher = dispatcher
                .danger_accept_invalid_hostnames(params.accept_invalid_hostname)
                .danger_accept_invalid_certs(params.accept_invalid_certs);
        } else {
            url = format!("http://{url}:{}", params.port);
        }

        let url = Url::parse(&url)
            .map_err(|_| Error::invalid_params(format!("Resolved URL '{url}' is invalid.")))?;

        let connection = HttpConnectionBuilder::default()
            .hostname(url.clone())
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
        return Ok(InitializeConnectionResult {
            resolved_url: url.into(),
        });
    }
}

#[tokio::main]
async fn main() {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();

    let (service, socket) = LspService::build(|client| Backend { client })
        .custom_method("connection/initialize", Backend::initialize_connection)
        .finish();
    Server::new(stdin, stdout, socket).serve(service).await;
}
