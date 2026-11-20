import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const permissionAwareActionsPattern: PatternDefinition = {
  id: 'permissions.permission-aware-actions',
  slug: 'permission-aware-actions',
  title: 'Permission-aware actions',
  summary: 'One rule for hide versus disable versus allow-and-explain. Unavailable actions stay focusable, say why in visible text, and name who can grant access.',
  category: 'permissions',
  tags: ['permissions', 'roles', 'disabled state', 'aria-disabled', 'access request'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Users see actions they cannot perform because of their role, the state of the record, or a plan limit. Buttons are greyed out with no reason, or the reason sits in a hover tooltip on a disabled button that keyboard and screen reader users can never reach. Other actions are removed entirely, so users conclude the feature does not exist and file support tickets. Some actions look available and only fail with "403 Forbidden" after the click, with no word on who could help.',
  beforeState: {
    summary: 'Actions are disabled without a reason, explained only on hover, hidden, or allowed to fail with a bare 403.',
    failures: [
      {
        id: 'disabled-no-reason',
        description: 'Edit is natively disabled with no explanation. It leaves the tab order, so keyboard and screen reader users never learn it exists.',
        refs: [{ kind: 'wcag', criterion: '3.3.2' }, { kind: 'wcag', criterion: '4.1.2' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Edit button' },
      },
      {
        id: 'hover-only-reason',
        description: 'The reason for Invite lives in a title tooltip on a wrapper around a disabled button. It appears only on mouse hover and never on focus.',
        refs: [{ kind: 'wcag', criterion: '1.4.13' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Invite button and its tooltip' },
      },
      {
        id: 'hidden-action',
        description: 'Approve is removed for users without the approver role, so they assume the product cannot approve requests and ask support.',
        refs: [{ kind: 'heuristic', id: 'H6' }, { kind: 'heuristic', id: 'H10' }],
        target: { label: 'Toolbar with no Approve button' },
      },
      {
        id: 'dead-end-error',
        description: 'Delete looks available, then fails with "Error 403: Forbidden". The message names neither the missing permission nor who can grant it.',
        refs: [{ kind: 'wcag', criterion: '3.3.1' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: 'Error message', revealedBy: 'Click Delete' },
      },
    ],
  },
  designRationale:
    'The permission is a typed value, not a boolean, so every surface applies the same rule. Hide only what can never apply to this object for anyone, such as Approve on a draft. Disable what the user could do with a different role, a different record state, or more quota, and keep it visible. Disabled actions use aria-disabled instead of the disabled attribute, so they stay in the tab order and their reason is read with the name. The reason is visible text under the button, not a tooltip, and it names the fix: which role, who grants it, or what state change unlocks it. Role and quota reasons get a request control right there. Actions that are allowed but go through review stay enabled and say so before the click.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Verb + object, e.g. "Delete request".' },
    {
      name: 'permission',
      type: "{ status: 'allowed' } | { status: 'needs-approval'; approver } | { status: 'denied'; reason: DeniedReason } | { status: 'not-applicable' }",
      required: true,
      description: 'Resolved on the server per user and record. not-applicable hides the action; denied keeps it focusable with the reason shown.',
    },
    {
      name: 'DeniedReason',
      type: "{ kind: 'role'; requiredRole; grantedBy } | { kind: 'record-state'; state; resolution } | { kind: 'quota'; used; limit; unit; grantedBy }",
      required: false,
      description: 'Discriminated union passed inside permission. Each kind names what would change the answer.',
    },
    { name: 'onAction', type: "(outcome: 'run' | 'request-approval') => void", required: true, description: 'Never called while denied. needs-approval passes "request-approval".' },
    { name: 'onRequestAccess', type: '(reason: DeniedReason) => void', required: false, description: 'Shows a request control for role and quota reasons. Record-state reasons change through the workflow, so they get none.' },
    { name: 'tone', type: "'default' | 'danger'", required: false, defaultValue: "'default'", description: 'danger styles the enabled button for destructive actions.' },
  ],
  usage: `<PermissionAwareAction
  label="Edit request"
  permission={{
    status: 'denied',
    reason: { kind: 'role', requiredRole: 'Editor', grantedBy: 'Your workspace admin' },
  }}
  onAction={() => openEditor()}
  onRequestAccess={(reason) => api.requestAccess(reason)}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'aria-disabled="true" exposes the unavailable state while keeping the button focusable and named.' },
    { kind: 'wcag', criterion: '1.4.13', level: 'AA', title: 'Content on hover or focus', detail: 'No tooltip. The reason is persistent visible text, so there is nothing to dismiss, hover, or lose.' },
    { kind: 'wcag', criterion: '3.3.2', level: 'A', title: 'Labels or instructions', detail: 'Each reason says what would make the action available and who can grant it.' },
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'Denied actions and their request controls are reachable with Tab, unlike natively disabled buttons.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Reaches every visible action, including unavailable ones, then its "Request access" control.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'On an unavailable action, announces the reason instead of running it.' },
    { kind: 'aria', attribute: 'aria-disabled="true"', detail: 'Used instead of disabled so focus and description survive. The click handler refuses the action itself.' },
    { kind: 'aria', attribute: 'aria-describedby', detail: 'Points at the visible reason, so it is read after the name and state.' },
    { kind: 'aria', attribute: 'role="status"', detail: 'Announces the reason when an unavailable action is pressed, and confirms a sent request.' },
    { kind: 'screen-reader', title: 'On focus', detail: 'Reads "Edit request, button, unavailable, Requires the Editor role. Your workspace admin can grant it."' },
    { kind: 'screen-reader', title: 'Needs approval', detail: 'Reads "Delete request Needs approval, button, Sends a request to an admin instead of acting immediately."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
