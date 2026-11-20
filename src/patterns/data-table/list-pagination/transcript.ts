import type { ScreenReaderTranscript } from '../../../types/transcript';

export const listPaginationTranscript: ScreenReaderTranscript = {
  patternId: 'data-table.list-pagination',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Load the next batch of requests',
      keys: 'Enter on Load more',
      before: [
        { kind: 'speech', text: 'Load more, button' },
        { kind: 'silence', note: 'Six rows appear above the button. Nothing is announced and focus stays put.' },
      ],
      after: [
        { kind: 'speech', text: 'Loaded 10 more. Showing 20 of 57 requests.' },
        { kind: 'speech', text: 'Grant report access, REQ-1011, list item, 11 of 57' },
      ],
      failure: 'Focus stays below the new rows, so the next Tab skips all of them and the user never learns they arrived.',
      criterion: '2.4.3',
    },
    {
      action: 'Find the current page',
      keys: 'Tab through the page numbers',
      before: [
        { kind: 'speech', text: 'REQ-1005 Grant report access, link' },
        { kind: 'silence', note: 'The page numbers are plain text. Tab jumps straight past them, and nothing marks which page is current.' },
      ],
      after: [
        { kind: 'speech', text: 'Service requests pages, navigation landmark' },
        { kind: 'speech', text: 'Page 1, button, current page' },
      ],
      failure: 'Page numbers are not keyboard controls, and the current page is shown by color alone.',
      criterion: '2.1.1',
    },
    {
      action: 'Go to page 3',
      keys: 'Enter on Page 3',
      before: [{ kind: 'silence', note: 'Not reachable from the keyboard. A mouse user sees the list change; a screen reader hears nothing.' }],
      after: [
        { kind: 'speech', text: 'Page 3 of 6. Requests 21 to 30 of 57.' },
        { kind: 'speech', text: 'Service requests, list with 10 items' },
      ],
      failure: 'The page change is visual only.',
      criterion: '4.1.3',
    },
    {
      action: 'Open a request, then go back',
      keys: 'Enter on Open, then Back',
      before: [
        { kind: 'speech', text: 'Back, button' },
        { kind: 'speech', text: 'REQ-1001 Replace badge reader, link' },
        { kind: 'silence', note: 'The queue is back on page 1 and focus is on its first row. The page the user was working through is gone.' },
      ],
      after: [
        { kind: 'speech', text: 'Back to requests, button' },
        { kind: 'speech', text: 'Returned to your place. Showing 21 to 30 of 57 requests.' },
        { kind: 'speech', text: 'Order replacement laptop, REQ-1024, list item, 24 of 57' },
      ],
    },
    {
      action: 'Scroll to the footer of the infinite feed',
      keys: 'Page Down',
      before: [
        { kind: 'speech', text: 'REQ-1040 Fix shared printer' },
        { kind: 'silence', note: 'Each time the footer comes into view, eight more rows push it away again.' },
      ],
      after: [
        { kind: 'speech', text: 'Loaded 10 more. Showing 30 of 57 requests.' },
        { kind: 'speech', text: 'Automatic loading paused so the footer stays reachable.' },
        { kind: 'speech', text: 'Help, link' },
      ],
      failure: 'The footer cannot be reached, so help and contact links are effectively removed from the page.',
      criterion: '2.1.1',
    },
  ],
};
