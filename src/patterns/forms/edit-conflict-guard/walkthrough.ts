import type { CodeAnnotation } from '../../../types/walkthrough';

export const editConflictGuardWalkthrough: CodeAnnotation[] = [
  {
    id: 'version-in-api',
    anchor: '/** Send baseVersion so the server can refuse a stale write instead of overwriting it. */',
    endAnchor: 'onSave: (values: Values, baseVersion: number) => Promise<SaveResult>;',
    topic: 'state',
    title: 'Every save says which version it started from',
    rationale:
      'The audited form PUT the whole record with no version, so the last person to click Save won. Passing baseVersion lets the server answer "stale" (HTTP 409, or 412 with If-Match) and the result type makes that a normal outcome to handle, not an exception.',
    wcag: ['3.3.4'],
  },
  {
    id: 'three-way-diff',
    anchor: '/** A field is in conflict only when both sides changed it and ended up with different text. */',
    endAnchor: 'return { next, fields, merged, mine: { ...draft }, theirs: { ...latest } };',
    topic: 'state',
    title: 'A three-way compare keeps conflicts rare',
    rationale:
      'Comparing base, mine, and theirs field by field means a colleague who changed the delivery date does not block your note. Their field merges in, yours is kept, and only a field both of you changed to different values needs a person to decide.',
    wcag: ['3.3.4'],
  },
  {
    id: 'real-dirty',
    anchor: '// Dirty means "differs from the server copy", not "was touched". Typing then undoing is clean.',
    endAnchor: 'const dirty = changed.length > 0 || conflict !== null;',
    topic: 'state',
    title: 'Dirty is computed, not remembered',
    rationale:
      'A "touched" flag never resets, which is why the audited app warned on every exit. Deriving the changed list from draft versus base means undoing an edit makes the form clean again, and the warning only appears when something would really be lost.',
  },
  {
    id: 'quiet-status',
    anchor: '// The text only changes when the count changes, so typing does not re-announce on every key.',
    endAnchor: "const status = saving ? 'Saving…'",
    topic: 'announce',
    title: 'One status line that does not chatter',
    rationale:
      'The role="status" region reads "1 unsaved change" once, not on every keystroke, because its text only changes when the count does. Saving, saved, conflict, and failure messages go through the same region, so screen reader users hear every outcome.',
    wcag: ['4.1.3'],
  },
  {
    id: 'beforeunload',
    anchor: "// Only registered while dirty, so a clean form never triggers the browser's leave prompt.",
    endAnchor: "window.addEventListener('beforeunload', warn);",
    topic: 'resilience',
    title: 'Tab close is guarded only when it matters',
    rationale:
      'The listener is added when the form becomes dirty and removed when it is clean again. The browser prompt therefore means something when it appears, and a clean page can be closed or reloaded with no friction.',
    wcag: ['3.3.4'],
  },
  {
    id: 'focus-conflict',
    anchor: '// Move focus to the conflict heading once it has rendered, so the user lands on the explanation.',
    endAnchor: 'conflictHeadingRef.current?.focus();',
    topic: 'focus',
    title: 'Focus lands on the explanation',
    rationale:
      'When a save comes back stale, focus moves to the conflict heading after it renders. Keyboard and screen reader users start at "Jordan Lee saved changes while you were editing" instead of on a Save button that apparently did nothing.',
    wcag: ['2.4.3'],
  },
  {
    id: 'in-app-guard',
    anchor: 'if (pendingNavigation === null) return;',
    endAnchor: 'keepEditingRef.current?.focus();',
    topic: 'state',
    title: 'In-app navigation is guarded too',
    rationale:
      'beforeunload never fires for client-side route changes, which is how the audited app lost edits when users clicked another record. The router holds the navigation and passes it in; a clean form lets it through at once, a dirty one asks, with Keep editing focused first.',
    wcag: ['3.3.4', '2.4.3'],
  },
  {
    id: 'no-blind-save',
    anchor: 'if (conflict && conflict.fields.some((name) => !conflict.choices[name])) {',
    endAnchor: 'return false;',
    topic: 'resilience',
    title: 'A conflict needs a decision, not a default',
    rationale:
      'Pre-selecting "mine" would recreate the overwrite one click later. Saving with an unanswered conflict is refused, the status says why, and focus returns to the conflict so the user can see what is left to decide.',
    wcag: ['3.3.1', '3.3.4'],
  },
  {
    id: 'rebase',
    anchor: '// Their version becomes the new base, so the next save is checked against it.',
    endAnchor: 'focusConflictRef.current = true;',
    topic: 'state',
    title: 'Rebase onto their version, keep your draft',
    rationale:
      'The newer server copy becomes the base, so the merged save is checked against it and a third concurrent edit is caught the same way. The draft keeps everything the user typed; nothing is reloaded or cleared, and the message names who made the change.',
    wcag: ['3.3.1'],
  },
  {
    id: 'error-keeps-input',
    anchor: "setNotice('Could not save. Your changes are still here. Try again.');",
    topic: 'resilience',
    title: 'Network failures keep the draft',
    rationale:
      'A thrown error is caught and reported in the status region. The draft and the beforeunload guard stay in place, so a dropped connection never costs the user their edits.',
    wcag: ['3.3.1'],
  },
  {
    id: 'conflict-group',
    anchor: '<fieldset key={name} className={styles.choice}>',
    endAnchor: '</fieldset>',
    topic: 'semantics',
    title: 'Each conflict is a labelled radio group',
    rationale:
      'A fieldset named by the field label groups "Keep mine" and "Keep theirs", and each option shows the actual value in text. Screen readers announce the field, both values, and which one is chosen; arrow keys switch between them.',
    wcag: ['1.3.1', '3.3.2'],
  },
  {
    id: 'changed-note',
    anchor: "'aria-describedby': isChanged ? `${inputId}-changed` : undefined,",
    endAnchor: 'Unsaved change',
    topic: 'semantics',
    title: 'Changed fields say so in text',
    rationale:
      'The amber bar is backed by an "Unsaved change" note tied to the input with aria-describedby. Users who cannot see the color, or are tabbing through with a screen reader, learn which fields are unsaved when they reach them.',
    wcag: ['1.4.1', '1.3.1'],
  },
  {
    id: 'leave-dialog',
    anchor: '<dialog',
    endAnchor: 'Keep editing',
    topic: 'focus',
    title: 'The leave dialog names what will be lost',
    rationale:
      'Instead of "Are you sure? OK", the dialog lists the changed fields and where the user is going, and offers Keep editing, Discard changes, or Save and leave. Escape is treated as Keep editing, the safe choice.',
    wcag: ['2.4.6', '3.3.4'],
  },
  {
    id: 'not-color-alone',
    file: 'styles',
    anchor: '/* Dirty state is shown with a text label and a dot, never color alone. */',
    endAnchor: 'background: var(--sux-warning, #b54708);',
    topic: 'styling',
    title: 'Dot plus words for unsaved state',
    rationale:
      'The status dot only appears next to text that already says "1 unsaved change", so the color adds emphasis but never carries the meaning on its own.',
    wcag: ['1.4.1'],
  },
  {
    id: 'forced-colors',
    file: 'styles',
    anchor: '@media (forced-colors: active) {',
    endAnchor: 'outline: 2px solid Highlight;',
    topic: 'styling',
    title: 'Selections survive high-contrast mode',
    rationale:
      'Forced colors strip box shadows and custom backgrounds. The dirty dot switches to CanvasText and the chosen conflict option gets a Highlight outline, so both stay visible in Windows high-contrast themes.',
    wcag: ['1.4.11'],
  },
];
