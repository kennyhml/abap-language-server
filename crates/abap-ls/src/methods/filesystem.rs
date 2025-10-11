use crate::backend::Backend;
use adt_query::{
    api::repository::RepositoryContentBuilder,
    dispatch::StatelessDispatch,
    models::vfs::{Facet, FacetOrder, PreselectionBuilder},
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
pub struct ExpandPackageParams {
    // Package to expand
    pub package: String,
}

#[derive(Debug, Eq, PartialEq, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RootParams {}

/// Response of **`filesystem/expand`**
#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub struct ExpandPackageResult {
    // The subpackages and objects a package expands into
    pub nodes: Vec<FilesystemNode>,
}

/// Response of **`filesystem/expand`**
#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RootResult {
    // The subpackages and objects a package expands into
    pub packages: Vec<FilesystemNode>,
}

impl Backend {
    pub async fn root(&self, params: RootParams) -> Result<RootResult> {
        let lock = self.connection().lock().await;
        let client = match lock.as_ref() {
            None => Err(Error::internal_error())?,
            Some(c) => c,
        };

        // The API doesnt allow us retrieve package and objects at the same time,
        // so we must first request the packages, then the content. We can optimize this
        // away because when we initially request the packages, we get informed whether the
        // package contains any subpackages by the "has_children_of_same_facet" attribute.

        let op = RepositoryContentBuilder::default()
            .order(vec![Facet::Package].into())
            .build()
            .map_err(|e| {
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
        for obj in &result.body().folders {
            nodes.push(FilesystemNode {
                name: obj.name.clone(),
                kind: "package".into(),
            });
        }
        return Ok(RootResult { packages: nodes });
    }

    pub async fn expand(&self, params: ExpandPackageParams) -> Result<ExpandPackageResult> {
        let lock = self.connection().lock().await;
        let client = match lock.as_ref() {
            None => Err(Error::internal_error())?,
            Some(c) => c,
        };

        // The API doesnt allow us retrieve package and objects at the same time,
        // so we must first request the packages, then the content. We can optimize this
        // away because when we initially request the packages, we get informed whether the
        // package contains any subpackages by the "has_children_of_same_facet" attribute.

        let package_filter = PreselectionBuilder::default()
            .facet(Facet::Package)
            .include(params.package)
            .build()
            .map_err(|e| {
                let mut err = Error::internal_error();
                err.message = e.to_string().into();
                err
            })?;

        let op = RepositoryContentBuilder::default()
            .push_preselection(package_filter)
            .build()
            .map_err(|e| {
                let mut err = Error::internal_error();
                err.message = e.to_string().into();
                err
            })?;

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
        return Ok(ExpandPackageResult { nodes });
    }
}
