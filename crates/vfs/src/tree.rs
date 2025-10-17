use std::sync::Arc;

use crate::nodes::{FacetNode, Group, GroupNode, VirtualNode, VirtualNodeData};
use adt_query::{
    RequestDispatch,
    api::repository::{RepositoryContent, RepositoryContentBuilder},
    dispatch::StatelessDispatch,
    models::vfs::{Facet, Preselection},
};
use slotmap::{DefaultKey, SlotMap};

type AdtClient<T> = adt_query::Client<T>;

/// Represents a filesystem as tree of Nodes
pub struct VirtualFileTree {
    root: DefaultKey,
    nodes: SlotMap<DefaultKey, VirtualNode>,
}

enum Expander<'a> {
    Static(Vec<VirtualNodeData>),
    Query(Vec<RepositoryContent<'a>>),
}

impl VirtualFileTree {
    pub fn new(system: String) -> Self {
        let mut nodes = SlotMap::new();

        let root_group = GroupNode::new(Group::System(system));
        let root = nodes.insert_with_key(|k| VirtualNode::new(k, root_group));
        Self { nodes, root }
    }

    pub fn root(&self) -> Option<&VirtualNode> {
        self.lookup(self.root)
    }

    pub fn lookup(&self, id: DefaultKey) -> Option<&VirtualNode> {
        self.nodes.get(id)
    }

    pub fn lookup_all(&self, ids: &[DefaultKey]) -> Vec<&VirtualNode> {
        ids.iter().map(|id| self.lookup(*id).unwrap()).collect()
    }

    pub async fn expand<T>(
        &mut self,
        node: &mut VirtualNode,
        client: Arc<AdtClient<T>>,
    ) -> Vec<&VirtualNode>
    where
        T: RequestDispatch,
    {
        let expander = match &node.data {
            VirtualNodeData::Facet(facet) => self.build_facet_expander(&facet, node.id),
            VirtualNodeData::Group(group) => self.build_group_expander(&group),
            _ => panic!(),
        };

        let nodes = match expander {
            Expander::Static(nodes) => nodes,
            Expander::Query(queries) => self.execute_queries(queries, client).await,
        };

        for child in nodes {
            let id = self
                .nodes
                .insert_with_key(|k| VirtualNode::new(k, child).parent(node.id));
            node.children.get_or_insert_default().push(id);
        }

        self.lookup_all(node.children.as_ref().unwrap_or(&vec![]))
    }

    pub async fn refresh<T>(&mut self, _node: VirtualNode, _client: AdtClient<T>)
    where
        T: RequestDispatch,
    {
        todo!()
    }

    async fn execute_queries<T>(
        &self,
        queries: Vec<RepositoryContent<'_>>,
        client: Arc<AdtClient<T>>,
    ) -> Vec<VirtualNodeData>
    where
        T: RequestDispatch,
    {
        let mut nodes: Vec<VirtualNodeData> = vec![];
        let futures = queries.into_iter().map(|query| {
            let client = Arc::clone(&client);
            async move { query.dispatch(&client).await }
        });

        let results = futures::future::join_all(futures).await;

        for result in results {
            let body = result.unwrap().take().into_body();
            for folder in body.folders {
                nodes.push(folder.into());
            }
            for obj in body.objects {
                nodes.push(obj.into());
            }
        }
        nodes
    }

    /// Builds an expander for a facet node.
    ///
    /// Because [Facet::Package] falls under this category, the handling is a little more complex.
    fn build_facet_expander<'a>(&'a self, node: &'a FacetNode, id: DefaultKey) -> Expander<'a> {
        let mut queries = vec![];

        // Cant requests different facets in one go, so do packages first if needed.
        if matches!(node.facet, Facet::Package) && node.has_children_of_same_facet {
            let mut query = RepositoryContentBuilder::default();
            query
                .push_preselection(Preselection::new(node.facet.clone(), &node.value))
                .wanted_facets(Facet::Package);
            queries.push(query.build().unwrap());
        }

        let mut query = RepositoryContentBuilder::default();
        for (facet, value) in self.walk_facets_from(id) {
            query.push_preselection(Preselection::new(facet.clone(), value));
        }

        // If the facet doesnt expand into more facets itself, then it expands into
        // repository objects in which case we need to leave wanted facets empty.
        if let Some(sub_facet) = node.facet.expands_into() {
            query.wanted_facets(sub_facet);
        }

        queries.push(query.build().unwrap());
        Expander::Query(queries)
    }

    fn build_group_expander(&self, node: &GroupNode) -> Expander<'_> {
        let mut query = RepositoryContentBuilder::default();

        match node.group {
            Group::System(_) => {
                return Expander::Static(vec![
                    GroupNode::new(Group::LocalObjects).into(),
                    GroupNode::new(Group::SystemLibrary).into(),
                    GroupNode::new(Group::Favorites).into(),
                ]);
            }
            Group::Favorites => query
                .push_preselection(Preselection::new(Facet::Owner, "$DEVELOPER"))
                .wanted_facets(Facet::Favorites),
            Group::LocalObjects => query
                .push_preselection(Preselection::new(Facet::Owner, "DEVELOPER"))
                .push_preselection(Preselection::new(Facet::Package, "$TMP"))
                .wanted_facets(Facet::Owner),
            Group::SystemLibrary => query.wanted_facets(Facet::Package),
        };

        Expander::Query(vec![query.build().unwrap()])
    }

    /// Returns a list of all facets and their value in the path from the root to this node.
    ///
    /// If the node at the given ID is itself a facet, it is also included.
    fn walk_facets_from(&self, id: DefaultKey) -> Vec<(&Facet, &str)> {
        let mut result = vec![];
        let mut curr = self.lookup(id);

        while let Some(node) = curr {
            match &node.data {
                VirtualNodeData::Facet(FacetNode { facet, value, .. }) => {
                    result.push((facet, value.as_str()))
                }
                _ => {}
            }
            curr = node.parent.and_then(|id| self.lookup(id));
        }
        result
    }
}
