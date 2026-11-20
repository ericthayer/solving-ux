import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
export default function PermissionAwareActionBefore(): JSX.Element {
  const [error, setError] = useState('');

  return (
    <div className={s.frame}>
      <strong>Purchase request PR-1042</strong>
      {/* Approve is filtered out for non-approvers, so the toolbar simply has one fewer button. */}
      <div className={s.toolbar} {...failureTarget('hidden-action')}>
        <button type="button" className={s.btnGreyed} disabled {...failureTarget('disabled-no-reason')}>
          Edit
        </button>
        <span title="You do not have permission" {...failureTarget('hover-only-reason')}>
          <button type="button" className={s.btnGreyed} disabled>
            Invite
          </button>
        </span>
        <button type="button" className={s.btn} onClick={() => setError('')}>
          Export PDF
        </button>
        <button type="button" className={s.btn} onClick={() => setError('Error 403: Forbidden')}>
          Delete
        </button>
      </div>
      {error && (
        <p className={s.error} {...failureTarget('dead-end-error')}>
          {error}
        </p>
      )}
      <p className={s.muted}>Try to find out why Edit and Invite are greyed out, then click Delete.</p>
    </div>
  );
}
