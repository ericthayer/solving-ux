import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Status = 'pending' | 'approved' | 'rejected';

const DOT: Record<Status, string | undefined> = { pending: s.dotPending, approved: s.dotApproved, rejected: s.dotRejected };

export default function ApprovalWorkflowBefore(): JSX.Element {
  const [status, setStatus] = useState<Status>('pending');
  const [saved, setSaved] = useState(false);

  // One click, no reason, no confirmation, and nothing is recorded about who or why.
  const decide = (next: Status): void => {
    setStatus(next);
    setSaved(true);
  };

  return (
    <div className={s.frame}>
      <table className={s.table}>
        <tbody>
          <tr>
            <th>Request</th>
            <td>PR-2048 Conference room display refresh</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>
              <span className={DOT[status]} title={status} {...failureTarget('color-only-status')} />
              {saved && (
                <span className={s.muted} {...failureTarget('silent-decision')}>
                  {' '}
                  saved
                </span>
              )}
            </td>
          </tr>
          <tr>
            <th>Amount</th>
            <td {...failureTarget('no-change-summary')}>$18,400</td>
          </tr>
          <tr>
            <th>Last modified</th>
            <td {...failureTarget('no-history')}>11/13/2026</td>
          </tr>
        </tbody>
      </table>
      <div className={s.toolbar} {...failureTarget('adjacent-no-confirm')}>
        <button type="button" className={s.btnPrimary} onClick={() => decide('approved')}>
          Approve
        </button>
        <button type="button" className={s.btn} onClick={() => decide('rejected')} {...failureTarget('reject-no-reason')}>
          Reject
        </button>
      </div>
    </div>
  );
}
