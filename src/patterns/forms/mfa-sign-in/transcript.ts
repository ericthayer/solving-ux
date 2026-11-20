import type { ScreenReaderTranscript } from '../../../types/transcript';

export const mfaSignInTranscript: ScreenReaderTranscript = {
  patternId: 'forms.mfa-sign-in',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab to the password field and paste from a password manager',
      keys: 'Tab, Ctrl+V',
      before: [
        { kind: 'speech', text: 'pass, edit, protected' },
        { kind: 'silence', note: 'Paste is blocked. Nothing is entered and nothing says why.' },
      ],
      after: [
        { kind: 'speech', text: 'Password, edit, protected' },
        { kind: 'speech', text: 'bullet bullet bullet bullet bullet bullet bullet bullet bullet bullet bullet bullet bullet' },
      ],
      failure: 'The user has to transcribe a password character by character, a cognitive function test with no helper mechanism.',
      criterion: '3.3.8',
    },
    {
      action: 'Reach the bot check',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'captcha, edit, blank' }],
      after: [{ kind: 'speech', text: 'Or sign in without a password, heading level 4, Sign in with a passkey, button' }],
      failure: 'The CAPTCHA image is hidden from assistive tech and there is no alternative path.',
      criterion: '3.3.8',
    },
    {
      action: 'Sign in with a wrong password',
      keys: 'Enter',
      before: [
        { kind: 'speech', text: 'Invalid login.' },
        { kind: 'silence', note: 'Every field was reset, including the username.' },
      ],
      after: [
        { kind: 'speech', text: 'alert, The email or password is incorrect. Check both and try again, or sign in without a password.' },
      ],
      failure: 'The form empties on error, so the user re-enters information they already gave.',
      criterion: '3.3.7',
    },
    {
      action: 'Password accepted, code screen opens',
      keys: 'Enter',
      before: [{ kind: 'speech', text: 'edit, blank' }],
      after: [
        { kind: 'speech', text: 'Enter your verification code, heading level 3' },
      ],
      failure: 'Focus lands in the first of six unlabelled boxes with no context about what to type.',
      criterion: '4.1.2',
    },
    {
      action: 'Tab to the code field',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'edit, blank' }],
      after: [
        { kind: 'speech', text: 'Verification code, edit, We sent a 6-digit code to your phone ending in 0142. Paste it or let your device fill it in., blank' },
      ],
    },
    {
      action: 'Paste the code from the message',
      keys: 'Ctrl+V, Enter',
      before: [{ kind: 'silence', note: 'Paste is blocked and the boxes accept one character each. Autofill offers nothing.' }],
      after: [{ kind: 'speech', text: 'Signed in' }],
      failure: 'The six-box input defeats paste and one-time-code autofill.',
      criterion: '1.3.5',
    },
    {
      action: 'Wait on the code screen for a minute',
      before: [
        { kind: 'silence', note: 'After 30 seconds the screen expires and returns to an empty sign-in form without warning.' },
      ],
      after: [
        { kind: 'speech', text: 'Send a new code, button, unavailable, Available in 0:12' },
      ],
      failure: 'A hidden time limit with no warning or way to extend.',
      criterion: '2.2.1',
    },
  ],
};
