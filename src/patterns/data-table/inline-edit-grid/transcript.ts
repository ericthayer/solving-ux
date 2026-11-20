import type { ScreenReaderTranscript } from '../../../types/transcript';

export const inlineEditGridTranscript: ScreenReaderTranscript = {
  patternId: 'data-table.inline-edit-grid',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab into the grid',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'No cell is focusable. Tab skips the whole grid and lands on the next control on the page.' }],
      after: [
        { kind: 'speech', text: 'Open orders, grid, Arrow keys move between cells. Enter or F2 edits, Escape cancels, Tab leaves the grid.' },
        { kind: 'speech', text: 'row 2, Order, column 1, PO-4100' },
      ],
      failure: 'Editing only starts on mouse hover, so keyboard and screen reader users cannot edit anything.',
      criterion: '2.1.1',
    },
    {
      action: 'Move to the Quantity cell',
      keys: 'Right arrow ×4',
      before: [{ kind: 'silence', note: 'Arrow keys scroll the page. There is no cell to move between.' }],
      after: [{ kind: 'speech', text: 'Quantity, column 5, 40' }],
    },
    {
      action: 'Start editing',
      keys: 'Enter',
      before: [{ kind: 'speech', text: 'edit, blank' }],
      after: [{ kind: 'speech', text: 'Quantity, PO-4100, Northwind Supply, edit, selected 40' }],
      failure: 'The hover input has no name. The user hears "edit" with no column or row.',
      criterion: '4.1.2',
    },
    {
      action: 'Type an invalid value and press Enter',
      keys: '1 2 x, Enter',
      before: [
        { kind: 'speech', text: '1 2 x' },
        { kind: 'silence', note: 'The border turns red. Nothing says the value is invalid or why.' },
      ],
      after: [
        { kind: 'speech', text: 'Quantity must be a number.' },
        { kind: 'speech', text: 'invalid entry' },
      ],
      failure: 'The error is color only and never announced.',
      criterion: '3.3.1',
    },
    {
      action: 'Fix the value and save',
      keys: 'Ctrl+A, 1 2 0, Enter',
      before: [{ kind: 'silence', note: 'Saved on blur. No confirmation; a failed request would vanish the same way.' }],
      after: [
        { kind: 'speech', text: 'Quantity, column 5, 120, Saving…' },
        { kind: 'speech', text: 'Saved Quantity for PO-4100, Northwind Supply.' },
      ],
      failure: 'The user cannot tell whether the edit was stored.',
      criterion: '4.1.3',
    },
    {
      action: 'Try to edit the Updated column',
      keys: 'Right arrow, Enter',
      before: [{ kind: 'silence', note: 'The cell looks like every other cell and ignores the keystroke.' }],
      after: [
        { kind: 'speech', text: 'Updated Read only, column 6, read only, Just now' },
        { kind: 'speech', text: 'Updated is read only.' },
      ],
    },
    {
      action: 'Leave the grid while editing',
      keys: 'Tab',
      before: [
        { kind: 'speech', text: 'edit, blank' },
        { kind: 'speech', text: 'edit, blank' },
        { kind: 'silence', note: 'Tab cycles between the row’s inputs forever.' },
      ],
      after: [{ kind: 'speech', text: 'Simulate failed saves, checkbox, not checked' }],
      failure: 'Focus is trapped inside the grid.',
      criterion: '2.1.2',
    },
  ],
};
