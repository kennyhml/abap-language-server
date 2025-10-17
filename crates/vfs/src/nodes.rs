//! Provides definitions for the different nodes located in the virtual filesystem.
use adt_query::models::vfs::{Facet, Object, RepositoryObject, VirtualFolder};
use serde::{Deserialize, Serialize};
use slotmap::DefaultKey;

#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VirtualNode {
    pub id: DefaultKey,

    #[serde(skip)]
    pub parent: Option<DefaultKey>,

    #[serde(skip)]
    pub children: Option<Vec<DefaultKey>>,

    #[serde(flatten)]
    pub data: VirtualNodeData,
}

impl VirtualNode {
    pub fn new<T>(id: DefaultKey, data: T) -> Self
    where
        T: Into<VirtualNodeData>,
    {
        Self {
            id,
            data: data.into(),
            parent: None,
            children: None,
        }
    }

    pub fn parent(mut self, parent: DefaultKey) -> Self {
        self.parent = Some(parent);
        self
    }
}

/// Represents any node in the filesystem.
///
/// The implications, purpose and expansion details depends on the variant.
#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum VirtualNodeData {
    /// A, possibly custom, grouping for organizational purposes.
    Group(GroupNode),

    /// Similar to Groups except they work on properties of objects and are the
    /// fundamental means of filtering the repository with ADT.
    Facet(FacetNode),

    /// An actual object in the repository that provides data such as source
    /// code, definitions or table contents and cant be expanded.
    ///
    /// Eclipse allows you to expand these nodes into the individual things defined
    /// in them, but that is not possible with vscode folders.
    RepositoryObject(RepositoryObjectNode),
}

impl From<VirtualFolder> for VirtualNodeData {
    fn from(value: VirtualFolder) -> Self {
        VirtualNodeData::Facet(FacetNode {
            name: value.display_name,
            value: value.name,
            facet: value.facet,
            has_children_of_same_facet: value.has_children_of_same_facet,
        })
    }
}

impl From<Object> for VirtualNodeData {
    fn from(value: Object) -> Self {
        VirtualNodeData::RepositoryObject(RepositoryObjectNode {
            name: value.name,
            object_kind: value.kind,
        })
    }
}

impl From<GroupNode> for VirtualNodeData {
    fn from(value: GroupNode) -> Self {
        Self::Group(value)
    }
}

impl From<FacetNode> for VirtualNodeData {
    fn from(value: FacetNode) -> Self {
        Self::Facet(value)
    }
}

impl From<RepositoryObjectNode> for VirtualNodeData {
    fn from(value: RepositoryObjectNode) -> Self {
        Self::RepositoryObject(value)
    }
}

/// Custom categorization of items into groups for organizational purposes.
///
/// How these nodes expand depends on the underlying group.
#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupNode {
    /// The display name of the group in the filesystem.
    pub name: String,

    /// The technical definition of the group.
    pub group: Group,
}

impl GroupNode {
    pub fn new(group: Group) -> Self {
        Self {
            name: group.display_name().into(),
            group,
        }
    }
}

/// Represents a facet node in the fileystem.
///
/// A facet referes to a specific attribute of an object. For example, an `Owner`
/// facet with the value `DEVELOPER` groups all objects created by `DEVELOPER`.
///
/// The main difference between a [Facet] compared to a [Group] is that they are
/// part of the ADT representation of the VFS rather than groupings we can may
/// create ourselves.
#[derive(Debug, Eq, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FacetNode {
    /// The display name of the facet.
    ///
    /// In the case of a `TYPE` facet, this could, for example, be `Classes` or `Programs`..
    pub name: String,

    /// The kind of facet, see [Facet]
    #[serde(skip)]
    pub facet: Facet,

    /// The technical name of the facet.
    ///
    /// In the case of a `TYPE` facet, this could, for example, be `CLAS` or `PROG`..
    #[serde(skip)]
    pub value: String,

    #[serde(skip)]
    pub has_children_of_same_facet: bool,
}

impl FacetNode {
    pub fn new<T>(facet: Facet, value: T, name: T, has_children_of_same_facet: bool) -> Self
    where
        T: Into<String>,
    {
        Self {
            facet,
            value: value.into(),
            name: name.into(),
            has_children_of_same_facet,
        }
    }
}

/// Represents a repository object node in the filesystem.
///
/// These nodes are generally leaf nodes as repository objects do not have successors.
#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryObjectNode {
    /// The name of the repository object
    pub name: String,

    /// The kind of object, e.g `PROG/P`, etc..
    pub object_kind: RepositoryObject,
}

/// Possible categorization options for [GroupNode]
#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Group {
    /// The system root
    System(#[serde(skip)] String),

    /// Categorizes nodes which are not part of the system library. This __does not__
    /// exclude local objects from other developers in the same system.
    LocalObjects,

    /// Categorizes nodes which are part of the public system library
    SystemLibrary,

    /// Categorizes nodes which the user has explicitly favorited.
    Favorites,
}

impl Group {
    pub fn display_name(&self) -> &str {
        match self {
            Self::System(name) => name.as_str(),
            Self::LocalObjects => "Local Objects",
            Self::SystemLibrary => "System Library",
            Self::Favorites => "Favorite Objects",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use slotmap::SlotMap;

    #[test]
    fn serialize_system_node() {
        let mut nodes = SlotMap::new();
        let root_group = GroupNode::new(Group::System("A4H".to_owned()));

        let key = nodes.insert_with_key(|k| VirtualNode::new(k, root_group));
        let node = nodes.get(key);
        let result = serde_json::to_string(&node).unwrap();
        assert_eq!(
            result,
            r#"{"id":{"idx":1,"version":1},"kind":"group","name":"A4H","group":"SYSTEM"}"#
        );
    }

    #[test]
    fn serialize_package() {
        let mut nodes = SlotMap::new();
        let package = FacetNode::new(Facet::Package, "DEVC/K", "/BUILD/", false);

        let key = nodes.insert_with_key(|k| VirtualNode::new(k, package));
        let node = nodes.get(key);
        let result = serde_json::to_string(&node).unwrap();
        assert_eq!(
            result,
            r#"{"id":{"idx":1,"version":1},"kind":"facet","name":"/BUILD/"}"#
        );
    }
}
