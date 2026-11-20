import type { ScreenReaderTranscript } from '../../../types/transcript';

export const typeaheadTranscript: ScreenReaderTranscript = {
  patternId: 'search-filters.typeahead',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab to the search field',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'edit, blank' }],
      after: [
        { kind: 'speech', text: 'Borrower, combo box, collapsed, autocomplete, Search 960 borrowers by name or account number.' },
      ],
      failure: 'The field has no name and nothing says suggestions will appear.',
      criterion: '4.1.2',
    },
    {
      action: 'Type a partial name',
      keys: 'Type "cedar"',
      before: [
        { kind: 'speech', text: 'c, e, d, a, r' },
        { kind: 'silence', note: 'A list renders below the field. Its size, or that it exists, is never announced.' },
      ],
      after: [
        { kind: 'speech', text: 'c, e, d, a, r' },
        { kind: 'speech', text: 'Showing 8 of 80 matches. Keep typing to narrow.' },
      ],
      failure: 'Results are visible only.',
      criterion: '4.1.3',
    },
    {
      action: 'Move into the results',
      keys: 'Down Arrow',
      before: [{ kind: 'speech', text: 'blank' }],
      after: [{ kind: 'speech', text: 'Cedar Ridge Farms, ACCT 10037 · NE, 1 of 8' }],
      failure: 'Arrow keys move the text cursor; the list cannot be reached from the keyboard.',
      criterion: '2.1.1',
    },
    {
      action: 'Choose a borrower',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'Enter submits the surrounding form with a partial string.' }],
      after: [
        { kind: 'speech', text: 'Borrower, combo box, collapsed, Cedar Ridge Farms' },
        { kind: 'speech', text: 'Selected Cedar Ridge Farms (ACCT 10037 · NE).' },
      ],
    },
    {
      action: 'Search for a name that does not exist',
      keys: 'Type "zzz"',
      before: [{ kind: 'silence', note: 'A blank box. No message, visual or spoken.' }],
      after: [{ kind: 'speech', text: 'No matches for "zzz".' }],
      failure: 'An empty result is indistinguishable from a slow one.',
      criterion: '4.1.3',
    },
  ],
};
