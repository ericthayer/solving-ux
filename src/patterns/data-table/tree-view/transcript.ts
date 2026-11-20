import type { ScreenReaderTranscript } from '../../../types/transcript';

export const treeViewTranscript: ScreenReaderTranscript = {
  patternId: 'data-table.tree-view',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab into the hierarchy',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'check box, not checked' }],
      after: [{ kind: 'speech', text: 'Account hierarchy, tree view, North region, expanded, half checked, level 1, 1 of 3' }],
      failure: 'Focus lands on an unlabelled checkbox. Nothing says this is a tree, which branch it belongs to, or how deep it is.',
      criterion: '1.3.1',
    },
    {
      action: 'Open the South region branch',
      keys: 'Down arrow to South region, Right arrow',
      before: [{ kind: 'silence', note: 'Rows and arrows are not focusable. Tab skips to the next checkbox and the branch cannot be opened.' }],
      after: [
        { kind: 'speech', text: 'South region, collapsed, not checked, level 1, 2 of 3' },
        { kind: 'speech', text: 'expanded' },
      ],
      failure: 'The branch only opens on a mouse click.',
      criterion: '2.1.1',
    },
    {
      action: 'Check the Operations branch',
      keys: 'Space',
      before: [{ kind: 'speech', text: 'check box, checked' }],
      after: [
        { kind: 'speech', text: 'checked' },
        { kind: 'speech', text: 'Selected Operations and 3 items inside it. 4 selected.' },
      ],
      failure: 'Only the parent box changes. The accounts inside stay unchecked and the user cannot tell what is in scope.',
      criterion: '4.1.2',
    },
    {
      action: 'Move up to the region',
      keys: 'Left arrow',
      before: [{ kind: 'speech', text: 'North region' }],
      after: [{ kind: 'speech', text: 'North region, expanded, half checked, level 1, 1 of 3' }],
      failure: 'No partial state. The region reads as plain text with no hint that some of it is selected.',
      criterion: '4.1.2',
    },
    {
      action: 'Expand a branch that loads from the server',
      keys: 'End, Right arrow',
      before: [{ kind: 'silence', note: 'A spinner glyph appears and nothing is announced, before or after the data arrives.' }],
      after: [
        { kind: 'speech', text: 'Archived accounts, expanded, busy, Loading…' },
        { kind: 'speech', text: 'Archived accounts loaded, 3 items.' },
      ],
      failure: 'Loading and completion are visual only.',
      criterion: '4.1.3',
    },
    {
      action: 'Jump to an account by name',
      keys: 'H',
      before: [{ kind: 'silence', note: 'Typing does nothing; users tab through every checkbox to find it.' }],
      after: [{ kind: 'speech', text: 'Harbor Logistics, not checked, level 3, 2 of 3' }],
    },
  ],
};
