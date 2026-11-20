import type { CodeAnnotation } from '../../../types/walkthrough';

export const permissionAwareActionsWalkthrough: CodeAnnotation[] = [
  {
    id: 'reason-union',
    anchor: 'export type DeniedReason =',
    endAnchor: "| { kind: 'quota'; used: number; limit: number; unit: string; grantedBy: string };",
    topic: 'state',
    title: 'Every denial carries its fix',
    rationale:
      'A boolean canEdit can only grey a button out. The union forces the server to say why: a missing role and who grants it, a record state and what changes it, or a quota and who raises it. The UI cannot render a reason nobody supplied.',
    wcag: ['3.3.2'],
  },
  {
    id: 'hide-disable-rule',
    anchor: ' * The hide / disable / allow-and-explain rule, as a type.',
    endAnchor: "| { status: 'not-applicable' };",
    topic: 'state',
    title: 'Hide, disable, or allow-and-explain',
    rationale:
      'The audited app hid any action the user lacked rights for, so people filed tickets asking for features that existed. Hiding is now reserved for not-applicable: actions that can never apply to this object for anyone. Everything else stays visible.',
  },
  {
    id: 'describe-reason',
    anchor: 'export function describeReason(reason: DeniedReason): string {',
    endAnchor: 'return `${reason.used} of ${reason.limit} ${reason.unit} used. ${reason.grantedBy} can raise the limit.`;',
    topic: 'semantics',
    title: 'One sentence per reason, everywhere',
    rationale:
      'Exporting the formatter means a table row menu, a toolbar, and an audit log all say the same thing. Each sentence ends with who or what can change it, which replaces the bare "403 Forbidden" the audit found.',
    wcag: ['3.3.2', '3.3.1'],
  },
  {
    id: 'request-label',
    anchor: 'function requestLabel(reason: DeniedReason): string | null {',
    endAnchor: 'return null;',
    topic: 'semantics',
    title: 'Only offer requests a person can grant',
    rationale:
      'A role or a quota is lifted by a person, so it gets a request control. A locked or submitted record changes through the workflow, so a request button there would send a message nobody can act on.',
  },
  {
    id: 'early-hide',
    anchor: "if (permission.status === 'not-applicable') return null;",
    topic: 'state',
    title: 'Hooks first, then hide',
    rationale:
      'The hide branch returns after the hooks run, so switching a record between states never changes the hook order. React would otherwise throw when Approve appears on submit.',
  },
  {
    id: 'refuse-in-handler',
    anchor: '// aria-disabled keeps the button in the tab order, so the click handler has to refuse the action itself.',
    endAnchor: "onAction(permission.status === 'needs-approval' ? 'request-approval' : 'run');",
    topic: 'resilience',
    title: 'aria-disabled needs a guard in the handler',
    rationale:
      'Unlike the disabled attribute, aria-disabled does not stop clicks. The handler refuses the action and announces the reason instead, so a mouse user who clicks gets the same explanation a screen reader user hears on focus.',
    wcag: ['4.1.2'],
  },
  {
    id: 'aria-disabled',
    anchor: 'aria-disabled={denied || undefined}',
    endAnchor: 'aria-describedby={note ? noteId : undefined}',
    topic: 'focus',
    title: 'Focusable, unavailable, and described',
    rationale:
      'The native disabled attribute removes the button from the tab order, which is why keyboard users never found Edit in the audit. aria-disabled keeps focus, exposes "unavailable", and aria-describedby reads the reason right after the name.',
    wcag: ['4.1.2', '2.1.1'],
  },
  {
    id: 'visible-note',
    anchor: '{note && (',
    endAnchor: '{note}',
    topic: 'semantics',
    title: 'The reason is visible text, not a tooltip',
    rationale:
      'The audited reason lived in a title attribute on hover only. Persistent text below the button is read by everyone, needs no hover or dismiss logic, and survives touch screens where hover does not exist.',
    wcag: ['1.4.13', '3.3.2'],
  },
  {
    id: 'request-focus',
    anchor: '// aria-disabled, not disabled: a disabled button drops keyboard focus to the page body.',
    endAnchor: 'if (requested) return;',
    topic: 'focus',
    title: 'Sending a request keeps focus in place',
    rationale:
      'Disabling the request button after a click would throw focus to the top of the page. aria-disabled keeps the user where they were, and the guard stops a second request.',
    wcag: ['2.4.3'],
  },
  {
    id: 'status',
    anchor: '<span role="status" className={styles.visuallyHidden}>',
    endAnchor: '{announcement}',
    topic: 'announce',
    title: 'Pressing an unavailable action speaks',
    rationale:
      'The status region announces the reason when a denied action is pressed and confirms a sent request. In the audit, pressing anything unavailable produced silence or an unannounced 403.',
    wcag: ['4.1.3'],
  },
  {
    id: 'denied-style',
    file: 'styles',
    anchor: ".button[aria-disabled='true'],",
    endAnchor: 'cursor: not-allowed;',
    topic: 'styling',
    title: 'Unavailable without fading out',
    rationale:
      'Greyed-out text at 50% opacity fails contrast and reads as broken. A dashed border, sunken fill, and lock icon mark the state while the label keeps full contrast.',
    wcag: ['1.4.11', '1.4.1'],
  },
];
