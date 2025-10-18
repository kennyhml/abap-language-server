mod backend;
mod methods;

use crate::backend::Backend;
use tokio::net::TcpListener;
use tower_lsp::{LspService, Server};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();

    // We always need to be the entity that serves the connection, since we are
    // looking to persist state throughout client reconnects
    let listener = TcpListener::bind("127.0.0.1:9257").await.unwrap();

    loop {
        let (stream, _) = listener.accept().await.unwrap();

        tokio::spawn(async move {
            let (read, write) = tokio::io::split(stream);
            let (service, socket) = LspService::build(|client| Backend::new(client))
                .custom_method("connection/connect", Backend::connect)
                .custom_method("filesystem/expand", Backend::expand)
                .custom_method("filesystem/source", Backend::read)
                .finish();
            Server::new(read, write, socket).serve(service).await;

            // The backend disconnects here, where we should temporarily send the context
            // somewhere and hold it for some time, then when initializing the backend
            // check if we can restore the previous state.
        });
    }
}
