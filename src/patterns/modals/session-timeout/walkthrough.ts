import type { CodeAnnotation } from '../../../types/walkthrough';

export const sessionTimeoutWalkthrough: CodeAnnotation[] = [
  {
    id: 'warning-window',
    anchor: '/** How long before expiry the warning opens, in ms. WCAG 2.2.1 needs at least 20 seconds. */',
    endAnchor: 'announceAt?: number[];',
    topic: 'state',
    title: 'The warning window is part of the API',
    rationale:
      'WCAG 2.2.1 lets a time limit stand only if the user is warned and gets at least 20 seconds to extend it. The default is two minutes, enough to finish a sentence and decide. announceAt keeps speech to a few moments instead of every tick.',
    wcag: ['2.2.1'],
  },
  {
    id: 'spoken-time',
    anchor: '/** "1 minute 5 seconds" for screen readers, which read "1:05" as a time of day. */',
    endAnchor: 'return s === 0',
    topic: 'announce',
    title: 'Time left is spoken in words',
    rationale:
      'Screen readers read "1:05" as five past one. The visible clock is hidden from assistive tech and a word form is used for the description and announcements, so the spoken and the seen value always agree.',
    wcag: ['1.3.1', '4.1.3'],
  },
  {
    id: 'derived-phase',
    anchor: 'const remainingMs = Math.max(0, expiresAt - now);',
    endAnchor: 'const phase: SessionPhase',
    topic: 'state',
    title: 'One deadline, phases derived from it',
    rationale:
      'The only stored fact is when the session ends. Active, warning and expired are computed from that deadline and the current time, so the dialog, countdown and announcements cannot disagree about what state the session is in.',
    wcag: ['2.2.1'],
  },
  {
    id: 'cross-tab',
    anchor: '// Every tab shares one session. Activity or "Stay signed in" in any tab moves the deadline in all of them.',
    endAnchor: '}, [channelName]);',
    topic: 'resilience',
    title: 'Every tab shares the deadline',
    rationale:
      'The audited app tracked idle time per tab, so working in one tab still signed the user out from another. BroadcastChannel sends each extension to every tab, which takes the later deadline and closes its own warning. Sign out in one tab signs out all of them.',
    wcag: ['2.2.1'],
  },
  {
    id: 'wall-clock',
    anchor: '// Wall-clock time, not a decrementing counter: background tabs throttle timers, so we re-read Date.now().',
    endAnchor: "document.addEventListener('visibilitychange', tick);",
    topic: 'resilience',
    title: 'Read the clock, do not count ticks',
    rationale:
      'Browsers slow timers in background tabs and on sleeping laptops, so a counter that subtracts one per tick drifts. Re-reading Date.now() on every tick and when the tab becomes visible again means the countdown is right the moment the user looks.',
    wcag: ['2.2.1'],
  },
  {
    id: 'activity',
    anchor: '// Real activity resets the idle clock, but only before the warning. Once it opens, only an explicit choice counts.',
    endAnchor: 'for (const type of ACTIVITY_EVENTS) document.addEventListener(type, onActivity, true);',
    topic: 'state',
    title: 'Typing counts as activity',
    rationale:
      'The audited timer ran from page load and ignored typing, so people were signed out mid-sentence. Key presses and clicks reset the idle clock, throttled to one update a second. Once the warning is open only a deliberate answer extends, so a stray key cannot dismiss it.',
    wcag: ['2.2.6', '2.2.1'],
  },
  {
    id: 'expire',
    anchor: "if (phase === 'expired' && !ended) {",
    endAnchor: 'callbacks.current.onExpire();',
    topic: 'resilience',
    title: 'Expiry saves work instead of discarding it',
    rationale:
      'onExpire fires once, before anything is torn down, so the app can store drafts and restore them after sign-in. The audited redirect threw the form away and made users type it again.',
    wcag: ['3.3.7'],
  },
  {
    id: 'focus',
    anchor: "const shouldOpen = phase === 'warning' || phase === 'expired';",
    endAnchor: "if (phase === 'expired') signInRef.current?.focus();",
    topic: 'focus',
    title: 'Focus goes to the answer, then back',
    rationale:
      'showModal() makes the page inert and focus moves to "Stay signed in", so keyboard and screen reader users cannot keep typing behind a warning they never heard. The previously focused field is remembered and gets focus back when the dialog closes.',
    wcag: ['2.4.3'],
  },
  {
    id: 'thresholds',
    anchor: '// Speak at a few thresholds, never every second. Crossing is checked with <= so a throttled tab still speaks.',
    endAnchor: 'setAnnouncement(`${formatSpoken(seconds)} remaining before you are signed out.`);',
    topic: 'announce',
    title: 'Announce at thresholds, not every second',
    rationale:
      'A live region that changes every second talks over everything else the user hears. The countdown speaks at 60, 30 and 10 seconds. Thresholds are compared with <=, so a tab that skipped seconds while throttled still announces.',
    wcag: ['4.1.3'],
  },
  {
    id: 'stay',
    anchor: 'const stay = async (): Promise<void> => {',
    endAnchor: '} finally {',
    topic: 'resilience',
    title: 'Stay signed in really extends',
    rationale:
      'The audited OK button only closed the box. Here the server session is refreshed first, then the local deadline moves and other tabs are told. If the refresh fails the dialog stays open with the error, so the user knows they were not given more time.',
    wcag: ['2.2.1', '3.3.1'],
  },
  {
    id: 'escape',
    anchor: '// Escape is a deliberate response from a present user, so it keeps the session. After expiry there is nothing to dismiss.',
    endAnchor: "if (phase === 'warning') void stay();",
    topic: 'focus',
    title: 'Escape keeps the session',
    rationale:
      'Pressing Escape proves someone is there, so it extends rather than closing the warning while the clock keeps running. Preventing the native close keeps React state the source of truth for whether the dialog is open.',
    wcag: ['2.1.2', '2.2.1'],
  },
  {
    id: 'countdown',
    anchor: '<p id={`${id}-countdown`} className={styles.countdown} data-urgent={urgent || undefined}>',
    endAnchor: "{urgent ? 'Signing out soon' : 'until sign-out'}",
    topic: 'semantics',
    title: 'Two countdowns: one to see, one to hear',
    rationale:
      'The large clock is aria-hidden and the word form sits in a visually hidden span referenced by aria-describedby, so the dialog reads the time left once, on open. In the last 10 seconds the label text changes as well as the color.',
    wcag: ['1.3.1', '1.4.1'],
  },
  {
    id: 'reduced-motion',
    file: 'styles',
    anchor: '@media (prefers-reduced-motion: reduce) {',
    endAnchor: 'animation: none;',
    topic: 'styling',
    title: 'Entrance animation respects reduced motion',
    rationale: 'The slide-in is removed for users who ask for less motion. The warning still appears instantly and takes focus.',
    wcag: ['2.3.3'],
  },
  {
    id: 'urgent',
    file: 'styles',
    anchor: '/* Urgency also changes the label text, so color is never the only signal. */',
    endAnchor: 'color: var(--sux-danger, #b42318);',
    topic: 'styling',
    title: 'Urgency is not color alone',
    rationale:
      'The countdown turns red in its last 10 seconds, and the label switches to "Signing out soon" at the same time, so users who cannot tell red from the default still see the change.',
    wcag: ['1.4.1'],
  },
];
