mod backend;
mod rpc;
use std::sync::Arc;

use crate::backend::{Backend, PersistentBackend};
use tokio::net::TcpListener;
use tower_lsp::{LspService, Server};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();

    // We always need to be the entity that serves the connection, since we are
    // looking to persist state throughout client reconnects
    let listener = TcpListener::bind("127.0.0.1:9257").await.unwrap();

    let persistent = Arc::new(PersistentBackend::default());

    loop {
        let (stream, _) = listener.accept().await.unwrap();
        let (read, write) = tokio::io::split(stream);
        let (service, socket) = LspService::build(|client| Backend::new(client, &persistent))
            .custom_method("connection/connect", Backend::connect)
            .finish();
        Server::new(read, write, socket).serve(service).await;
    }
}
