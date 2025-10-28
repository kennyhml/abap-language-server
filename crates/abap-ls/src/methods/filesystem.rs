use abap_lsp::document::SourceCodeDocument;
use serde::{Deserialize, Serialize};
use slotmap::DefaultKey;
use tower_lsp::jsonrpc::Result;
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

    pub uri: String,

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
        let content = if let Some(doc) = ctx.fetch_document(&params.uri) {
            println!("Document {} was already loaded.", params.uri);
            doc.lock().unwrap().raw_content()
        } else {
            let obj = SourceCodeDocument::fetch(&params.uri, &obj.adt_uri, &ctx.adt_client).await;
            let text = obj.raw_content();
            ctx.store_document(obj);
            text
        };

        Ok(ReadFileResult { content })
    }
}
