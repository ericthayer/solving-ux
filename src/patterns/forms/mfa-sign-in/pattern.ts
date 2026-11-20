import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const mfaSignInPattern: PatternDefinition = {
  id: 'forms.mfa-sign-in',
  slug: 'mfa-sign-in',
  title: 'Accessible sign-in with MFA',
  summary: 'Email, password, and one-time code sign-in that allows paste and autofill, offers passwordless options, keeps entered data on error, and shows a visible wait before resending a code.',
  category: 'forms',
  tags: ['forms', 'authentication', 'sign-in', 'mfa', 'one-time code', 'passkey'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'The sign-in screen blocks paste in the password field, so password manager users retype long passwords by hand. A distorted-text CAPTCHA is the only way past bots. The second factor is six single-character boxes that break paste and SMS autofill, a wrong password empties every field, and the code screen silently expires after 30 seconds and drops users back at an empty form.',
  beforeState: {
    summary: 'Username, password, and CAPTCHA form followed by a six-box code screen.',
    failures: [
      {
        id: 'no-autocomplete',
        description: 'autocomplete="off" on the username and password tells browsers and password managers not to fill the username and password.',
        refs: [{ kind: 'wcag', criterion: '1.3.5' }, { kind: 'wcag', criterion: '3.3.8' }],
        target: { label: 'User ID field' },
      },
      {
        id: 'paste-blocked',
        description: 'Paste is blocked in the password field, so users must transcribe a password from memory or another app.',
        refs: [{ kind: 'wcag', criterion: '3.3.8' }, { kind: 'heuristic', id: 'H7' }],
        target: { label: 'Password field' },
      },
      {
        id: 'captcha-only',
        description: 'A distorted-text CAPTCHA is the only path through, with no audio, passkey, or email-link alternative.',
        refs: [{ kind: 'wcag', criterion: '3.3.8' }, { kind: 'wcag', criterion: '1.1.1' }],
        target: { label: 'CAPTCHA image and field' },
      },
      {
        id: 'clears-on-error',
        description: 'A wrong password or CAPTCHA resets the whole form with a vague "Invalid login." message.',
        refs: [{ kind: 'wcag', criterion: '3.3.7' }, { kind: 'wcag', criterion: '3.3.1' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: 'Sign-in form' },
      },
      {
        id: 'split-code-boxes',
        description: 'The one-time code is six unlabelled single-character boxes that block paste and defeat one-time-code autofill.',
        refs: [{ kind: 'wcag', criterion: '3.3.8' }, { kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '1.3.5' }],
        target: { label: 'Six code boxes', revealedBy: 'Sign in with password demo-password and CAPTCHA X7KQ2' },
      },
      {
        id: 'silent-timeout',
        description: 'The code screen expires after 30 seconds with no warning or way to extend, and returns to an empty form.',
        refs: [{ kind: 'wcag', criterion: '2.2.1' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: '"Code sent." message', revealedBy: 'Sign in with password demo-password and CAPTCHA X7KQ2' },
      },
    ],
  },
  designRationale:
    'WCAG 2.2 adds 3.3.8: sign-in must not depend on remembering or transcribing something unless the user has a mechanism to help, such as paste and password managers. So nothing here blocks paste, every field carries the autocomplete token a password manager looks for, and the code is one input with autocomplete="one-time-code" so phones can fill it from the message. A passkey and an email link give a path with no cognitive test at all. Errors keep every value and say what to do next. The resend control stays focusable during its wait, with the remaining time in visible text that is not a live region, so screen readers are not interrupted every second. Server calls go through one typed adapter, so the component holds no auth logic.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'auth', type: 'MfaAuthAdapter', required: true, description: 'verifyPassword, verifyCode, and resendCode, plus optional signInWithPasskey and sendEmailLink. Omit an optional method to hide that option. Reject a promise for network failures; resolve { status: "invalid", message } for wrong answers.' },
    { name: 'onSignedIn', type: '(email: string) => void', required: true, description: 'Called once any factor succeeds.' },
    { name: 'codeLength', type: 'number', required: false, defaultValue: '6', description: 'Digits in the one-time code. Used in the hint and validation messages.' },
    { name: 'resendDelaySeconds', type: 'number', required: false, defaultValue: '30', description: 'Wait before "Send a new code" becomes available. The remaining time is shown, not hidden.' },
  ],
  usage: `<MfaSignIn
  auth={{
    verifyPassword: (email, password) => api.signIn(email, password),
    verifyCode: (code) => api.verifyCode(code),
    resendCode: () => api.resendCode(),
    signInWithPasskey: () => api.passkey(),
    sendEmailLink: (email) => api.sendMagicLink(email),
  }}
  onSignedIn={(email) => router.navigate('/home')}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '3.3.8', level: 'AA', title: 'Accessible authentication (minimum)', detail: 'Paste and password managers work in every field, and a passkey or email link avoids any cognitive test.' },
    { kind: 'wcag', criterion: '1.3.5', level: 'AA', title: 'Identify input purpose', detail: 'autocomplete="username", "current-password", and "one-time-code" on the matching fields.' },
    { kind: 'wcag', criterion: '3.3.7', level: 'A', title: 'Redundant entry', detail: 'Wrong credentials, wrong codes, and network failures keep every value already entered.' },
    { kind: 'wcag', criterion: '3.3.1', level: 'A', title: 'Error identification', detail: 'Field errors use aria-invalid and aria-describedby; credential errors use role="alert" because the server cannot say which field is wrong.' },
    { kind: 'wcag', criterion: '2.2.1', level: 'A', title: 'Timing adjustable', detail: 'The code screen never times out on its own. An expired code is a recoverable field error with a resend action.' },
    { kind: 'keyboard', keys: 'Enter', action: 'Submits the current step from any field.' },
    { kind: 'keyboard', keys: 'Space / Enter', action: 'On "Show password", toggles between hidden and visible text.' },
    { kind: 'aria', attribute: 'aria-pressed', detail: '"Show password" is a toggle button whose label stays the same, so its name matches what is on screen.' },
    { kind: 'aria', attribute: 'aria-disabled="true"', detail: '"Send a new code" stays in the tab order during its wait and is described by the visible remaining time.' },
    { kind: 'screen-reader', title: 'Step change', detail: 'Focus moves to the "Enter your verification code" heading after the password is accepted.' },
    { kind: 'screen-reader', title: 'Resend', detail: 'role="status" announces "We sent a new code to your phone ending in 0142."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
