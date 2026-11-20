import { useId, useState } from 'react';
import styles from './PermissionAwareAction.module.css';

/** Why a user cannot run an action right now. Every variant says what would change the answer. */
export type DeniedReason =
  | { kind: 'role'; requiredRole: string; grantedBy: string }
  | { kind: 'record-state'; state: string; resolution: string }
  | { kind: 'quota'; used: number; limit: number; unit: string; grantedBy: string };

/**
 * The hide / disable / allow-and-explain rule, as a type.
 * - allowed: render a normal button.
 * - needs-approval: allow, and explain that it sends a request instead of acting immediately.
 * - denied: keep it visible and focusable, mark it aria-disabled, and show the reason.
 * - not-applicable: hide. Only for actions that can never apply to this object, whoever the user is.
 */
export type ActionPermission =
  | { status: 'allowed' }
  | { status: 'needs-approval'; approver: string }
  | { status: 'denied'; reason: DeniedReason }
  | { status: 'not-applicable' };

export type ActionOutcome = 'run' | 'request-approval';

export type PermissionAwareActionProps = {
  /** Verb + object, e.g. "Delete request". */
  label: string;
  permission: ActionPermission;
  onAction: (outcome: ActionOutcome) => void;
  /** Called from the "Request access" control. Omit when there is no request flow. */
  onRequestAccess?: (reason: DeniedReason) => void;
  tone?: 'default' | 'danger';
};

/** Plain-language reason. Exported so tables, menus, and audit logs say the same thing. */
export function describeReason(reason: DeniedReason): string {
  switch (reason.kind) {
    case 'role':
      return `Requires the ${reason.requiredRole} role. ${reason.grantedBy} can grant it.`;
    case 'record-state':
      return `Unavailable while this record is ${reason.state}. ${reason.resolution}`;
    case 'quota':
      return `${reason.used} of ${reason.limit} ${reason.unit} used. ${reason.grantedBy} can raise the limit.`;
  }
}

/** Only reasons a person can lift get a request control; record state changes through the workflow itself. */
function requestLabel(reason: DeniedReason): string | null {
  if (reason.kind === 'role') return 'Request access';
  if (reason.kind === 'quota') return 'Request a higher limit';
  return null;
}

export function PermissionAwareAction({
  label,
  permission,
  onAction,
  onRequestAccess,
  tone = 'default',
}: PermissionAwareActionProps): JSX.Element | null {
  const id = useId();
  const [announcement, setAnnouncement] = useState('');
  const [requested, setRequested] = useState(false);

  if (permission.status === 'not-applicable') return null;

  const denied = permission.status === 'denied';
  const noteId = `${id}-note`;
  const note =
    permission.status === 'denied'
      ? describeReason(permission.reason)
      : permission.status === 'needs-approval'
        ? `Sends a request to ${permission.approver} instead of acting immediately.`
        : null;

  const handleClick = (): void => {
    // aria-disabled keeps the button in the tab order, so the click handler has to refuse the action itself.
    if (permission.status === 'denied') {
      setAnnouncement(`${label} is unavailable. ${describeReason(permission.reason)}`);
      return;
    }
    onAction(permission.status === 'needs-approval' ? 'request-approval' : 'run');
  };

  const request = permission.status === 'denied' && onRequestAccess ? requestLabel(permission.reason) : null;

  return (
    <div className={styles.action} data-status={permission.status}>
      <button
        type="button"
        className={tone === 'danger' ? styles.danger : styles.button}
        aria-disabled={denied || undefined}
        aria-describedby={note ? noteId : undefined}
        onClick={handleClick}
      >
        {denied && (
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />
          </svg>
        )}
        {label}
        {permission.status === 'needs-approval' && <span className={styles.badge}>Needs approval</span>}
      </button>

      {note && (
        <p id={noteId} className={styles.note}>
          {note}
        </p>
      )}

      {request && permission.status === 'denied' && (
        <button
          type="button"
          className={styles.request}
          // aria-disabled, not disabled: a disabled button drops keyboard focus to the page body.
          aria-disabled={requested || undefined}
          onClick={() => {
            if (requested) return;
            onRequestAccess?.(permission.reason);
            setRequested(true);
            setAnnouncement(`Request sent for ${label}.`);
          }}
        >
          {requested ? 'Request sent' : request}
          <span className={styles.visuallyHidden}>: {label}</span>
        </button>
      )}

      <span role="status" className={styles.visuallyHidden}>
        {announcement}
      </span>
    </div>
  );
}
