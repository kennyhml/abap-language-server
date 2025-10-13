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
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NodeGroup {
    LocalObjects,

    SystemLibrary,

    Favorites,
}

impl NodeGroup {
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::LocalObjects => "Local Objects",
            Self::SystemLibrary => "System Library",
            Self::Favorites => "Favorites",
        }
    }
}

#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GroupNode {
    name: String,

    id: NodeGroup,

    /// The children of the group node, i.e the nodes it groups together.
    children: Option<Vec<FilesystemNode>>,
}

#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FacetNode {
    /// The kind of facet, see [Facet]
    facet: Facet,

    /// The display name of the facet.
    ///
    /// In the case of a `TYPE` facet, this could, for example, be `Classes` or `Programs`..
    name: String,

    /// The technical name of the facet.
    ///
    /// In the case of a `TYPE` facet, this could, for example, be `CLAS` or `PROG`..
    technical_name: String,

    package: Option<String>,

    children: Option<Vec<FilesystemNode>>,
}

#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RepositoryObjectNode {
    /// The name of the repository object
    name: String,

    /// The kind of object, e.g `PROG/P`, etc..
    object_kind: RepositoryObject,
}

#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FilesystemNode {
    System,
    Group(GroupNode),
    Facet(FacetNode),
    RepositoryObject(RepositoryObjectNode),
}

impl FilesystemNode {
    pub fn group(group: NodeGroup) -> Self {
        FilesystemNode::Group(GroupNode {
            name: group.display_name().into(),
            id: group,
            children: None,
        })
    }
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
        let expand = match &params.node {
            FilesystemNode::System => {
                return Ok(ExpandResult {
                    children: vec![
                        FilesystemNode::group(NodeGroup::LocalObjects),
                        FilesystemNode::group(NodeGroup::Favorites),
                        FilesystemNode::group(NodeGroup::SystemLibrary),
                    ],
                });
            }
            FilesystemNode::RepositoryObject { .. } => {
                // Cannot expand objects
                return Ok(ExpandResult { children: vec![] });
            }
            FilesystemNode::Group(group) => self.build_group_expander(group).await,
            FilesystemNode::Facet(facet) => self.build_facet_expander(facet).await,
        };

        let query = expand.build().map_err(|e| {
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

        for obj in &result.body().objects {
            nodes.push(FilesystemNode::RepositoryObject(RepositoryObjectNode {
                name: obj.name.clone(),
                object_kind: obj.kind.clone(),
            }));
        }

        let package = match params.node {
            FilesystemNode::Facet(facet) => facet.package,
            _ => None,
        };

        // Either packages or groups / types
        for obj in &result.body().folders {
            nodes.push(FilesystemNode::Facet(FacetNode {
                facet: obj.facet.clone(),
                name: obj.display_name.clone(),
                technical_name: obj.name.clone(),
                package: package.clone(),
                children: None,
            }));
        }
        return Ok(ExpandResult { children: nodes });
    }

    async fn build_group_expander(&self, node: &GroupNode) -> RepositoryContentBuilder {
        let mut query = RepositoryContentBuilder::default();
        match &node.id {
            NodeGroup::Favorites => {
                query.push_preselection(Preselection::new(Facet::Favorites, "$DEVELOPER"));
            }
            NodeGroup::LocalObjects => {
                //TODO: Need to know the names of the developers the user has added local objects of
                query.push_preselection(Preselection::new(Facet::Package, "$TMP"));
                query.push_preselection(Preselection::new(Facet::Owner, "DEVELOPER"));
                query.order(vec![Facet::Owner].into());
            }
            NodeGroup::SystemLibrary => {
                query.order(vec![Facet::Package].into());
            }
        }
        query
    }

    async fn build_facet_expander<'a>(&self, node: &'a FacetNode) -> RepositoryContentBuilder<'a> {
        let mut query = RepositoryContentBuilder::default();

        // Push the facet itself as preselection
        query.push_preselection(Preselection::new(node.facet.clone(), &node.technical_name));

        // Also add package restrictions for non package facets.
        if !matches!(node.facet, Facet::Package) {
            if let Some(pkg) = &node.package {
                query.push_preselection(Preselection::new(Facet::Package, pkg));
            }
        }

        if let Some(expand_into) = node.facet.expands_into() {
            query.order(vec![expand_into].into());
        }

        query
    }
}
