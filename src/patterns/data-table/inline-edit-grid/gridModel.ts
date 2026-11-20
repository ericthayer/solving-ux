/** Pure model for EditableGrid: the APG data grid keyboard map and per-editor validation. */
export type GridPosition = { row: number; col: number };

const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), Math.max(max, 0));

/**
 * Returns where focus should go for a navigation key, or null when the key is not a
 * navigation key. Tab is deliberately absent: it leaves the grid.
 */
export function nextPosition(key: string, ctrl: boolean, from: GridPosition, rows: number, cols: number): GridPosition | null {
  const lastRow = rows - 1;
  const lastCol = cols - 1;
  switch (key) {
    case 'ArrowUp':
      return { row: clamp(from.row - 1, lastRow), col: from.col };
    case 'ArrowDown':
      return { row: clamp(from.row + 1, lastRow), col: from.col };
    case 'ArrowLeft':
      return { row: from.row, col: clamp(from.col - 1, lastCol) };
    case 'ArrowRight':
      return { row: from.row, col: clamp(from.col + 1, lastCol) };
    case 'Home':
      return ctrl ? { row: 0, col: 0 } : { row: from.row, col: 0 };
    case 'End':
      return ctrl ? { row: clamp(lastRow, lastRow), col: clamp(lastCol, lastCol) } : { row: from.row, col: clamp(lastCol, lastCol) };
    default:
      return null;
  }
}

/** A single printable character with no modifier starts editing with that character, like a spreadsheet. */
export function isTypeToEdit(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>): boolean {
  return event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey;
}

export type CellEditor =
  | { kind: 'text'; required?: boolean }
  | { kind: 'number'; min?: number; max?: number; integer?: boolean }
  | { kind: 'select'; options: readonly string[] };

/** Built-in checks per editor kind. Messages are full sentences because they are read aloud. */
export function validateCell(editor: CellEditor, value: string, header: string): string | null {
  const trimmed = value.trim();
  if (editor.kind === 'text') return editor.required && !trimmed ? `${header} is required.` : null;
  if (editor.kind === 'select') return editor.options.includes(value) ? null : `Choose one of: ${editor.options.join(', ')}.`;
  const n = Number(trimmed);
  if (!trimmed || Number.isNaN(n)) return `${header} must be a number.`;
  if (editor.integer && !Number.isInteger(n)) return `${header} must be a whole number.`;
  if (editor.min !== undefined && n < editor.min) return `${header} must be at least ${editor.min}.`;
  if (editor.max !== undefined && n > editor.max) return `${header} must be ${editor.max} or less.`;
  return null;
}
