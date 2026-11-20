import type { ScreenReaderTranscript } from '../../../types/transcript';

export const jobStatusTranscript: ScreenReaderTranscript = {
  patternId: 'notifications.job-status',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Start a customer list export',
      keys: 'Enter',
      before: [
        { kind: 'speech', text: 'Export customer list, button' },
        { kind: 'silence', note: 'A spinner covers the page. It has no role or text, so nothing says work started or how long it will take.' },
      ],
      after: [{ kind: 'speech', text: 'Customer list export started. It runs in the background; you can keep working.' }],
      failure: 'The user cannot tell whether the click did anything.',
      criterion: '4.1.3',
    },
    {
      action: 'Check how far along the export is',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'The spinner is a decorative div; there is no value to read.' }],
      after: [
        { kind: 'speech', text: 'Background jobs, region' },
        { kind: 'speech', text: 'Customer list export, progress bar, 45%, 54 of 120 rows (45%)' },
      ],
      failure: 'Progress exists only as an animation.',
      criterion: '1.3.1',
    },
    {
      action: 'Go to another page while the job runs',
      keys: 'Enter',
      before: [
        { kind: 'speech', text: 'Settings, button' },
        { kind: 'silence', note: 'The running import is torn down with the page. Nothing says it was lost.' },
      ],
      after: [
        { kind: 'speech', text: 'Settings page, button, current page' },
        { kind: 'speech', text: 'Supplier price import finished with 3 problems. Open the job tray to review them.' },
      ],
      failure: 'Work is cancelled without warning or confirmation.',
      criterion: '3.3.4',
    },
    {
      action: 'An import finishes with rejected rows',
      before: [{ kind: 'silence', note: '"Import complete" appears in the status line with no live region, and the 3 rejected rows are never mentioned.' }],
      after: [
        { kind: 'speech', text: 'Supplier price import finished with 3 problems. Open the job tray to review them.' },
      ],
      failure: 'A partial failure is reported as success.',
      criterion: '3.3.1',
    },
    {
      action: 'Open the problem report',
      keys: 'Tab, Enter',
      before: [{ kind: 'silence', note: 'There is no report to open.' }],
      after: [
        { kind: 'speech', text: 'Review 3 failed rows, expanded' },
        { kind: 'speech', text: 'list, 3 items. Row 14: Unit price is not a number.' },
      ],
    },
    {
      action: 'Cancel a running job',
      keys: 'Tab, Enter',
      before: [{ kind: 'silence', note: 'There is no cancel. The overlay blocks every control until the export ends.' }],
      after: [
        { kind: 'speech', text: 'Cancel Customer list export, button' },
        { kind: 'speech', text: 'Stop Customer list export? The 64 rows already processed stay processed. grouping. Stop job, button' },
      ],
      failure: 'Users cannot stop a job they started by mistake, and nothing asks before work is thrown away.',
      criterion: '3.3.4',
    },
  ],
};
