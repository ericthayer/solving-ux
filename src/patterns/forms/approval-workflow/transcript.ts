import type { ScreenReaderTranscript } from '../../../types/transcript';

export const approvalWorkflowTranscript: ScreenReaderTranscript = {
  patternId: 'forms.approval-workflow',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Read the request status',
      keys: 'Down arrow',
      before: [{ kind: 'speech', text: 'Status, row header, blank' }],
      after: [{ kind: 'speech', text: 'Status: In review, waiting on you' }],
      failure: 'The status dot has no text, so the cell reads as empty.',
      criterion: '1.4.1',
    },
    {
      action: 'Find out what changed since the last round',
      keys: 'H',
      before: [{ kind: 'silence', note: 'There is no history and no change summary. The approver re-reads the whole request.' }],
      after: [
        { kind: 'speech', text: 'Changed since the last review, heading level 4' },
        { kind: 'speech', text: 'table with 4 rows and 3 columns, Field, Was, Now' },
      ],
    },
    {
      action: 'Reject without giving a reason',
      keys: 'Space on Reject, Enter',
      before: [
        { kind: 'speech', text: 'Reject, button' },
        { kind: 'silence', note: 'The request is rejected on one press. No reason, no confirmation, and nothing is announced.' },
      ],
      after: [
        { kind: 'speech', text: 'Reason, edit, multi line, invalid entry, required, Required. Jordan Kim sees this in the history. Tell Jordan Kim why, in at least 10 characters, so they can act on it.' },
      ],
      failure: 'A destructive decision is irreversible, unconfirmed, and leaves the requester with nothing to act on.',
      criterion: '3.3.4',
    },
    {
      action: 'Approve the request',
      keys: 'Enter on "Approve request"',
      before: [{ kind: 'silence', note: 'The dot turns green and grey "saved" text appears. Nothing is read.' }],
      after: [
        { kind: 'speech', text: 'Status history, heading level 4' },
        { kind: 'speech', text: 'Approve recorded. PR-2048 moves to Ana Ruiz (Director).' },
      ],
      failure: 'The outcome is visual only, so a screen reader user cannot tell whether the decision was saved.',
      criterion: '4.1.3',
    },
    {
      action: 'Review the history',
      keys: 'Down arrow',
      before: [{ kind: 'speech', text: 'Last modified, row header, 11/13/2026' }],
      after: [
        { kind: 'speech', text: 'list, 5 items, Approved by Priya Shah (Team manager), Nov 13, 2026, 10:22 AM' },
      ],
    },
  ],
};
