use adt_query::models::vfs::{Facet, RepositoryObject};
use serde::{Deserialize, Serialize};

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
