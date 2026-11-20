import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const inlineEditGridPattern: PatternDefinition = {
  id: 'data-table.inline-edit-grid',
  slug: 'inline-edit-grid',
  title: 'Inline cell editing grid',
  summary: 'Spreadsheet-style editing in a data grid: arrow-key navigation, Enter or F2 to edit, per-cell save state with retry, and text validation errors.',
  category: 'data-table',
  tags: ['grid', 'inline editing', 'keyboard', 'validation', 'roving tabindex'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Power users update dozens of records at a time and will not open a form per row. Teams ship "editable tables" where cells turn into inputs on mouse hover, so keyboard and screen reader users cannot edit at all. Edits save on blur with no confirmation, failed saves disappear, invalid values get a red border and nothing else, read-only columns look identical to editable ones, and once inside the grid Tab cycles between inputs with no way out.',
  beforeState: {
    summary: 'An order grid that becomes editable on hover and autosaves every keystroke.',
    failures: [
      {
        id: 'hover-to-edit',
        description: 'Cells are not focusable and only become inputs on mouse hover; keyboard users cannot start an edit, and the input has no name.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'First Customer cell' },
      },
      {
        id: 'silent-save',
        description: 'Edits save on blur with no saving, saved, or failed state, so a dropped request looks like success.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'wcag', criterion: '4.1.3' }],
        target: { label: 'Grid body' },
      },
      {
        id: 'color-only-error',
        description: 'An invalid quantity is shown only by a red border, with no message saying what is wrong or how to fix it.',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }, { kind: 'wcag', criterion: '3.3.1' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: 'Quantity "12x" in the second row' },
      },
      {
        id: 'readonly-unmarked',
        description: 'The Updated column looks editable and silently ignores input; nothing marks it read-only visually or programmatically.',
        refs: [{ kind: 'wcag', criterion: '4.1.2' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'First Updated cell' },
      },
      {
        id: 'tab-trap',
        description: 'Inside an editor, Tab cycles through the row’s inputs forever; only the mouse gets out.',
        refs: [{ kind: 'wcag', criterion: '2.1.2' }, { kind: 'heuristic', id: 'H3' }],
        target: { label: 'Grid editors' },
      },
    ],
  },
  designRationale:
    'The grid follows the APG data grid: one tab stop, arrow keys between cells, so a 50-row grid costs one Tab instead of 300. Editing is a separate mode entered with Enter, F2, double-click, or by typing, and left with Enter (save), Escape (cancel), or Tab (save and leave the grid), so the user is never trapped. Each cell carries its own saving, saved, or failed state, because a grid-wide spinner cannot say which of twenty edits failed. Failed values stay on screen with a Retry, so nothing typed is lost. Validation errors are sentences tied to the input, and read-only columns are marked in the header, the cell styling, and aria-readonly.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'caption', type: 'string', required: true, description: 'Visible caption. Names the grid.' },
    { name: 'rows', type: 'T[] (T extends { id: string })', required: true, description: 'Row data. Update it when onCommit resolves; the grid shows the pending value until then.' },
    { name: 'columns', type: 'GridColumn<T>[]', required: true, description: 'key, header, align, format, and an optional editor (text, number, or select) plus validate. Columns without an editor are read-only. The first column is the row header.' },
    { name: 'rowLabel', type: '(row: T) => string', required: true, description: 'Names the row in editor labels and announcements, e.g. "PO-4100, Northwind Supply".' },
    { name: 'onCommit', type: '(rowId, key, value: string) => Promise<void>', required: true, description: 'Persists one cell. Reject with an Error; its message is shown in the cell and announced.' },
  ],
  usage: `<EditableGrid<Order>
  caption="Open orders"
  rows={orders}
  columns={[
    { key: 'id', header: 'Order' },
    { key: 'quantity', header: 'Quantity', align: 'end', editor: { kind: 'number', integer: true, min: 1 } },
  ]}
  rowLabel={(order) => order.id}
  onCommit={(id, key, value) => api.patchOrder(id, { [key]: value })}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'Every cell is reachable with arrow keys, Home, End, and Ctrl+Home/End; every edit can be started, saved, and canceled from the keyboard.' },
    { kind: 'wcag', criterion: '2.1.2', level: 'A', title: 'No keyboard trap', detail: 'Escape always leaves the editor, and Tab leaves the grid from either mode. An invalid draft stays open but never holds focus.' },
    { kind: 'wcag', criterion: '3.3.1', level: 'A', title: 'Error identification', detail: 'Validation errors are full sentences linked to the input with aria-describedby and aria-invalid, with an icon and a heavier border so color is not the only signal.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Saved, failed, canceled, and validation results are announced through a role="status" region without moving focus.' },
    { kind: 'keyboard', keys: 'Arrow keys, Home, End, Ctrl+Home, Ctrl+End', action: 'Move between cells.' },
    { kind: 'keyboard', keys: 'Enter, F2, or start typing', action: 'Edit the focused cell. Typing replaces the value.' },
    { kind: 'keyboard', keys: 'Enter / Escape', action: 'Save and return to the cell / cancel and restore the old value.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Leave the grid. From an editor, saves first.' },
    { kind: 'aria', attribute: 'role="grid" + roving tabindex', detail: 'Only the active cell has tabindex="0", so the grid is one tab stop and focus is remembered when returning.' },
    { kind: 'aria', attribute: 'aria-readonly', detail: 'Set on cells in columns without an editor. The header also says "Read only".' },
    { kind: 'screen-reader', title: 'Editing a cell', detail: 'The editor is named by column and row, e.g. "Quantity, PO-4100, Northwind Supply, edit".' },
    { kind: 'screen-reader', title: 'Failed save', detail: 'Hears "Couldn’t save Quantity for PO-4100, Northwind Supply. The server is not responding. Press Enter on the cell to retry."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
