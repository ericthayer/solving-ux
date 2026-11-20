import type { ScreenReaderTranscript } from '../../../types/transcript';

export const emptyStateTranscript: ScreenReaderTranscript = {
  patternId: 'empty-states.empty-state',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Open saved views for the first time',
      keys: 'Browse mode',
      before: [{ kind: 'speech', text: 'No data' }],
      after: [
        { kind: 'speech', text: 'No saved views yet, heading level 3' },
        { kind: 'speech', text: 'Save a combination of filters and columns to reopen it in one click and share it with your team.' },
        { kind: 'speech', text: 'Create a view, button' },
      ],
      failure: 'No explanation and no next step.',
    },
    {
      action: 'Type a search that matches nothing',
      keys: 'Type "harbr logistics"',
      before: [{ kind: 'silence', note: 'The grid empties silently. "No data" is only found by browsing.' }],
      after: [
        { kind: 'speech', text: 'No results for “harbr logistics”. 3 filters are narrowing these results.' },
      ],
      failure: 'The change is never announced, and the user is not told filters caused it.',
      criterion: '4.1.3',
    },
    {
      action: 'Look for a way out',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'There is nothing to Tab to.' }],
      after: [{ kind: 'speech', text: 'Clear all 3 filters, button' }],
    },
    {
      action: 'The data request fails',
      before: [{ kind: 'speech', text: 'No data' }],
      after: [
        { kind: 'speech', text: 'alert, Payment history could not be loaded' },
        { kind: 'speech', text: 'The receiving system did not respond. Your other data is unaffected.' },
      ],
      failure: 'An outage sounds exactly like an empty account.',
      criterion: '3.3.1',
    },
    {
      action: 'Copy the reference for support',
      keys: 'Tab, Enter',
      before: [{ kind: 'silence', note: 'No reference id and no retry.' }],
      after: [
        { kind: 'speech', text: 'Copy error reference, button' },
        { kind: 'speech', text: 'Copied error reference' },
      ],
    },
  ],
};
