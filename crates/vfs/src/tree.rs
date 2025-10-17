use crate::nodes::{FacetNode, Group, GroupNode, VirtualNode, VirtualNodeData};
use adt_query::{
    RequestDispatch,
    api::repository::{RepositoryContent, RepositoryContentBuilder},
    dispatch::StatelessDispatch,
    models::vfs::{Facet, Preselection},
    operation::Operation,
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

    pub fn root(&self) -> DefaultKey {
        self.root
    }

    pub fn lookup(&self, id: DefaultKey) -> Option<&VirtualNode> {
        self.nodes.get(id)
    }

    pub fn lookup_all(&self, ids: &[DefaultKey]) -> Vec<&VirtualNode> {
        ids.iter().map(|id| self.lookup(*id).unwrap()).collect()
    }

    pub async fn expand<T>(&mut self, id: DefaultKey, client: &AdtClient<T>) -> Vec<&VirtualNode>
    where
        T: RequestDispatch,
    {
        let nodes = {
            let node = self.lookup(id).unwrap();
            let expander = match &node.data {
                VirtualNodeData::Facet(facet) => self.build_facet_expander(&facet, node.id),
                VirtualNodeData::Group(group) => self.build_group_expander(&group),
                _ => panic!(),
            };

            match expander {
                Expander::Static(nodes) => nodes,
                Expander::Query(queries) => self.execute_queries(queries, client).await,
            }
        };

        let mut ids: Vec<DefaultKey> = vec![];

        for child in nodes {
            let new_id = self
                .nodes
                .insert_with_key(|k| VirtualNode::new(k, child).parent(id));
            let node = self.nodes.get_mut(id).unwrap();
            node.children.get_or_insert_default().push(id);
            ids.push(new_id);
        }

        self.lookup_all(&ids)
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
        client: &AdtClient<T>,
    ) -> Vec<VirtualNodeData>
    where
        T: RequestDispatch,
    {
        for q in &queries {
            println!("{:?}", q.body());
        }
        let mut nodes: Vec<VirtualNodeData> = vec![];
        let futures = queries
            .into_iter()
            .map(|query| async move { query.dispatch(&client).await });

        let results = futures_util::future::join_all(futures).await;

        for result in results {
            let body = result.unwrap().take().into_body();
            for folder in body.folders {
                if !folder.name.starts_with("..") {
                    nodes.push(folder.into());
                }
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
        let mut request_directly_assigned = false;

        // Cant requests different facets in one go, so do packages first if needed.
        if matches!(node.facet, Facet::Package) && node.has_children_of_same_facet {
            let mut query = RepositoryContentBuilder::default();
            query
                .push_preselection(Preselection::new(node.facet.clone(), &node.value))
                .wanted_facets(Facet::Package);
            queries.push(query.build().unwrap());
            request_directly_assigned = true;
        }

        let mut query = RepositoryContentBuilder::default();
        for (facet, value) in self.walk_facets_from(id) {
            if (matches!(facet, Facet::Package) && request_directly_assigned) {
                query.push_preselection(Preselection::new(facet.clone(), format!("..{value}")));
            } else {
                query.push_preselection(Preselection::new(facet.clone(), value));
            }
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
            Group::Favorites => {
                query.push_preselection(Preselection::new(Facet::Favorites, "$DEVELOPER"))
            }
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

#[cfg(test)]
mod tests {
    //! Temporary tests, should move these to integration tests later (we dont want connections in unit tests)
    use super::*;
    use adt_query::{
        ClientBuilder, ConnectionParameters, HttpConnectionBuilder, auth::Credentials,
    };
    use reqwest;
    use std::str::FromStr as _;
    use url::Url;

    fn test_client() -> AdtClient<reqwest::Client> {
        let params = HttpConnectionBuilder::default()
            .hostname(Url::from_str("http://localhost:50000").unwrap())
            .client("001")
            .language("en")
            .build()
            .unwrap();

        ClientBuilder::default()
            .connection_params(ConnectionParameters::Http(params))
            .credentials(Credentials::new("DEVELOPER", "ABAPtr2022#01"))
            .dispatcher(reqwest::Client::new())
            .build()
            .unwrap()
    }

    #[tokio::test]
    async fn test_expand_static_root() {
        let mut tree = VirtualFileTree::new("A4H".to_owned());
        let root = tree.root();
        let client = test_client();

        let result = tree.expand(root, &client).await;
        let serialized = serde_json::to_string(&result).unwrap();
        assert_eq!(
            serialized,
            concat!(
                r#"[{"id":{"idx":2,"version":1},"kind":"group","name":"Local Objects","group":"LOCAL_OBJECTS"},"#,
                r#"{"id":{"idx":3,"version":1},"kind":"group","name":"System Library","group":"SYSTEM_LIBRARY"},"#,
                r#"{"id":{"idx":4,"version":1},"kind":"group","name":"Favorite Objects","group":"FAVORITES"}]"#
            )
        )
    }

    #[tokio::test]
    async fn test_expand_local_objects() {
        let mut tree = VirtualFileTree::new("A4H".to_owned());
        let root = tree.root();
        let client = test_client();

        let result = tree.expand(root, &client).await;

        let local = result
            .iter()
            .find(|v| v.name() == "Local Objects")
            .unwrap()
            .id;

        let result = tree.expand(local, &client).await;
        let serialized = serde_json::to_string(&result).unwrap();
        assert_eq!(
            serialized,
            r#"[{"id":{"idx":5,"version":1},"kind":"facet","name":"DEVELOPER"}]"#
        );
    }
}
