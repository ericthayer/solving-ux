import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Case = 'first-use' | 'no-results' | 'error' | 'no-access';

const CASES: Record<Case, string> = {
  'first-use': 'First use',
  'no-results': 'No results (3 filters on)',
  error: 'Service error',
  'no-access': 'No access',
};

export default function EmptyStateBefore(): JSX.Element {
  const [scenario, setScenario] = useState<Case>('first-use');

  return (
    <div className={s.frame}>
      <fieldset className={s.toolbar}>
        <legend className={s.muted}>Scenario (demo control)</legend>
        {(Object.keys(CASES) as Case[]).map((key) => (
          <label key={key}>
            <input type="radio" name="before-empty-case" checked={scenario === key} onChange={() => setScenario(key)} /> {CASES[key]}
          </label>
        ))}
      </fieldset>
      <div className={s.toolbar}>
        <span className={s.spacer}>Payment history</span>
        <button type="button" className={s.btn} {...failureTarget('filters-unmentioned')}>
          Filters ({scenario === 'no-results' ? 3 : 0})
        </button>
      </div>
      <div className={s.scroll} {...failureTarget('silent-change')}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Facility</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className={s.empty} {...failureTarget('no-next-step')}>
                {/* The same grey text for every case. In the error case it also hides the failure. */}
                <span {...failureTarget(scenario === 'error' ? 'error-no-retry' : 'one-message')}>No data</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
