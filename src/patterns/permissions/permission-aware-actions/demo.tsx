import { useId, useState } from 'react';
import { PermissionAwareAction } from './PermissionAwareAction';
import type { ActionPermission } from './PermissionAwareAction';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

type Role = 'Viewer' | 'Editor' | 'Admin';
type RecordState = 'Draft' | 'Submitted' | 'Locked';

const ROLES: Role[] = ['Viewer', 'Editor', 'Admin'];
const STATES: RecordState[] = ['Draft', 'Submitted', 'Locked'];
const SEAT_LIMIT = 5;
const ADMIN = 'Your workspace admin';

const role = (requiredRole: string): ActionPermission => ({ status: 'denied', reason: { kind: 'role', requiredRole, grantedBy: ADMIN } });

/** Demo policy. In production this comes from the server with the record, never from the client. */
function permissionsFor(r: Role, state: RecordState, seatsUsed: number): Record<'edit' | 'approve' | 'invite' | 'export' | 'delete', ActionPermission> {
  const locked: ActionPermission = { status: 'denied', reason: { kind: 'record-state', state: 'locked', resolution: 'An admin can unlock it.' } };
  return {
    edit:
      r === 'Viewer'
        ? role('Editor')
        : state === 'Locked'
          ? locked
          : state === 'Submitted'
            ? { status: 'denied', reason: { kind: 'record-state', state: 'submitted for approval', resolution: 'Recall it to make changes.' } }
            : { status: 'allowed' },
    // A draft can never be approved by anyone, so Approve is hidden rather than disabled.
    approve: state !== 'Submitted' ? { status: 'not-applicable' } : r === 'Admin' ? { status: 'allowed' } : role('Approver'),
    invite:
      r === 'Viewer'
        ? role('Editor')
        : seatsUsed >= SEAT_LIMIT
          ? { status: 'denied', reason: { kind: 'quota', used: seatsUsed, limit: SEAT_LIMIT, unit: 'collaborator seats', grantedBy: ADMIN } }
          : { status: 'allowed' },
    export: { status: 'allowed' },
    delete: r === 'Viewer' ? role('Editor') : state === 'Locked' ? locked : r === 'Editor' ? { status: 'needs-approval', approver: 'an admin' } : { status: 'allowed' },
  };
}

export default function PermissionAwareActionDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const [currentRole, setRole] = useState<Role>('Viewer');
  const [state, setState] = useState<RecordState>('Draft');
  const [seatsUsed, setSeatsUsed] = useState(SEAT_LIMIT);
  const [log, setLog] = useState('No action taken yet.');
  const titleId = useId();
  const p = permissionsFor(currentRole, state, seatsUsed);

  const act = (name: string) => (outcome: 'run' | 'request-approval') =>
    setLog(outcome === 'request-approval' ? `${name}: approval requested from an admin.` : `${name}: done.`);
  const requested = (name: string) => () => setLog(`${name}: access request sent to your workspace admin.`);

  return (
    <div className={demo.stack}>
      <fieldset className={demo.panel}>
        <legend className={demo.panelTitle}>Try it as</legend>
        <div className={demo.row}>
          {ROLES.map((r) => (
            <label key={r} className={demo.row}>
              <input type="radio" name="demo-role" value={r} checked={currentRole === r} onChange={() => setRole(r)} />
              {r}
            </label>
          ))}
          <label className={demo.row}>
            Record state
            <select value={state} onChange={(event) => setState(event.target.value as RecordState)}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className={demo.row}>
            Seats used
            <input type="number" min={0} max={SEAT_LIMIT} value={seatsUsed} onChange={(event) => setSeatsUsed(Number(event.target.value))} />
          </label>
        </div>
      </fieldset>

      <section aria-labelledby={titleId} className={demo.stack}>
        <h3 id={titleId} className={demo.panelTitle}>
          {text('Purchase request PR-1042')}
        </h3>
        <div role="group" aria-label="Request actions" className={demo.row}>
          <PermissionAwareAction label={text('Edit request')} permission={p.edit} onAction={act('Edit request')} onRequestAccess={requested('Edit request')} />
          <PermissionAwareAction label="Approve" permission={p.approve} onAction={act('Approve')} onRequestAccess={requested('Approve')} />
          <PermissionAwareAction label={text('Invite collaborator')} permission={p.invite} onAction={act('Invite collaborator')} onRequestAccess={requested('Invite collaborator')} />
          <PermissionAwareAction label="Export PDF" permission={p.export} onAction={act('Export PDF')} />
          <PermissionAwareAction label="Delete request" tone="danger" permission={p.delete} onAction={act('Delete request')} onRequestAccess={requested('Delete request')} />
        </div>
      </section>

      <p className={demo.log} aria-live="polite">
        {log}
      </p>
    </div>
  );
}
