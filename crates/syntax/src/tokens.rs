use std::ops::Index;

#[repr(u32)]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum TokenType {
    Variable = 0,
    Keyword = 1,
    Number = 2,
    String = 3,
    Type = 4,
}

impl TokenType {
    pub const fn index(&self) -> u32 {
        *self as u32
    }

    pub const ALL: &'static [TokenType] = &[
        TokenType::Variable,
        TokenType::Keyword,
        TokenType::Number,
        TokenType::String,
        TokenType::Type,
    ];

    pub const fn names() -> &'static [&'static str] {
        &["variable", "keyword", "number", "string", "type"]
    }

    pub fn from_name(name: &str) -> Self {
        let idx = Self::names().iter().position(|n| *n == name).unwrap();
        Self::ALL[idx]
    }
}

#[repr(u32)]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum TokenModifier {
    Declaration = 0,
}

#[derive(Debug, Eq, PartialEq, Copy, Clone)]
pub struct SemanticToken {
    pub start_byte: usize,
    pub row: u32,
    pub column: u32,
    pub length: u32,

    pub token_type: TokenType,
    pub token_modifiers_bitset: TokenModifier,
}
