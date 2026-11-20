import type { ScreenReaderTranscript } from '../../../types/transcript';

export const sessionTimeoutTranscript: ScreenReaderTranscript = {
  patternId: 'modals.session-timeout',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'The warning appears while typing notes',
      before: [{ kind: 'silence', note: 'A box appears over the page. Focus stays in the notes field and nothing is announced, so the user keeps typing.' }],
      after: [
        { kind: 'speech', text: 'Your session is about to end, alert dialog' },
        { kind: 'speech', text: 'For your security, inactive sessions end automatically. Choose Stay signed in to keep working. Time remaining: 2 minutes' },
        { kind: 'speech', text: 'Stay signed in, button' },
      ],
      failure: 'The user never learns a warning opened.',
      criterion: '4.1.3',
    },
    {
      action: 'Find out how long is left',
      keys: 'Insert+Up arrow',
      before: [{ kind: 'speech', text: 'Your session will expire soon.' }],
      after: [{ kind: 'speech', text: '1 minute remaining before you are signed out.' }],
      failure: '"Soon" gives no time, so the user cannot judge whether to finish or save now.',
      criterion: '2.2.1',
    },
    {
      action: 'Keep working',
      keys: 'Enter',
      before: [
        { kind: 'speech', text: 'OK, button' },
        { kind: 'silence', note: 'The box closes, but the session still ends on the original schedule.' },
      ],
      after: [
        { kind: 'speech', text: 'Stay signed in, button' },
        { kind: 'speech', text: 'Purchase request notes, edit, multi line, Need quotes from two vendors' },
      ],
      failure: 'OK does not extend the session, so the user is signed out anyway.',
      criterion: '2.2.1',
    },
    {
      action: 'The session runs out',
      before: [
        { kind: 'speech', text: 'Sign in, document' },
        { kind: 'speech', text: 'Your session has expired. Please sign in again.' },
      ],
      after: [
        { kind: 'speech', text: 'You have been signed out, alert dialog' },
        { kind: 'speech', text: 'For your security, you were signed out after a period of inactivity. Your notes are saved on this device and come back after you sign in.' },
        { kind: 'speech', text: 'Sign in again, button' },
      ],
      failure: 'The page is replaced without saying what happened to the work in progress.',
      criterion: '2.2.1',
    },
    {
      action: 'Sign in and return to the notes',
      keys: 'Enter, then Tab',
      before: [{ kind: 'speech', text: 'Purchase request notes, edit, multi line, blank' }],
      after: [
        { kind: 'speech', text: 'Signed in. Your draft was restored.' },
        { kind: 'speech', text: 'Purchase request notes, edit, multi line, Need quotes from two vendors' },
      ],
      failure: 'Everything typed before the timeout is gone and has to be entered again.',
      criterion: '3.3.7',
    },
  ],
};
