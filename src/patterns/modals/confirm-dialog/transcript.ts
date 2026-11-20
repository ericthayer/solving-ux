import type { ScreenReaderTranscript } from '../../../types/transcript';

export const confirmDialogTranscript: ScreenReaderTranscript = {
  patternId: 'modals.confirm-dialog',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Open the delete confirmation',
      keys: 'Enter on "Delete facility FAC-2231"',
      before: [
        { kind: 'speech', text: 'Delete facility FAC-2231, button' },
        { kind: 'silence', note: 'A div overlay appears. Focus stays on the trigger behind it, so nothing about the dialog is read.' },
      ],
      after: [
        { kind: 'speech', text: 'Delete facility FAC-2231?, alert dialog' },
        { kind: 'speech', text: 'This cannot be undone. The following will also be removed:' },
        { kind: 'speech', text: 'Type FAC-2231 to confirm, edit, blank' },
      ],
      failure: 'The user does not know a dialog opened, or what it is asking.',
      criterion: '2.4.3',
    },
    {
      action: 'Find the buttons',
      keys: 'Tab',
      before: [
        { kind: 'speech', text: 'OK, button' },
        { kind: 'speech', text: 'Cancel, button' },
      ],
      after: [
        { kind: 'speech', text: 'Cancel, button' },
        { kind: 'speech', text: 'Delete facility, button, unavailable' },
      ],
      failure: 'OK does not say what it does. Every dialog in the app sounds the same, from archive to permanent delete.',
      criterion: '2.4.6',
    },
    {
      action: 'Keep tabbing',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'Search borrowers, edit' }],
      after: [{ kind: 'speech', text: 'Type FAC-2231 to confirm, edit, blank' }],
      failure: 'Focus escapes into the page behind the overlay.',
      criterion: '2.4.3',
    },
    {
      action: 'Confirm, and the action fails',
      keys: 'Enter',
      before: [
        { kind: 'silence', note: 'The dialog closes. An error banner appears at the top of the page without being announced.' },
      ],
      after: [
        { kind: 'speech', text: 'alert, The facility has a draw in progress. Wait for it to settle, then try again.' },
      ],
      failure: 'The error is out of context and unspoken; the user believes the delete worked.',
      criterion: '4.1.3',
    },
    {
      action: 'Close the dialog',
      keys: 'Escape',
      before: [{ kind: 'speech', text: 'document' }],
      after: [{ kind: 'speech', text: 'Delete facility FAC-2231, button' }],
      failure: 'Focus resets to the top of the document; the user has to find their place again.',
      criterion: '2.4.3',
    },
  ],
};
