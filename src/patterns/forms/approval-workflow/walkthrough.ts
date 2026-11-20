import type { CodeAnnotation } from '../../../types/walkthrough';

export const approvalWorkflowWalkthrough: CodeAnnotation[] = [
  {
    id: 'consequence',
    anchor: "const DECISIONS: { kind: DecisionKind; label: string; button: string;",
    endAnchor: '];',
    topic: 'semantics',
    title: 'Each decision names its outcome and consequence',
    rationale:
      'The audited page had Approve and Reject side by side with one-click effect. Here the submit button label changes with the choice ("Reject request") and a consequence line says what happens next, so the confirmation is built into the form rather than added as a modal.',
    wcag: ['3.3.4'],
  },
  {
    id: 'apply-decision',
    anchor: '/** Pure state transition: returns the request after `actor` records `decision` at `at`. */',
    endAnchor: 'return { ...request, approvers, status, history: [...request.history, event]',
    topic: 'state',
    title: 'Decisions are a pure transition that appends history',
    rationale:
      'Every decision produces a history event with actor, role, time, and comment. The history is never rewritten, so it doubles as the audit trail. Keeping the transition pure lets the server and the UI share it and makes it testable without rendering.',
    wcag: ['1.3.1'],
  },
  {
    id: 'focus-history',
    anchor: '// The decision panel unmounts after a save, so focus moves to the history that now holds the decision.',
    endAnchor: '}, [request.history.length]);',
    topic: 'focus',
    title: 'Focus follows the decision into the history',
    rationale:
      'Once the approver acts, the panel disappears. Without this, focus would fall to the page body. The history heading is where the new entry lands, and a ref flag keeps focus still on first render.',
    wcag: ['2.4.3'],
  },
  {
    id: 'reason-required',
    anchor: 'if (needsReason && comment.trim().length < 10) {',
    endAnchor: 'return;',
    topic: 'focus',
    title: 'Reject requires a reason the requester can act on',
    rationale:
      'A rejection with no reason forces the requester to guess. The message says why the reason matters, and focus moves to the textarea so keyboard and screen reader users land on the problem.',
    wcag: ['3.3.1', '3.3.3'],
  },
  {
    id: 'status-text',
    anchor: '<p className={styles.status} data-status={request.status}>',
    endAnchor: '</p>',
    topic: 'semantics',
    title: 'Status is text, not a color',
    rationale:
      'The icon is aria-hidden and the color is a border, so the status is read and seen the same way. "Waiting on you" answers the question approvers actually have.',
    wcag: ['1.4.1', '1.3.1'],
  },
  {
    id: 'chain',
    anchor: "<li key={a.name} aria-current={a === approver ? 'step' : undefined} data-decision={a.decision}>",
    topic: 'semantics',
    title: 'Approver chain with aria-current="step"',
    rationale: 'An ordered list conveys sequence, and aria-current marks who the request is waiting on without relying on the dark top border.',
    wcag: ['1.3.1'],
  },
  {
    id: 'changes',
    anchor: '{request.changesSinceLastReview.length > 0 && (',
    endAnchor: '</table>',
    topic: 'semantics',
    title: 'What changed since the last round, first',
    rationale:
      'Second-round approvers need the delta, not the whole request again. A table with column and row headers reads as "Unit price, Was $1,995, Now $1,840". Strikethrough is visual only, so the Was and Now headers carry the meaning.',
    wcag: ['1.3.1', '2.4.6'],
  },
  {
    id: 'save-failed',
    anchor: "{saveState === 'failed' && (",
    endAnchor: 'Your decision was not saved. Your comment is still here. Try again.',
    topic: 'resilience',
    title: 'A failed save keeps the comment',
    rationale: 'role="alert" announces the failure. The form state is untouched, so a long rejection reason is not lost to a network blip.',
    wcag: ['4.1.3'],
  },
  {
    id: 'timeline',
    anchor: '<ol className={styles.timeline}>',
    endAnchor: '</ol>',
    topic: 'semantics',
    title: 'History as an ordered list with machine-readable times',
    rationale:
      'Each event says who, in what role, when, and why. <time dateTime> keeps the raw timestamp for tools while the visible text is localized.',
    wcag: ['1.3.1'],
  },
  {
    id: 'announce',
    anchor: '<p role="status" className={styles.visuallyHidden}>{announcement}</p>',
    topic: 'announce',
    title: 'The outcome is announced',
    rationale: 'The status region is always mounted so the update is announced reliably. It says the decision was recorded and where the request went next.',
    wcag: ['4.1.3'],
  },
  {
    id: 'reject-tone',
    file: 'styles',
    anchor: ".primary[data-kind='reject'] {",
    endAnchor: '}',
    topic: 'styling',
    title: 'One button, toned by the choice',
    rationale: 'There is a single submit button, so it can never be mis-clicked for its neighbor. It turns to the danger color only when Reject is chosen, and its label changes too, so color is not the only signal.',
    wcag: ['1.4.1'],
  },
];
