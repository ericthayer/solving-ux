import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const sessionTimeoutPattern: PatternDefinition = {
  id: 'modals.session-timeout',
  slug: 'session-timeout',
  title: 'Session timeout warning',
  summary:
    'Modal warning before an idle session ends: focus moves to it, a countdown speaks at a few thresholds, one button extends the session in every tab, and drafts survive expiry.',
  category: 'modals',
  tags: ['session', 'timeout', 'dialog', 'countdown', 'cross-tab', 'data loss', 'focus management'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Authenticated apps end idle sessions for security. Users filling long forms or reading reports get logged out mid-task. The session either ends with a silent redirect to the sign-in page, or a small warning box appears with no countdown, does not take focus, and offers an "OK" button that closes the box without extending anything. Unsaved form data is gone after sign-in, and a user working in a second tab gets signed out of the first one anyway.',
  beforeState: {
    summary: 'Fixed timer from page load, a vague "will expire soon" box with OK, then a redirect to sign-in that discards the form.',
    failures: [
      {
        id: 'draft-lost',
        description: 'Typing does not count as activity, and anything typed is discarded when the session ends. The user re-enters it after signing in.',
        refs: [{ kind: 'wcag', criterion: '3.3.7' }, { kind: 'wcag', criterion: '2.2.6' }, { kind: 'heuristic', id: 'H5' }],
        target: { label: 'Notes field' },
      },
      {
        id: 'focus-not-moved',
        description: 'The warning box appears without taking focus or being announced. Keyboard and screen reader users keep typing behind it.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }, { kind: 'wcag', criterion: '4.1.3' }],
        target: { label: 'Warning box', revealedBy: 'Wait 6 seconds' },
      },
      {
        id: 'no-countdown',
        description: '"Will expire soon" gives no time. Users cannot tell whether to finish the sentence or save now.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'wcag', criterion: '2.2.1' }],
        target: { label: 'Warning message', revealedBy: 'Wait 6 seconds' },
      },
      {
        id: 'ok-does-not-extend',
        description: 'OK only closes the box. The session still ends on the original schedule, so the user believes they were given more time.',
        refs: [{ kind: 'wcag', criterion: '2.2.1' }, { kind: 'heuristic', id: 'H2' }],
        target: { label: 'OK button', revealedBy: 'Wait 6 seconds' },
      },
      {
        id: 'silent-redirect',
        description: 'Expiry swaps the page for the sign-in screen with no explanation of what happened to the work in progress.',
        refs: [{ kind: 'heuristic', id: 'H9' }, { kind: 'wcag', criterion: '2.2.1' }],
        target: { label: 'Sign-in screen', revealedBy: 'Wait 16 seconds' },
      },
    ],
  },
  designRationale:
    'WCAG 2.2.1 is level A: a user must be warned and able to extend a time limit with a simple action, with at least 20 seconds to respond. The warning is a native <dialog> opened with showModal(), so focus moves to "Stay signed in" and the page behind is inert. The countdown is visible every second but spoken only at a few thresholds through a polite live region, because a per-second announcement drowns out everything else. Time is computed from the wall clock, not a decrementing counter, so a throttled background tab still expires on time. Key presses and clicks reset the idle clock before the warning, and every tab shares the deadline through a BroadcastChannel, so working in one tab never signs out another. After expiry the dialog stays in place and says so, and the app saves drafts in onExpire so nothing has to be typed twice.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'sessionMs', type: 'number', required: true, description: 'Idle time before the session ends, in ms. Match the server idle timeout.' },
    { name: 'warningMs', type: 'number', required: false, defaultValue: '120000', description: 'How long before expiry the warning opens. Keep it at 20 seconds or more (WCAG 2.2.1).' },
    { name: 'announceAt', type: 'number[]', required: false, defaultValue: '[60, 30, 10]', description: 'Seconds remaining at which the countdown is spoken. The visible clock still ticks every second.' },
    { name: 'onExtend', type: '() => void | Promise<void>', required: true, description: 'Refresh the server session. Throw or reject to keep the dialog open with the error inside it.' },
    { name: 'onSignOut', type: '() => void', required: true, description: 'Called on "Sign out now" here or in another tab.' },
    { name: 'onExpire', type: '() => void', required: true, description: 'The session ran out. Save unsaved drafts here so they can be restored after sign-in.' },
    { name: 'onSignIn', type: '() => void', required: true, description: 'Called from "Sign in again" after expiry.' },
    { name: 'expiredMessage', type: 'ReactNode', required: false, description: 'Shown after expiry. Only promise that work is saved if onExpire saves it.' },
    { name: 'channelName', type: 'string', required: false, defaultValue: '"sux-session"', description: 'BroadcastChannel name shared by every tab of the app.' },
  ],
  usage: `<SessionTimeoutWarning
  sessionMs={15 * 60_000}
  onExtend={() => api.refreshSession()}
  onSignOut={() => auth.signOut()}
  onExpire={() => drafts.saveAll()}
  onSignIn={() => auth.redirectToSignIn({ returnTo: location.href })}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.2.1', level: 'A', title: 'Timing adjustable', detail: 'Warns at least 20 seconds before expiry (2 minutes by default) and extends with one action, as many times as needed.' },
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'Focus moves to "Stay signed in" when the warning opens and returns to where the user was when it closes.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Remaining time is announced at thresholds through role="status", not every second.' },
    { kind: 'wcag', criterion: '3.3.7', level: 'A', title: 'Redundant entry', detail: 'onExpire saves drafts so users do not retype them after signing in again.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'Stay signed in (focused first).' },
    { kind: 'keyboard', keys: 'Escape', action: 'Counts as a response from a present user and extends the session.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Move between Sign out now and Stay signed in; the page behind is inert.' },
    { kind: 'aria', attribute: 'role="alertdialog"', detail: 'The warning needs a response now, so assistive tech treats it as urgent.' },
    { kind: 'aria', attribute: 'aria-describedby', detail: 'Points at the explanation and the spoken countdown, so the time left is read when the dialog opens.' },
    { kind: 'aria', attribute: 'role="status"', detail: 'Visually hidden live region for threshold announcements and the signed-out notice.' },
    { kind: 'screen-reader', title: 'On open', detail: 'Announces "Your session is about to end, alert dialog, ... Time remaining: 2 minutes" then "Stay signed in, button".' },
    { kind: 'screen-reader', title: 'Countdown', detail: 'Speaks "1 minute remaining before you are signed out." at 60, 30 and 10 seconds. The visible "1:00" is hidden from AT because it reads as a time of day.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
