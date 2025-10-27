use ropey::Rope;
use tower_lsp::lsp_types::Position;
use tree_sitter::Point;

pub fn position_to_char_index(rope: &Rope, position: &Position) -> Option<usize> {
    let (line, column) = (position.line as usize, position.character as usize);
    if line >= rope.len_lines() {
        return None;
    }
    let line_start_char = rope.line_to_char(line);
    let line_start_cu = rope.char_to_utf16_cu(line_start_char);
    let line_text = rope.line(line);
    let line_cu_count = line_text.chars().map(|c| c.len_utf16()).sum::<usize>();
    if column > line_cu_count {
        return None;
    }
    Some(rope.utf16_cu_to_char(line_start_cu + column))
}

pub fn position_to_byte_offset(rope: &Rope, position: &Position) -> Option<usize> {
    position_to_char_index(rope, position).map(|v| rope.char_to_byte(v))
}

pub fn position_to_point(position: &Position) -> Point {
    Point {
        row: position.line as usize,
        column: position.character as usize,
    }
}
