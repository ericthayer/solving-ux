import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const approvalWorkflowPattern: PatternDefinition = {
  id: 'forms.approval-workflow',
  slug: 'approval-workflow',
  title: 'Approval workflow with status history',
  summary: 'Multi-approver review with a status timeline, a summary of what changed since the last round, one deliberate decision panel, and a required reason on reject.',
  category: 'forms',
  tags: ['forms', 'approval', 'workflow', 'status history', 'audit trail', 'error prevention'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Purchase and access requests pass through several approvers. The request page shows a colored status dot and a "Last modified" date, nothing more. Approve and Reject sit side by side and act on one click. Reject asks for no reason, so requesters resubmit blind, and second-round approvers re-read the whole request because nothing says what changed.',
  beforeState: {
    summary: 'Request detail with a color-only status and one-click Approve and Reject buttons.',
    failures: [
      {
        id: 'color-only-status',
        description: 'Status is a colored dot with a hover title. Color is the only visible cue and it has no accessible name.',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }, { kind: 'wcag', criterion: '1.3.1' }],
        target: { label: 'Status dot' },
      },
      {
        id: 'no-history',
        description: 'Only a "Last modified" date is shown. Nobody can see who acted, when, or why.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'wcag', criterion: '1.3.1' }],
        target: { label: 'Last modified date' },
      },
      {
        id: 'adjacent-no-confirm',
        description: 'Approve and Reject are the same size, side by side, and act on one click with no confirmation or undo.',
        refs: [{ kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '3.3.4' }],
        target: { label: 'Approve and Reject buttons' },
      },
      {
        id: 'reject-no-reason',
        description: 'Reject records no reason, so the requester cannot fix the request.',
        refs: [{ kind: 'heuristic', id: 'H9' }, { kind: 'wcag', criterion: '3.3.4' }],
        target: { label: 'Reject button' },
      },
      {
        id: 'no-change-summary',
        description: 'Approvers on a second round get no summary of what changed since the last review.',
        refs: [{ kind: 'heuristic', id: 'H6' }],
        target: { label: 'Request amount' },
      },
      {
        id: 'silent-decision',
        description: 'After a decision only the dot color changes and a grey "saved" appears. Nothing is announced.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: '"saved" text', revealedBy: 'Click Approve or Reject' },
      },
    ],
  },
  designRationale:
    'Status is text with an icon, and the approver chain is an ordered list marked with aria-current="step", so "who is this waiting on" needs no color. The history is an ordered list of events with actor, role, a machine-readable <time>, and the comment, so it doubles as the audit trail. A "Changed since the last review" table puts the delta first, which saves second-round approvers from re-reading the whole request. The decision panel replaces two side-by-side buttons with one choice and one submit button whose label names the outcome, plus a line that states the consequence. Reject and Request changes require a reason the requester will see. After a save, focus moves to the history heading and a status message confirms who the request moved to. A failed save keeps the comment.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'request', type: 'ApprovalRequest', required: true, description: 'Request id, title, requester, status, approver chain, history events, and changesSinceLastReview.' },
    { name: 'currentUser', type: 'string', required: true, description: 'Signed-in user. The decision panel renders only when they are the current approver.' },
    { name: 'onDecide', type: '(decision: Decision) => void | Promise<void>', required: true, description: 'Persist { kind, comment }. Reject the promise to keep the form and show a retry message. Use applyDecision() for the state transition.' },
    { name: 'locale', type: 'string', required: false, defaultValue: '"en-US"', description: 'Locale for history timestamps.' },
    { name: 'timeZone', type: 'string', required: false, defaultValue: '"UTC"', description: 'Time zone for history timestamps. Pass the viewer\'s zone in production.' },
  ],
  usage: `const [request, setRequest] = useState(initialRequest);

<ApprovalWorkflow
  request={request}
  currentUser={session.name}
  onDecide={async (decision) => {
    await api.recordDecision(request.id, decision);
    setRequest((r) => applyDecision(r, decision, new Date().toISOString()));
  }}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'History and approver chain are ordered lists; the change summary is a table with column and row headers.' },
    { kind: 'wcag', criterion: '3.3.4', level: 'AA', title: 'Error prevention', detail: 'Decisions are chosen, then confirmed with a button that names the outcome. The consequence is stated and linked by aria-describedby.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'A role="status" region confirms the saved decision and where the request went next.' },
    { kind: 'wcag', criterion: '2.4.6', level: 'AA', title: 'Headings and labels', detail: 'Sections have specific headings ("Changed since the last review", "Your decision", "Status history").' },
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Status, chain state, and history entries all carry text; color and icons are redundant cues.' },
    { kind: 'keyboard', keys: 'Arrow keys', action: 'Move between Approve, Request changes, and Reject (native radio group).' },
    { kind: 'keyboard', keys: 'Enter', action: 'In the decision form, submits the chosen decision.' },
    { kind: 'aria', attribute: 'aria-current="step"', detail: 'Marks the approver the request is waiting on.' },
    { kind: 'aria', attribute: 'aria-invalid + aria-describedby', detail: 'A missing reason is linked to the textarea and the textarea receives focus.' },
    { kind: 'screen-reader', title: 'After a decision', detail: 'Focus lands on "Status history, heading level 4" and the status message reads "Approve recorded. PR-2048 moves to Ana Ruiz (Director)."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
