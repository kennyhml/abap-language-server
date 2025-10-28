use std::sync::Arc;

use crate::backend::Backend;
use abap_lsp::context::{CONTEXT_STORE, ClientContext};
use adt_query::{
    ClientBuilder, ConnectionParameters, HttpConnectionBuilder, auth::Credentials,
    dispatch::StatelessDispatch,
};
use reqwest::{Certificate, Url};
use serde::{Deserialize, Serialize};
use tower_lsp::jsonrpc::{Error, ErrorCode, Result};

#[derive(Debug, Eq, PartialEq, Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Authentication {
    Password { username: String, password: String },
    SecurityToken(String),
    SAPSSO2(String),
}

/// Parameters for **`connection/connect`**
///
/// Attempts to establish a backend connection to the ABAP Developement Tools
/// and an editor context for the requested system.
#[derive(Debug, Eq, PartialEq, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectParams {
    /// ID of the system to connect to, this also uniquely identifies the connection.
    pub system_id: String,

    /// Hostname of the system to connect to
    pub hostname: String,

    /// Port to connect to
    pub port: u16,

    /// Client to connect with, e.g '001'
    pub client: String,

    /// Logon language, e.g 'EN'
    pub language: String,

    /// How to authenticate with the system, e.g username & password, sso2 token..
    pub authentication: Authentication,

    /// Whether to use TLS/SSL Encryption (HTTPS)
    pub ssl: bool,

    /// Optional: A path to a custom, self signed certificate to allow
    pub custom_certificate: Option<String>,

    /// Accept certificates where the hostname does not match
    pub accept_invalid_hostname: bool,

    /// Accept certificates that are not signed by a trusted authority
    pub accept_invalid_certs: bool,
}

/// Response of **`connection/connect`**
#[derive(Debug, Eq, PartialEq, Clone, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ConnectResult {
    AlreadyConnected,
    Created,
    Restored,
}

impl Backend {
    pub async fn connect(&self, params: ConnectParams) -> Result<ConnectResult> {
        if self.context().ok().is_some() {
            return Ok(ConnectResult::AlreadyConnected);
        }

        if let Some(ctx) = CONTEXT_STORE.try_restore(&params.system_id) {
            self.context.set(ctx).unwrap();
            return Ok(ConnectResult::Restored);
        }

        let credentials = match &params.authentication {
            Authentication::Password { username, password } => Credentials::new(username, password),
            _ => Err(Error::invalid_params("Authentication method not supported"))?,
        };

        let client = ClientBuilder::default()
            .connection_params(build_connection_params(&params)?)
            .dispatcher(create_dispatcher(&params)?)
            .credentials(credentials)
            .build()
            .map_err(|_| Error::internal_error())?;

        // Try to send a request to core discovery to check if the system
        // is reachable and we are authenticated.
        let operation = adt_query::api::core::CoreDiscovery {};
        match operation.dispatch(&client).await {
            Err(e) => {
                let mut err = Error::new(ErrorCode::InternalError);
                err.message = format!("{:?}", e).into();
                return Err(err);
            }
            _ => {}
        };

        let ctx = Arc::new(ClientContext::new(client, params.system_id.clone()));
        self.context.set(ctx.clone()).unwrap();
        CONTEXT_STORE.store(&params.system_id, ctx);
        Ok(ConnectResult::Created)
    }
}

fn create_dispatcher(params: &ConnectParams) -> Result<reqwest::Client> {
    let mut dispatcher = reqwest::Client::builder();

    // Only really need to do a bunch of special stuff when SSL is enabled,
    // such as adding a poossible root certificate.
    if params.ssl {
        dispatcher = dispatcher.use_native_tls();

        if let Some(cert) = &params.custom_certificate {
            let pem = std::fs::read(cert)
                .map_err(|_| Error::invalid_params("Invalid certificate path"))?;
            let cert = Certificate::from_pem(&pem)
                .map_err(|_| Error::invalid_params("Invalid certificate"))?;
            dispatcher = dispatcher.add_root_certificate(cert);
        }
        dispatcher = dispatcher
            .danger_accept_invalid_hostnames(params.accept_invalid_hostname)
            .danger_accept_invalid_certs(params.accept_invalid_certs);
    }
    dispatcher.build().map_err(|e| {
        let mut err = Error::internal_error();
        err.message = e.to_string().into();
        err
    })
}

fn build_connection_params(params: &ConnectParams) -> Result<ConnectionParameters> {
    // Remove http / https from hostname since it will be added based on ssl
    // but we still want to allow the user to enter it, even if redundant.
    let hostname = params
        .hostname
        .replace("http://", "")
        .replace("https://", "");

    // Only really need to do a bunch of special stuff when SSL is enabled,
    // such as adding a poossible root certificate.
    let url = if params.ssl {
        format!("https://{}:{}", hostname, params.port)
    } else {
        format!("http://{}:{}", hostname, params.port)
    };

    let url = Url::parse(&url)
        .map_err(|_| Error::invalid_params(format!("Invalid resolved url: '{url}'")))?;

    Ok(ConnectionParameters::Http(
        HttpConnectionBuilder::default()
            .hostname(url)
            .client(&params.client)
            .language(&params.language)
            .build()
            .map_err(|_| Error::internal_error())?,
    ))
}
