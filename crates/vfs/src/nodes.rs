use adt_query::models::vfs::{Facet, RepositoryObject};
use serde::{Deserialize, Serialize};

pub trait NodeDetail {
    type Facet: Default + std::fmt::Debug;
    type Group: Default + std::fmt::Debug;
}

pub type External = ();

#[derive(Default, Debug)]
pub struct Internal {}

impl NodeDetail for External {
    type Facet = External;
    type Group = External;
}

impl NodeDetail for Internal {
    type Facet = FacetInternal;
    type Group = GroupInternal;
}

/// Represents any node in the filesystem.
///
/// The implications, purpose and expansion details depends on the variant.
#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FilesystemNode<T: NodeDetail> {
    /// A, possibly custom, grouping for organizational purposes.
    Group(GroupNode<T::Group>),

    /// Similar to Groups except they work on properties of objects and are the
    /// fundamental means of filtering the repository with ADT.
    Facet(FacetNode<T::Facet>),

    /// An actual object in the repository that provides data such as source
    /// code, definitions or table contents and cant be expanded.
    ///
    /// Eclipse allows you to expand these nodes into the individual things defined
    /// in them, but that is not possible with vscode folders.
    RepositoryObject(RepositoryObjectNode),
}

impl FilesystemNode<Internal> {
    pub fn children(&self) -> Option<&Vec<FilesystemNode<Internal>>> {
        match self {
            FilesystemNode::Facet(f) => f.detail.children.as_ref(),
            FilesystemNode::Group(g) => g.detail.children.as_ref(),
            FilesystemNode::RepositoryObject(..) => None,
        }
    }
}

impl PartialEq<FilesystemNode<Internal>> for FilesystemNode<External> {
    fn eq(&self, other: &FilesystemNode<Internal>) -> bool {
        match (self, other) {
            (FilesystemNode::Group(g1), FilesystemNode::Group(g2)) => g1 == g2,
            (FilesystemNode::Facet(f1), FilesystemNode::Facet(f2)) => f1 == f2,
            (FilesystemNode::RepositoryObject(r1), FilesystemNode::RepositoryObject(r2)) => {
                r1 == r2
            }
            _ => false,
        }
    }
}

impl PartialEq<FilesystemNode<External>> for FilesystemNode<Internal> {
    fn eq(&self, other: &FilesystemNode<External>) -> bool {
        other == self
    }
}

/// Custom categorization of items into groups for organizational purposes.
///
/// How these nodes expand depends on the underlying group.
#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupNode<T> {
    /// The display name of the group in the filesystem.
    name: String,

    /// The technical definition of the group.
    group: Group,

    #[serde(skip)]
    detail: T,
}

impl PartialEq<GroupNode<External>> for GroupNode<GroupInternal> {
    fn eq(&self, other: &GroupNode<External>) -> bool {
        self.name == other.name && self.group == other.group
    }
}

impl PartialEq<GroupNode<GroupInternal>> for GroupNode<External> {
    fn eq(&self, other: &GroupNode<GroupInternal>) -> bool {
        other == self
    }
}

#[derive(Debug, Default)]
pub struct GroupInternal {
    /// The children of the group node, i.e the nodes it groups together.
    ///
    /// Not included in serialization as we never send more than a layer of children
    /// per request from the client (one expand only).
    children: Option<Vec<FilesystemNode<Internal>>>,
}

/// Represents a facet node in the fileystem.
///
/// A facet referes to a specific attribute of an object. For example, an `Owner`
/// facet with the value `DEVELOPER` groups all objects created by `DEVELOPER`.
///
/// The main difference between a [Facet] compared to a [Group] is that they are
/// part of the ADT representation of the VFS rather than groupings we can may
/// create ourselves.
#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FacetNode<T> {
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

    /// If the facet is not itself a `PACKAGE` facet, then the parent package in the hierarchy.
    ///
    /// This is needed to uniquely identify the position of the facet in the filesystem, as
    /// packages generally expand into the same structure.
    pub package: Option<String>,

    #[serde(skip)]
    detail: T,
}

impl PartialEq<FacetNode<FacetInternal>> for FacetNode<External> {
    fn eq(&self, other: &FacetNode<FacetInternal>) -> bool {
        self.facet == other.facet
            && self.name == other.name
            && self.technical_name == other.technical_name
            && self.package == other.package
    }
}

impl PartialEq<FacetNode<External>> for FacetNode<FacetInternal> {
    fn eq(&self, other: &FacetNode<External>) -> bool {
        other == self
    }
}

#[derive(Debug, Default)]
pub struct FacetInternal {
    /// The children of the group node, i.e the nodes it groups together.
    ///
    /// Not included in serialization as we never send more than a layer of children
    /// per request from the client (one expand only).
    pub children: Option<Vec<FilesystemNode<Internal>>>,

    /// Whether this node has child facets of the same kind. This is typically the case with
    /// packages that contain sub-packages. Since packages and other facets need to be fetched
    /// individually, this helps optimize that additional fetch away if we know it is not needed.
    pub has_children_of_same_facet: bool,
}

/// Represents a repository object node in the filesystem.
///
/// These nodes are generally leaf nodes as repository objects do not have successors.
#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryObjectNode {
    /// The name of the repository object
    name: String,

    /// The kind of object, e.g `PROG/P`, etc..
    object_kind: RepositoryObject,
}

/// Possible categorization options for [GroupNode]
#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Group {
    /// The system root
    System,

    /// Categorizes nodes which are not part of the system library. This __does not__
    /// exclude local objects from other developers in the same system.
    LocalObjects,

    /// Categorizes nodes which are part of the public system library
    SystemLibrary,

    /// Categorizes nodes which the user has explicitly favorited.
    Favorites,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn internal_group_serializes_without_detail() {
        let node = FilesystemNode::<Internal>::Group(GroupNode {
            name: "Test123".into(),
            group: Group::Favorites,
            detail: GroupInternal { children: None },
        });

        let result = serde_json::to_string(&node).unwrap();
        assert_eq!(
            result,
            r#"{"kind":"group","name":"Test123","group":"FAVORITES"}"#
        );
    }

    #[test]
    fn deserializes_external_group() {
        let content = r#"{"kind":"group","name":"Test123","group":"FAVORITES"}"#;

        let node: FilesystemNode<External> = serde_json::from_str(&content).unwrap();
        assert_eq!(
            node,
            FilesystemNode::<External>::Group(GroupNode {
                name: "Test123".into(),
                group: Group::Favorites,
                detail: ()
            })
        )
    }
}
