use std::collections::HashMap;

use crate::nodes::{External, FilesystemNode, Internal};

/// Represents a filesystem as tree of Nodes
pub struct VirtualFileTree {
    root: FilesystemNode<Internal>,

    /// An additional index mapping package names to their nodes
    by_package: HashMap<String, FilesystemNode<Internal>>,
}

impl VirtualFileTree {
    // Expands the given node
    pub fn expand(
        &self,
        node: &FilesystemNode<Internal>,
    ) -> Option<&Vec<FilesystemNode<Internal>>> {
        todo!()
    }

    /// Searches for a given node in the filetree and returns a reference to it.
    ///
    /// While the input is a node just like the output, the input is typically a deserialized
    /// variant which doesnt actually exist in the file tree and is more of a copy of the nodes data.
    pub fn lookup(&self, node: &FilesystemNode<External>) -> Option<&FilesystemNode<Internal>> {
        fn dfs<'a>(
            curr: &'a FilesystemNode<Internal>,
            target: &FilesystemNode<External>,
        ) -> Option<&'a FilesystemNode<Internal>> {
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
            FilesystemNode::Facet(f) => f.package.as_ref(),
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
