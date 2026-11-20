import type { ScreenReaderTranscript } from '../../../types/transcript';

export const dateRangeTranscript: ScreenReaderTranscript = {
  patternId: 'forms.date-range',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab to the first date field',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'From, edit, read only, 03/04/26' }],
      after: [
        { kind: 'speech', text: 'Order date, grouping, Dates use Coordinated Universal Time (UTC). Each range runs from 00:00 on the first day to 23:59 on the last.' },
        { kind: 'speech', text: 'From (MM/DD/YYYY), edit, 03/04/2026, Wednesday, March 4, 2026' },
      ],
      failure: 'No format is given and the field is read-only, so the user cannot tell March 4 from April 3 or type a correction.',
      criterion: '3.3.2',
    },
    {
      action: 'Type a date in a short form and leave the field',
      keys: 'Type "3/1/26", Tab',
      before: [{ kind: 'silence', note: 'Typing is ignored in a read-only field.' }],
      after: [
        { kind: 'speech', text: 'Change from, Sunday, March 1, 2026, button, collapsed, has popup dialog' },
        { kind: 'speech', text: 'Sunday, March 1, 2026 to Wednesday, March 4, 2026, 4 days.' },
      ],
    },
    {
      action: 'Open the calendar',
      keys: 'Tab to the calendar button, Enter',
      before: [{ kind: 'silence', note: 'The calendar icon is a div. It is skipped by Tab and Enter does nothing.' }],
      after: [
        { kind: 'speech', text: 'Choose from, dialog' },
        { kind: 'speech', text: 'March 2026, grid, Sunday, Sunday, March 1, 2026, selected' },
      ],
      failure: 'The only way to set a date cannot be reached or operated from the keyboard.',
      criterion: '2.1.1',
    },
    {
      action: 'Move to a day and choose it',
      keys: 'Arrow Right, Enter',
      before: [{ kind: 'silence', note: 'Arrow keys scroll the page. Day cells have no names.' }],
      after: [
        { kind: 'speech', text: 'Monday, March 2, 2026, not selected' },
        { kind: 'speech', text: 'Change from, Monday, March 2, 2026, button, collapsed, has popup dialog' },
      ],
    },
    {
      action: 'Enter an end date before the start date',
      keys: 'Type "02/01/2026" in To, Tab',
      before: [{ kind: 'speech', text: '0 orders found for 03/02/26 - 02/01/26' }],
      after: [
        { kind: 'speech', text: 'To (MM/DD/YYYY), edit, invalid entry, 02/01/2026, Sunday, February 1, 2026, To must be on or after from, Monday, March 2, 2026.' },
      ],
      failure: 'The inverted range is accepted and the empty result reads as "no orders", not as an input mistake.',
      criterion: '3.3.1',
    },
  ],
};
