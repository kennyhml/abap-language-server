use tree_sitter::Parser;

pub fn load_parser() -> Parser {
    let mut parser = Parser::new();
    parser
        .set_language(&tree_sitter_abap::LANGUAGE.into())
        .expect("Error loading grammar");

    parser
}

#[cfg(test)]
mod tests {
    use tree_sitter::Node;
    use tree_sitter::StreamingIterator;
    use tree_sitter::StreamingIteratorMut;
    use tree_sitter::{InputEdit, Language, Parser, Point, Query, QueryCursor};

    use crate::parser::load_parser;

    #[test]
    fn test() {
        let source_code = r#"
data: l_s_valsid   type rrsi_s_valsid,
data: l_s_chavl    like gt_s_chavl,
data: l_s_sidtab   type /BI0/SCURRENCY,
data: l_t_sidtab   type /BI0/SCURRENCY,
data: l_t_upd_key(30)  type c,
data: l_len_nc     type i.
        "#;

        let query = Query::new(
            &tree_sitter_abap::LANGUAGE.into(),
            tree_sitter_abap::HIGHLIGHTS_QUERY,
        )
        .unwrap();

        let mut tree = {
            let mut parser = load_parser();
            parser.parse(source_code, None).unwrap()
        };

        let mut cursor = QueryCursor::new();

        let mut matches = cursor.matches(&query, tree.root_node(), source_code.as_bytes());

        while let Some(mat) = matches.next() {
            for capture in mat.captures {
                let node = capture.node;
                let capture_name = query.capture_names()[capture.index as usize];

                let text = get_node_text(&node, source_code);
                let start = node.start_position();
                let end = node.end_position();

                println!(
                    "TAG: {} @ {}:{}–{}:{} '{}'",
                    capture_name, start.row, start.column, end.row, end.column, text
                );
            }
        }

        fn get_node_text<'a>(node: &'a Node, source: &'a str) -> &'a str {
            let start = node.start_byte() as usize;
            let end = node.end_byte() as usize;
            &source[start..end]
        }
    }
}
