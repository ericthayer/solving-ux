import type { ScreenReaderTranscript } from '../../../types/transcript';

export const editConflictGuardTranscript: ScreenReaderTranscript = {
  patternId: 'forms.edit-conflict-guard',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Change the payment terms',
      keys: 'Type in "Payment terms"',
      before: [{ kind: 'silence', note: 'Nothing indicates the form now has unsaved changes.' }],
      after: [
        { kind: 'speech', text: '1 unsaved change.' },
        { kind: 'speech', text: 'Payment terms, edit, Unsaved change, Net 45' },
      ],
      failure: 'The user cannot tell whether anything is unsaved, or where.',
      criterion: '4.1.3',
    },
    {
      action: 'Open another purchase order from the list',
      keys: 'Enter on "PO-1043"',
      before: [
        { kind: 'speech', text: 'Edit purchase order PO-1043' },
        { kind: 'silence', note: 'The edit to PO-1042 is gone. No warning was given.' },
      ],
      after: [
        { kind: 'speech', text: 'Leave with unsaved changes?, dialog, You changed Payment terms. Going to PO-1043 will discard them.' },
        { kind: 'speech', text: 'Keep editing, button' },
      ],
      failure: 'In-app navigation throws away typed work without asking.',
      criterion: '3.3.4',
    },
    {
      action: 'Leave without changing anything',
      keys: 'Enter on "Back to orders"',
      before: [
        { kind: 'speech', text: 'Are you sure you want to leave this page? Changes you made may not be saved.' },
        { kind: 'speech', text: 'OK, button' },
      ],
      after: [{ kind: 'speech', text: 'Purchase orders, navigation landmark' }],
      failure: 'The warning fires when nothing would be lost, and OK does not say whether it leaves or stays.',
      criterion: '2.4.6',
    },
    {
      action: 'Save after a colleague changed the same order',
      keys: 'Enter on "Save changes"',
      before: [
        { kind: 'silence', note: '"Record saved." appears without being announced. The colleague\'s change to payment terms is overwritten.' },
      ],
      after: [
        { kind: 'speech', text: 'Jordan Lee saved changes while you were editing, heading, level 4' },
        { kind: 'speech', text: 'Jordan Lee changed this record while you were editing. 1 field needs your decision.' },
      ],
      failure: 'A stale save silently destroys newer data, and the success message is not announced.',
      criterion: '3.3.4',
    },
    {
      action: 'Choose which value to keep',
      keys: 'Tab, then Arrow keys',
      before: [{ kind: 'silence', note: 'There is no conflict to resolve. The overwrite already happened.' }],
      after: [
        { kind: 'speech', text: 'Payment terms, grouping, Keep mine Net 45, radio button, not checked, 1 of 2' },
        { kind: 'speech', text: "Keep Jordan Lee's Net 60, radio button, checked, 2 of 2" },
      ],
    },
    {
      action: 'Save the merged version',
      keys: 'Enter on "Save merged version"',
      before: [{ kind: 'silence', note: 'Not possible in the audited build.' }],
      after: [{ kind: 'speech', text: 'All changes saved.' }],
    },
  ],
};
