use crate::backend::Backend;
use adt_query::{
    api::repository::RepositoryContentBuilder,
    dispatch::StatelessDispatch,
    models::vfs::{Facet, Preselection},
    operation::Operation,
};
use serde::{Deserialize, Serialize};
use tower_lsp::{
    jsonrpc::{Error, Result},
    lsp_types::MessageType,
};

#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FilesystemNode {
    pub name: String,

    pub kind: String,
}

/// Parameters for **`filesystem/expand`**
///
/// and an editor context for the requested system.
#[derive(Debug, Eq, PartialEq, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpandParams {
    // Name of the package to expand, the root will be expanded if empty.
    pub package: Option<String>,
}

/// Response of **`filesystem/expand`**
#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpandResult {
    pub nodes: Vec<FilesystemNode>,
}

impl Backend {
    pub async fn expand(&self, params: ExpandParams) -> Result<ExpandResult> {
        let lock = self.connection().lock().await;
        let client = match lock.as_ref() {
            None => Err(Error::internal_error())?,
            Some(c) => c,
        };

        // The API doesnt allow us retrieve package and objects at the same time,
        // so we must first request the packages, then the content. We can optimize this
        // away because when we initially request the packages, we get informed whether the
        // package contains any subpackages by the "has_children_of_same_facet" attribute.

        let mut op = RepositoryContentBuilder::default();
        if let Some(package) = params.package {
            op.push_preselection(Preselection::new(Facet::Package, package));
        } else {
            op.order(vec![Facet::Package].into());
        }

        let op = op.build().map_err(|e| {
            let mut err = Error::internal_error();
            err.message = e.to_string().into();
            err
        })?;

        self.client
            .log_message(MessageType::LOG, op.body().unwrap().unwrap())
            .await;

        let result = op.dispatch(&client.adt).await.map_err(|e| {
            let mut err = Error::internal_error();
            err.message = e.to_string().into();
            err
        })?;

        let mut nodes: Vec<FilesystemNode> = Vec::new();

        //TODO: Move instead of cloning
        for obj in &result.body().objects {
            nodes.push(FilesystemNode {
                name: obj.name.clone(),
                kind: obj.kind.clone(),
            });
        }
        for obj in &result.body().folders {
            nodes.push(FilesystemNode {
                name: obj.name.clone(),
                kind: "DEVC/K".into(),
            });
        }
        return Ok(ExpandResult { nodes });
    }
}
