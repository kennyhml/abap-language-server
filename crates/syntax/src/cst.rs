use tree_sitter::{Parser, Tree};

use crate::{parser::load_parser, tokens::SemanticToken};

#[derive(Debug)]
pub struct SyntaxTree {
    cst: Tree,
}

impl SyntaxTree {
    pub fn new(cst: Tree) -> Self {
        Self { cst }
    }

    pub fn parse(source: &str) -> Self {
        let mut parser = load_parser();
        Self {
            cst: parser.parse(source, None).unwrap(),
        }
    }

    pub fn semantic_tokens(&self) -> Vec<SemanticToken> {
        todo!()
    }
}
