import type { CodeAnnotation } from '../../../types/walkthrough';

export const toastStackWalkthrough: CodeAnnotation[] = [
  {
    id: 'duration-contract',
    anchor: '/** Milliseconds before auto-dismiss. Errors and toasts with actions never auto-dismiss. */',
    endAnchor: 'duration?: number;',
    topic: 'semantics',
    title: 'Timeouts are a documented contract',
    rationale:
      'The audited stack dismissed everything after 3 seconds, including errors and Undo links. The rule that errors and actionable toasts stay put is written into the type, where every consumer will read it.',
    wcag: ['2.2.1'],
  },
  {
    id: 'max-visible',
    anchor: '/** Toasts beyond this count wait in a queue and are summarized as "N more". */',
    endAnchor: 'maxVisible?: number;',
    topic: 'resilience',
    title: 'A cap on visible toasts',
    rationale: 'An unbounded stack covered primary actions. Extra toasts wait in a queue, and a "N more" count tells users they exist.',
  },
  {
    id: 'errors-first',
    anchor: '// Errors go first so the highest-severity message is never queued out of sight.',
    endAnchor: "setToasts((list) => (input.tone === 'error'",
    topic: 'state',
    title: 'Errors jump the queue',
    rationale: 'With a cap in place, a new error must not wait behind three success messages. It is prepended so it is always visible.',
  },
  {
    id: 'announce-text',
    anchor: 'const text = `${TONE_LABEL[input.tone]}: ${input.title}',
    endAnchor: 'else setPolite(text);',
    topic: 'announce',
    title: 'Tone is spoken, and severity picks the channel',
    rationale:
      'The announcement starts with the tone word ("Error: Payment failed") so severity is never conveyed by color alone. Errors go to the assertive region; everything else waits for a pause.',
    wcag: ['4.1.3', '1.4.1'],
  },
  {
    id: 'hotkey',
    anchor: 'if (event.key === hotkey) {',
    endAnchor: "listRef.current?.querySelector<HTMLElement>('[data-toast]')?.focus();",
    topic: 'focus',
    title: 'F8 jumps to notifications',
    rationale:
      'Toasts render at the end of the DOM, far from where the user is working. A hotkey (named in the region label) moves focus to the newest toast so keyboard users can reach Undo before it matters.',
    wcag: ['2.1.1'],
  },
  {
    id: 'persistent-regions',
    anchor: '<p role="status" className={styles.visuallyHidden}>{polite}</p>',
    endAnchor: '<p role="alert" className={styles.visuallyHidden}>{assertive}</p>',
    topic: 'announce',
    title: 'Live regions exist before any toast',
    rationale:
      'The audited stack created a live region with each toast, and screen readers often ignore regions that arrive with their content. These two are mounted with the provider, so every announcement is a text change to a region that was already there.',
    wcag: ['4.1.3'],
  },
  {
    id: 'pause',
    anchor: 'onMouseEnter={() => setPaused(true)}',
    endAnchor: 'if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);',
    topic: 'state',
    title: 'Hover or focus pauses every timer',
    rationale:
      'Users reading or tabbing through a toast must not lose it. The blur check uses relatedTarget so moving focus between toasts does not restart the clock.',
    wcag: ['2.2.1', '1.4.13'],
  },
  {
    id: 'remaining-time',
    anchor: 'const persistent = toast.tone === \'error\' || Boolean(toast.action) || !Number.isFinite(duration);',
    endAnchor: 'remaining.current -= Date.now() - started;',
    topic: 'state',
    title: 'Pausing keeps the remaining time',
    rationale:
      'The cleanup subtracts elapsed time instead of resetting, so a 6-second toast paused at 4 seconds resumes with 2 left. Persistent toasts never start a timer.',
    wcag: ['2.2.1'],
  },
  {
    id: 'toast-item',
    anchor: 'tabIndex={-1}',
    endAnchor: "if (event.key === 'Escape') onDismiss();",
    topic: 'focus',
    title: 'Each toast is focusable and dismissable',
    rationale:
      'tabIndex={-1} lets the hotkey focus a toast without adding every toast to the Tab order. Escape dismisses the focused toast.',
    wcag: ['2.1.1'],
  },
  {
    id: 'tone-label',
    anchor: '<span className={styles.tone}>{TONE_LABEL[toast.tone]}</span>',
    topic: 'semantics',
    title: 'Visible tone label beside the color',
    rationale: 'Each toast shows "Success" or "Error" as text, so the colored border is never the only signal.',
    wcag: ['1.4.1'],
  },
  {
    id: 'dismiss-name',
    anchor: 'aria-label={`Dismiss: ${toast.title}`}',
    topic: 'semantics',
    title: 'Close buttons say what they close',
    rationale: 'The × glyph is hidden; the accessible name includes the toast title, so a stack of close buttons is distinguishable.',
    wcag: ['2.4.6', '1.1.1'],
  },
];
