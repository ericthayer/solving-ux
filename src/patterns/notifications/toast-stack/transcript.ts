import type { ScreenReaderTranscript } from '../../../types/transcript';

export const toastStackTranscript: ScreenReaderTranscript = {
  patternId: 'notifications.toast-stack',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Save a draft',
      keys: 'Enter',
      before: [
        { kind: 'silence', note: 'The live region is created at the same moment as its text, so NVDA often misses it.' },
      ],
      after: [{ kind: 'speech', text: 'Success: Draft saved. Saved to Cedar Ridge Farms renewal.' }],
      failure: 'Confirmation is unreliable; users save twice or not at all.',
      criterion: '4.1.3',
    },
    {
      action: 'A payment file is rejected',
      before: [
        { kind: 'speech', text: 'Payment file rejected' },
        { kind: 'silence', note: 'Gone 3 seconds later. Severity was shown by red color only.' },
      ],
      after: [
        { kind: 'speech', text: 'Error: Payment file rejected. Row 18 has an invalid routing number.' },
      ],
      failure: 'The error times out before it can be reviewed and does not say it is an error.',
      criterion: '2.2.1',
    },
    {
      action: 'Go to the notification to act on it',
      keys: 'F8',
      before: [{ kind: 'silence', note: 'No shortcut and no region. The user has to Tab through the page and hope.' }],
      after: [
        { kind: 'speech', text: 'Notifications (F8), region' },
        { kind: 'speech', text: 'Payment file rejected, Error' },
      ],
    },
    {
      action: 'Reach the Undo action',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'The toast expired before focus got there.' }],
      after: [{ kind: 'speech', text: 'Undo, button' }],
      failure: 'Time-limited actions are unreachable for keyboard users.',
      criterion: '2.2.1',
    },
    {
      action: 'Dismiss a toast',
      keys: 'Tab, Enter',
      before: [{ kind: 'speech', text: 'times, button' }],
      after: [{ kind: 'speech', text: 'Dismiss: Payment file rejected, button' }],
      failure: 'The close glyph is read literally and does not say which toast it closes.',
      criterion: '2.4.6',
    },
  ],
};
