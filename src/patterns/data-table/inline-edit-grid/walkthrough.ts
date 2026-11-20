import type { CodeAnnotation } from '../../../types/walkthrough';

export const inlineEditGridWalkthrough: CodeAnnotation[] = [
  {
    id: 'clamped-position',
    anchor: '// Keep the roving tab stop inside the grid when rows are removed.',
    endAnchor: 'col: Math.min(active.col, columns.length - 1),',
    topic: 'resilience',
    title: 'The tab stop survives row changes',
    rationale:
      'The grid has exactly one tab stop: the active cell. If the parent deletes or filters rows and the active row disappears, a stored index would point at nothing and the whole grid would drop out of the tab order. Clamping on every render keeps one focusable cell as long as any row exists.',
    wcag: ['2.1.1'],
  },
  {
    id: 'focus-after-commit',
    anchor: '// Focus moves after React commits, so the element being focused always exists.',
    endAnchor: 'else el.setSelectionRange(el.value.length, el.value.length);',
    topic: 'focus',
    title: 'Focus is moved after render, not during the key press',
    rationale:
      'Opening an editor or closing one swaps elements inside the cell. Handlers only record where focus should go; this effect moves it once the new element is in the DOM. Starting with Enter selects the old value so typing replaces it; starting by typing keeps the caret after the typed character, like a spreadsheet.',
    wcag: ['2.4.3'],
  },
  {
    id: 'per-cell-save',
    anchor: 'const save = (row: T, col: GridColumn<T>, value: string): void => {',
    endAnchor: "setAnnouncement(`Couldn't save ${where}. ${message} Press Enter on the cell to retry.`);",
    topic: 'announce',
    title: 'Every cell owns its save state',
    rationale:
      'A grid-wide spinner cannot tell the user which of twenty edits failed. Each cell moves through saving, saved, and failed on its own, and the failed state keeps the typed value so nothing is lost. Both outcomes are announced with the column and row, because focus has usually moved on by the time the server answers.',
    wcag: ['4.1.3'],
  },
  {
    id: 'never-drop-edit',
    anchor: '// Never drop an unfinished edit: send the user back to it.',
    endAnchor: "setAnnouncement('Finish or cancel the open edit first.');",
    topic: 'resilience',
    title: 'An invalid draft is never thrown away',
    rationale:
      'An invalid draft stays open when focus leaves it. If the user then tries to edit another cell, the grid returns focus to the open editor and says why, instead of silently replacing the draft. Data the user typed is only discarded by an explicit Escape.',
    wcag: ['3.3.1'],
  },
  {
    id: 'validate-before-save',
    anchor: 'const commit = (): boolean => {',
    endAnchor: 'setAnnouncement(error);',
    topic: 'state',
    title: 'Validation runs before anything is sent',
    rationale:
      'Built-in checks per editor kind run first, then the column’s own rule, which sees the whole row (closed orders cannot change quantity). The error is stored on the open edit so the editor can render it as text and mark itself invalid, and it is announced because the focused input’s description does not re-read on its own.',
    wcag: ['3.3.1', '4.1.3'],
  },
  {
    id: 'navigation-keys',
    anchor: 'const onCellKeyDown = (event: KeyboardEvent<HTMLElement>, r: number, c: number): void => {',
    endAnchor: 'startEdit(r, c, event.key);',
    topic: 'focus',
    title: 'Navigation mode follows the APG data grid',
    rationale:
      'Arrow keys, Home, End, and Ctrl+Home/End move between cells; the mapping lives in gridModel.ts so it can be unit tested without a DOM. Enter and F2 open the editor, and typing a character opens it with that character. Tab is deliberately not handled, so it leaves the grid in one keystroke. Keys from inside the editor are ignored here so arrow keys move the caret.',
    wcag: ['2.1.1'],
  },
  {
    id: 'escape-cancels',
    anchor: "} else if (event.key === 'Escape') {",
    endAnchor: "setAnnouncement('Edit canceled.');",
    topic: 'focus',
    title: 'Escape always gets the user out',
    rationale:
      'Escape closes the editor, restores the old value, puts focus back on the cell, and says so. This is the guaranteed exit even when the draft is invalid, which is what keeps edit mode from becoming a keyboard trap.',
    wcag: ['2.1.2'],
  },
  {
    id: 'blur-commits',
    anchor: '// Tab and pointer clicks leave the editor by blurring it: valid drafts save, invalid ones stay open.',
    endAnchor: 'else commit();',
    topic: 'focus',
    title: 'Tab saves and leaves; it never cycles',
    rationale:
      'The audited grid intercepted Tab to cycle between the row’s inputs forever. Here Tab keeps its native meaning, and the blur it causes commits the edit. Enter and Escape set skipBlur so their own focus move back to the cell does not commit twice.',
    wcag: ['2.1.2'],
  },
  {
    id: 'editor-name',
    anchor: "'aria-label': `${col.header}, ${rowLabel(row)}`,",
    endAnchor: "'aria-describedby': open.error ? errorId : undefined,",
    topic: 'semantics',
    title: 'The editor says where it is and what is wrong',
    rationale:
      'Inside an editor the screen reader no longer announces the column header, so the input is named by column and row: "Quantity, PO-4100, Northwind Supply". aria-invalid and aria-describedby tie the error sentence to the input, so it is heard again whenever the user returns to it.',
    wcag: ['4.1.2', '3.3.1'],
  },
  {
    id: 'retry',
    anchor: "{status.status === 'failed' && (",
    endAnchor: '</button>',
    topic: 'resilience',
    title: 'Failed saves stay visible with a retry',
    rationale:
      'The failure is written in the cell as text with an icon, not just tinted red. Retry is a real button for pointer users; it is tabindex -1 so the grid keeps a single tab stop, and keyboard users retry with Enter on the cell, which reopens the editor with the failed value.',
    wcag: ['3.3.1', '1.4.1'],
  },
  {
    id: 'grid-role',
    anchor: 'role="grid" aria-labelledby={captionId} aria-describedby={helpId}',
    topic: 'semantics',
    title: 'A native table promoted to a grid',
    rationale:
      'role="grid" tells screen readers that arrow keys belong to the widget, so they switch to focus mode instead of reading the page. The caption names it and the visible instructions describe it, so the key map is announced once on entry and is visible to sighted keyboard users too.',
    wcag: ['1.3.1', '3.3.2'],
  },
  {
    id: 'roving-tabindex',
    anchor: 'tabIndex: position.row === r && position.col === c && !open ? 0 : -1,',
    topic: 'focus',
    title: 'Roving tabindex',
    rationale:
      'Only the active cell is in the tab order. A 50-row, 6-column grid costs one Tab instead of 300, and returning to the grid lands on the last cell the user was on. While a cell is editing, its input takes over as the tab stop.',
    wcag: ['2.1.1', '2.4.3'],
  },
  {
    id: 'readonly',
    anchor: 'aria-readonly={col.editor ? undefined : true}',
    topic: 'semantics',
    title: 'Read-only is stated, not implied',
    rationale:
      'Cells without an editor carry aria-readonly, so a screen reader says "read only" on arrival. The header adds a visible "Read only" tag and the cell is styled as sunken, and pressing Enter explains instead of silently doing nothing.',
    wcag: ['4.1.2'],
  },
  {
    id: 'status-region',
    anchor: '<p role="status" className={styles.visuallyHidden}>',
    topic: 'announce',
    title: 'One polite status region',
    rationale:
      'Saves finish after focus has moved on, so results cannot rely on the focused element. A single polite region at the end of the component announces each result once, without interrupting typing in the next cell.',
    wcag: ['4.1.3'],
  },
  {
    id: 'inset-focus-ring',
    file: 'styles',
    anchor: '/* The active cell gets an inset ring so it is never clipped by the scroller or a sticky neighbour. */',
    endAnchor: 'outline-offset: -2px;',
    topic: 'styling',
    title: 'A focus ring that cannot be clipped',
    rationale:
      'Cells sit inside a scroll container next to a sticky row-header column. An outside outline would be cut off at the edges or hidden under the sticky column, so the ring is drawn inside the cell.',
    wcag: ['2.4.7'],
  },
  {
    id: 'not-color-alone',
    file: 'styles',
    anchor: '/* Invalid state is carried by border weight, an icon, and text, never colour alone. */',
    endAnchor: "border: 2px solid var(--sux-danger, #b42318);",
    topic: 'styling',
    title: 'Errors are more than red',
    rationale:
      'The invalid editor doubles its border width, and the message beside it has an icon and a sentence. A user who cannot see red still sees a heavier box, an exclamation mark, and words that say what to fix.',
    wcag: ['1.4.1'],
  },
];
