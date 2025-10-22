use adt_query::{
    api::object::{ObjectSourceRequest, ObjectSourceRequestBuilder},
    dispatch::StatelessDispatch as _,
    response::CacheControlled,
};
use serde::{Deserialize, Serialize};
use slotmap::DefaultKey;
use tower_lsp::{LanguageServer, jsonrpc::Result};
use vfs::nodes::{VirtualNode, VirtualNodeData};

use crate::backend::Backend;

/// Parameters for **`connection/connect`**
///
/// Attempts to establish a backend connection to the ABAP Developement Tools
/// and an editor context for the requested system.
#[derive(Debug, Eq, PartialEq, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpandParams {
    pub id: DefaultKey,
}

/// Response of **`connection/connect`**
#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpandResult {
    children: Vec<VirtualNode>,
}

#[derive(Debug, Eq, PartialEq, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadFileParams {
    pub id: DefaultKey,

    pub version: Option<String>,
}

#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadFileResult {
    pub content: String,
}

impl Backend {
    pub async fn expand(&self, params: ExpandParams) -> Result<ExpandResult> {
        let ctx = self.context().unwrap();
        let mut filetree = ctx.filetree.lock().await;

        let result = filetree.expand(params.id, &ctx.adt_client).await;

        let children: Vec<VirtualNode> = result.into_iter().cloned().collect();
        Ok(ExpandResult { children })
    }

    pub async fn read(&self, params: ReadFileParams) -> Result<ReadFileResult> {
        let ctx = self.context().unwrap();
        let filetree = ctx.filetree.lock().await;

        let node = filetree.lookup(params.id).unwrap();

        let obj = match &node.data {
            VirtualNodeData::RepositoryObject(obj) => obj,
            _ => panic!(),
        };

        let mut repo = ctx.repository.lock().await;
        let obj = repo.fetch(&obj.adt_uri, &ctx.adt_client).await;

        Ok(ReadFileResult {
            content: obj.source().to_owned(),
        })
    }
}
