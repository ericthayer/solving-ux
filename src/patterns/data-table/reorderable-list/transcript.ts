import type { ScreenReaderTranscript } from '../../../types/transcript';

export const reorderableListTranscript: ScreenReaderTranscript = {
  patternId: 'data-table.reorderable-list',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab into the agenda to reorder it',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'Nothing in the list can take focus. Tab skips past all six rows to the next control on the page.' }],
      after: [
        { kind: 'speech', text: 'Meeting agenda, list with 6 items' },
        { kind: 'speech', text: 'Reorder Quarterly review, grouping' },
        { kind: 'speech', text: 'Move Quarterly review up, button, unavailable' },
      ],
      failure: 'Keyboard and switch users cannot reach the rows at all, so they cannot change the order.',
      criterion: '2.1.1',
    },
    {
      action: 'Move Quarterly review down one place',
      keys: 'Tab, Enter',
      before: [
        { kind: 'speech', text: 'Quarterly review' },
        { kind: 'silence', note: 'Read in browse mode as plain text. The only way to move it is to drag a 6px grip, which a screen reader or touch user cannot do.' },
      ],
      after: [
        { kind: 'speech', text: 'Move Quarterly review down, button' },
        { kind: 'speech', text: 'Moved Quarterly review to position 2 of 6.' },
      ],
      failure: 'Dragging is the only way to reorder, with no single-pointer alternative.',
      criterion: '2.5.7',
    },
    {
      action: 'Press the same button again',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'There is no button to press again.' }],
      after: [{ kind: 'speech', text: 'Moved Quarterly review to position 3 of 6.' }],
    },
    {
      action: 'Send Quarterly review straight to the end',
      keys: 'Tab, Alt+Down, End, Enter',
      before: [{ kind: 'silence', note: 'No such control. A mouse user has to drag past every row in between.' }],
      after: [
        { kind: 'speech', text: 'Position of Quarterly review, combo box, 3 of 6, collapsed' },
        { kind: 'speech', text: 'Moved Quarterly review to position 6 of 6.' },
      ],
    },
    {
      action: 'Drag Vendor renewals to the top with a mouse, screen reader on',
      before: [{ kind: 'silence', note: 'The rows change order under the user. At most a faint "order changed" appears, and nothing is spoken.' }],
      after: [{ kind: 'speech', text: 'Moved Vendor renewals to position 1 of 6.' }],
      failure: 'The move is visible only. A low-vision user running a screen reader alongside the mouse gets no confirmation of what moved or where.',
      criterion: '4.1.3',
    },
  ],
};
