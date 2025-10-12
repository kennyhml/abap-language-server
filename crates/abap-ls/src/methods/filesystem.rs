use crate::backend::Backend;
use adt_query::{
    api::repository::RepositoryContentBuilder,
    dispatch::StatelessDispatch,
    models::vfs::{Facet, Preselection, RepositoryObject},
    operation::Operation,
};
use serde::{Deserialize, Serialize};
use tower_lsp::{
    jsonrpc::{Error, Result},
    lsp_types::MessageType,
};

#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
pub enum NodeGrouping {
    #[serde(rename = "Local Objects")]
    LocalObjects,
    #[serde(rename = "System Library")]
    SystemLibrary,
    #[serde(rename = "Favorites")]
    Favorites,
}

#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FilesystemNode {
    // The node of a system. To the server, this is the root node, since it builds
    // filesystem trees only for individual systems. Clients may need to have a higher
    // order root node that expands to multiple systems.
    System {
        /// The `SID` (System ID) of the system
        name: String,
        /// The children of the system node
        children: Option<Vec<FilesystemNode>>,
    },

    /// A virtual "folder" that groups related objects together, this abstraction exists
    /// only in the filetrees, not in the true organization on the server. This is mainly
    /// needed because the sheer amount of objects is too much to display immediately under
    /// each node. It also makes it so we can fetch the nodes incrementally based on what
    /// node type is currently needed and avoid needlessly long load times.
    Group {
        /// The (display) name of the grouping, e.g `"Local Objects"`
        name: NodeGrouping,

        /// In the case of package content groupings such as `"Source"`, the name of the
        /// package the grouping is part of. All groupings that dont have a unique position
        /// in the system, such as the Local Object or System Library, need to have this set.
        package: Option<String>,

        /// The children of the group node, i.e the nodes it groups together.
        children: Option<Vec<FilesystemNode>>,
    },

    /// An actual repository object like a package, a class, an interface, etc..
    RepositoryObject {
        /// The name of the repository object
        name: String,

        /// The kind of object, e.g `DEVC/k`, `PROG/P`, etc..
        object: RepositoryObject,

        /// The children of the node. In the case of a package, this may be the other packages
        /// or objects assigned to it.
        children: Option<Vec<FilesystemNode>>,
    },
}

/// Parameters for **`filesystem/expand`**
///
/// and an editor context for the requested system.
#[derive(Debug, Eq, PartialEq, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpandParams {
    /// The node to expand, should have no children assigned.
    pub node: FilesystemNode,
}

/// Response of **`filesystem/expand`**
#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpandResult {
    /// The child nodes of the node to be expanded.
    pub children: Vec<FilesystemNode>,
}

impl Backend {
    pub async fn expand(&self, params: ExpandParams) -> Result<ExpandResult> {
        let mut query = RepositoryContentBuilder::default();
        match params.node {
            // System Node always expands into the same groups.
            FilesystemNode::System { name, children } => {
                return Ok(ExpandResult {
                    children: vec![
                        FilesystemNode::Group {
                            name: NodeGrouping::LocalObjects,
                            package: None,
                            children: None,
                        },
                        FilesystemNode::Group {
                            name: NodeGrouping::Favorites,
                            package: None,
                            children: None,
                        },
                        FilesystemNode::Group {
                            name: NodeGrouping::SystemLibrary,
                            package: None,
                            children: None,
                        },
                    ],
                });
            }
            FilesystemNode::Group {
                name,
                package,
                children,
            } => match name {
                NodeGrouping::LocalObjects => {
                    query.push_preselection(Preselection::new(Facet::Package, "$TMP"));
                    query.push_preselection(Preselection::new(Facet::Owner, "DEVELOPER"));
                }
                NodeGrouping::Favorites => {
                    unimplemented!()
                }
                NodeGrouping::SystemLibrary => {
                    query.order(vec![Facet::Package].into());
                }
            },
            FilesystemNode::RepositoryObject {
                name,
                object,
                children,
            } => match object {
                RepositoryObject::Package => {
                    query.push_preselection(Preselection::new(Facet::Package, name));
                }
                _ => unimplemented!(), // cant expand other shit
            },
        }

        let query = query.build().map_err(|e| {
            let mut err = Error::internal_error();
            err.message = e.to_string().into();
            err
        })?;
        self.client
            .log_message(MessageType::LOG, query.body().unwrap().unwrap())
            .await;

        let result = query.dispatch(self.client().await?).await.map_err(|e| {
            let mut err = Error::internal_error();
            err.message = e.to_string().into();
            err
        })?;

        let mut nodes: Vec<FilesystemNode> = Vec::new();

        //TODO: Move instead of cloning
        for obj in &result.body().objects {
            nodes.push(FilesystemNode::RepositoryObject {
                name: obj.name.clone(),
                object: obj.kind.clone(),
                children: None,
            });
        }
        for obj in &result.body().folders {
            nodes.push(FilesystemNode::RepositoryObject {
                name: obj.name.clone(),
                object: RepositoryObject::Package,
                children: None,
            });
        }
        return Ok(ExpandResult { children: nodes });
    }
}
