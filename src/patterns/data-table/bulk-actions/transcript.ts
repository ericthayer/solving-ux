import type { ScreenReaderTranscript } from '../../../types/transcript';

export const bulkActionsTranscript: ScreenReaderTranscript = {
  patternId: 'data-table.bulk-actions',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab to the first row checkbox',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'checkbox, not checked' }],
      after: [
        { kind: 'speech', text: 'Loan applications, region' },
        { kind: 'speech', text: 'Select APP-4100, Cedar Ridge Farms, checkbox, not checked' },
      ],
      failure: 'The checkbox has no name. Fifty rows sound identical, so the user cannot tell which loan they are about to select.',
      criterion: '4.1.2',
    },
    {
      action: 'Select the row',
      keys: 'Space',
      before: [
        { kind: 'speech', text: 'checked' },
        { kind: 'silence', note: 'No count. The bulk actions stay hidden in a "More actions" menu that never announces it changed.' },
      ],
      after: [
        { kind: 'speech', text: 'checked' },
        { kind: 'speech', text: '1 of 27 rows selected.' },
      ],
    },
    {
      action: 'Use the select-all checkbox in the header',
      keys: 'Shift+Tab, Space',
      before: [
        { kind: 'speech', text: 'checkbox, checked' },
        { kind: 'silence', note: 'Every record on every page is now selected. Nothing says so.' },
      ],
      after: [
        { kind: 'speech', text: 'Select all rows on this page, checkbox, checked' },
        { kind: 'speech', text: '8 of 27 rows selected.' },
      ],
      failure: 'Scope is invisible and unspoken. The next bulk action runs against rows the user never saw.',
      criterion: '3.3.4',
    },
    {
      action: 'Sort by the Borrower column',
      keys: 'Enter on header',
      before: [
        { kind: 'speech', text: 'Borrower, column header' },
        { kind: 'silence', note: 'The header is a clickable div. It is not focusable, and the 6px arrow has no text or aria-sort.' },
      ],
      after: [
        { kind: 'speech', text: 'Borrower, button, column header, sorted ascending' },
        { kind: 'speech', text: 'Sorted by Borrower, ascending.' },
      ],
      failure: 'Sorting is mouse-only and its state is visual only.',
      criterion: '2.1.1',
    },
    {
      action: 'Apply "Approve" to the selection',
      keys: 'Tab, Enter',
      before: [
        { kind: 'speech', text: 'More actions, button, collapsed' },
        { kind: 'speech', text: 'Approve' },
        { kind: 'silence', note: 'The menu closes and focus falls to the top of the page. No result is announced.' },
      ],
      after: [
        { kind: 'speech', text: 'Approve, button' },
        { kind: 'speech', text: 'Approve applied to 8 rows.' },
      ],
      failure: 'The user cannot confirm what happened or to how many rows, and has lost their place.',
      criterion: '4.1.3',
    },
  ],
};
