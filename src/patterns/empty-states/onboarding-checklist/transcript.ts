import type { ScreenReaderTranscript } from '../../../types/transcript';

export const onboardingChecklistTranscript: ScreenReaderTranscript = {
  patternId: 'empty-states.onboarding-checklist',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Open the workspace for the first time',
      keys: 'Browse mode',
      before: [
        { kind: 'speech', text: 'Workspace' },
        { kind: 'speech', text: 'Import, button' },
      ],
      after: [
        { kind: 'speech', text: 'Getting started, complementary landmark' },
        { kind: 'speech', text: 'Getting started, heading level 3' },
        { kind: 'speech', text: '1 of 5 done' },
      ],
      failure: 'The tour bubble has no role and sits at the end of the page. The user does not know a tour is running.',
      criterion: '4.1.3',
    },
    {
      action: 'Tab to the next control',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'Reports, button' }],
      after: [
        { kind: 'speech', text: 'Hide getting started tasks, button, expanded' },
        { kind: 'speech', text: 'Add your organization profile, done, button. Name and time zone appear on every report.' },
      ],
      failure: 'Focus moves through the dimmed page. Next and Close are not focusable, so the tour cannot be operated.',
      criterion: '2.4.3',
    },
    {
      action: 'Read the current step slowly',
      before: [{ kind: 'silence', note: 'The step changes every 4 seconds. The text the user was reading is replaced without warning.' }],
      after: [{ kind: 'speech', text: 'Import your first records, not started, button. Upload a spreadsheet or start from the sample file.' }],
      failure: 'The tour advances on a timer that cannot be paused or extended.',
      criterion: '2.2.1',
    },
    {
      action: 'Do the import task',
      keys: 'Enter, then Import sample file',
      before: [{ kind: 'silence', note: 'The tour only pointed at Import. Nothing records that anything was done.' }],
      after: [{ kind: 'speech', text: 'Task complete: Import your first records. 2 of 5 done.' }],
    },
    {
      action: 'Close it, then look for it again later',
      keys: 'Tab, Enter',
      before: [{ kind: 'silence', note: 'The tour is gone for good. No help link or replay exists.' }],
      after: [
        { kind: 'speech', text: 'Show getting started tasks, button, collapsed' },
        { kind: 'speech', text: 'Help and support, link' },
      ],
      failure: 'Help disappears instead of staying in a consistent place.',
      criterion: '3.2.6',
    },
  ],
};
