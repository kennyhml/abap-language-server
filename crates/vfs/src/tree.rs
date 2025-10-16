use std::collections::HashMap;

use adt_query::RequestDispatch;

use crate::nodes::{External, Group, GroupNode, Internal, Node};

/// Represents a filesystem as tree of Nodes
pub struct VirtualFileTree {
    root: Node<Internal>,

    /// An additional index mapping package names to their nodes
    by_package: HashMap<String, Node<Internal>>,
}

impl VirtualFileTree {
    // Expands the given node
    pub async fn expand<T>(&mut self, node: &mut Node<Internal>, client: adt_query::Client<T>)
    where
        T: RequestDispatch,
    {
        // Impossible to expand repository objects
        if let Node::RepositoryObject(_) = node {
            return;
        }

        // First check whether it is a node that can be expanded statically, i.e
        // without making a request to the server because it expands into fixed nodes.
        if let Some(children) = try_expand_static(node) {
            node.assign(Some(children));
        }

        todo!()
    }

    /// Searches for a given node in the filetree and returns a reference to it.
    ///
    /// While the input is a node just like the output, the input is typically a deserialized
    /// variant which doesnt actually exist in the file tree and is more of a copy of the nodes data.
    pub fn lookup(&self, node: &Node<External>) -> Option<&Node<Internal>> {
        fn dfs<'a>(
            curr: &'a Node<Internal>,
            target: &Node<External>,
        ) -> Option<&'a Node<Internal>> {
            if curr == target {
                return Some(curr);
            }
            for child in curr.children()?.iter() {
                if let Some(found) = dfs(child, target) {
                    return Some(found);
                }
            }
            None
        }

        // If we know the package this node is part of we can possibly optimize lookup
        let package = match node {
            Node::Facet(f) => f.package.as_ref(),
            _ => None,
        };

        if let Some(package) = package {
            if let Some(pkg_node) = self.by_package.get(package) {
                return dfs(pkg_node, node);
            }
        }
        dfs(&self.root, node)
    }
}

fn try_expand_static(node: &Node<Internal>) -> Option<Vec<Node<Internal>>> {
    match node {
        Node::Group(GroupNode {
            group: Group::System,
            ..
        }) => Some(vec![
            Node::Group(GroupNode::new(Group::LocalObjects)),
            Node::Group(GroupNode::new(Group::SystemLibrary)),
            Node::Group(GroupNode::new(Group::Favorites)),
        ]),
        _ => None,
    }
}
