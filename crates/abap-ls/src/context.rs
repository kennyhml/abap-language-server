use std::collections::HashMap;
use std::sync::{Arc, LazyLock, Mutex as SyncMutex};
use std::time::Duration;
use tokio::sync::Mutex as AsyncMutex;
use tokio::time::{self, Instant};
use vfs::tree::VirtualFileTree;

use crate::document::SourceCodeDocument;

pub type AdtClient = adt_query::Client<reqwest::Client>;

/// Holds all context of a client/system connection, established through a call
/// to `connection/connect`. The data may persist for a little while even when
/// the client has disconnect in anticipation of having to reserve it shortly after.
#[derive(Debug)]
pub struct ClientContext {
    // Client to communicate with the ADT backend
    pub system_id: String,

    pub adt_client: AdtClient,

    pub filetree: AsyncMutex<VirtualFileTree>,

    pub documents: AsyncMutex<HashMap<String, Arc<AsyncMutex<SourceCodeDocument>>>>,
}

impl ClientContext {
    pub fn new(adt_client: AdtClient, system: String) -> Self {
        Self {
            system_id: system.clone(),
            adt_client,
            filetree: AsyncMutex::new(VirtualFileTree::new(system)),
            documents: AsyncMutex::new(HashMap::new()),
        }
    }

    pub fn system_id(&self) -> &str {
        &self.system_id
    }

    pub async fn store_document(&self, document: SourceCodeDocument) {
        self.documents.lock().await.insert(
            document.vfs_uri().to_owned(),
            Arc::new(AsyncMutex::new(document)),
        );
    }

    pub async fn fetch_document(
        &self,
        vfs_uri: &str,
    ) -> Option<Arc<AsyncMutex<SourceCodeDocument>>> {
        self.documents.lock().await.get(vfs_uri).cloned()
    }
}

/// Global static context store across all connections, maintains each client
/// context with a TTL to make sure that temporary session interrupts can be
/// recovered from.
pub struct ContextStore {
    /// Maps system ids to contexts. When a backend establishes a connection to a system
    /// id, these can be checked if there are any existing contexts to restore.
    contexts: SyncMutex<HashMap<String, Arc<ClientContext>>>,

    /// Time-to-Live per context. A context that is not part of this map is currently
    /// in use and is not set to expire.
    ///
    /// When a backend disconnects, it must add its time-to-live to the map for
    /// the context store to destroy it during periodic checks.
    time_to_live: SyncMutex<HashMap<String, tokio::time::Instant>>,
}

impl ContextStore {
    const DEFAULT_TTL: Duration = Duration::from_secs(300);

    /// Returns a client context mapped to the given system id if available.
    ///
    /// If a context is found, the time-to-live for the context is automatically
    /// terminated and the context will not be invalidated until a new TTL is set.
    pub fn try_restore(&self, system_id: &str) -> Option<Arc<ClientContext>> {
        let ctx = self.contexts.lock().unwrap().get(system_id).cloned()?;
        self.time_to_live.lock().unwrap().remove(system_id);
        Some(ctx)
    }

    /// Adds the provided [ClientContext] to the static global storage.
    pub fn store(&self, system_id: &str, context: Arc<ClientContext>) {
        self.contexts
            .lock()
            .unwrap()
            .insert(system_id.to_owned(), context);
    }

    /// Immediately drops the [ClientContext] mapped to the system id from the storage.
    ///
    /// No Time-to-Live is set, the context is destroyed immediately and __cant be restored__.
    pub fn drop_now(&self, system_id: &str) -> Option<Arc<ClientContext>> {
        let ctx = self.contexts.lock().unwrap().remove(system_id)?;
        self.time_to_live.lock().unwrap().remove(system_id);
        Some(ctx)
    }

    /// Starts a Time-to-Live for the provided system id.
    ///
    /// To specify a custom TTL instead of the [default](Self::DEFAULT_TTL), use [start_custom_ttl](Self::start_custom_ttl).
    pub fn start_ttl(&self, system_id: &str) {
        self.start_custom_ttl(system_id, Self::DEFAULT_TTL);
    }

    /// Starts a Time-to-Live for the provided system id.
    ///
    /// To use thethe [default](Self::DEFAULT_TTL) TTL, use [start_ttl](Self::start_ttl).
    pub fn start_custom_ttl(&self, system_id: &str, ttl: Duration) {
        self.time_to_live
            .lock()
            .unwrap()
            .insert(system_id.to_owned(), Instant::now() + ttl);
    }

    /// Drops all contexts bound to a TTL that has passed.
    ///
    /// Internal use only, executed periodically by an interval.
    fn drop_expired_contexts(&self) {
        let mut ttls = self.time_to_live.lock().unwrap();
        let mut contexts = self.contexts.lock().unwrap();

        let now = Instant::now();
        let ttl_passed: Vec<_> = ttls
            .iter()
            .filter(|(_, ttl)| now.duration_since(*ttl.to_owned()).is_zero())
            .map(|(system, _)| system.to_owned())
            .collect();

        for system in &ttl_passed {
            contexts.remove(system);
            ttls.remove(system);
        }
    }
}

pub static CONTEXT_STORE: LazyLock<ContextStore> = LazyLock::new(|| {
    let store = ContextStore {
        contexts: SyncMutex::new(HashMap::new()),
        time_to_live: SyncMutex::new(HashMap::new()),
    };
    tokio::spawn({
        async move {
            let mut interval = time::interval(Duration::from_secs(15));
            loop {
                interval.tick().await;
                CONTEXT_STORE.drop_expired_contexts();
            }
        }
    });
    store
});
