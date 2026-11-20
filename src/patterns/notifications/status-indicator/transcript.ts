import type { ScreenReaderTranscript } from '../../../types/transcript';

export const statusIndicatorTranscript: ScreenReaderTranscript = {
  patternId: 'notifications.status-indicator',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Move to the Status cell of Invoice sync',
      keys: 'Ctrl+Alt+Right Arrow',
      before: [{ kind: 'speech', text: 'Status, column 2, blank' }],
      after: [{ kind: 'speech', text: 'Status, column 2, Failed, Timed out after 30 min' }],
      failure: 'The dot has no text alternative, so the cell sounds empty.',
      criterion: '1.1.1',
    },
    {
      action: 'Look for the status key',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'The "(?)" tooltip is not focusable and its title is never read.' }],
      after: [
        { kind: 'speech', text: 'Status key, figure' },
        { kind: 'speech', text: 'list with 6 items, Failed, Stopped. Rerun or open the log.' },
      ],
      failure: 'The only explanation of the colors is reachable by mouse hover alone.',
      criterion: '2.1.1',
    },
    {
      action: 'Rerun Invoice sync',
      keys: 'Enter',
      before: [{ kind: 'speech', text: 'Rerun Invoice sync, button' }, { kind: 'silence', note: 'The dot turns blue, then green. Nothing is announced.' }],
      after: [
        { kind: 'speech', text: 'Invoice sync: Running' },
        { kind: 'speech', text: 'Invoice sync: Succeeded' },
      ],
      failure: 'The outcome of the rerun is never announced.',
      criterion: '4.1.3',
    },
    {
      action: 'Move to the Status cell of Archive cleanup',
      keys: 'Ctrl+Alt+Down Arrow',
      before: [{ kind: 'speech', text: 'blank' }],
      after: [{ kind: 'speech', text: 'Paused' }],
      failure: 'The pause icon has no accessible name. In compact mode the solved badge still says "Paused".',
      criterion: '1.1.1',
    },
    {
      action: 'Read the whole row',
      keys: 'Ctrl+Alt+Down Arrow',
      before: [{ kind: 'speech', text: 'Vendor file import' }],
      after: [{ kind: 'speech', text: 'Vendor file import, Needs review, 2 rows skipped' }],
    },
  ],
};
