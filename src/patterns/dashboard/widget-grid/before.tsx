import { useEffect, useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Status = 'ready' | 'loading' | 'failed';

const RELATIONSHIPS = Array.from({ length: 25 }, (_, i) => `Relationship ${(i + 1).toString()}: $${(182 - i * 6).toString()}M`);

export default function DashboardGridBefore(): JSX.Element {
  const [status, setStatus] = useState<Status>('ready');
  const [failContracts, setFailContracts] = useState(false);

  useEffect(() => {
    if (status !== 'loading') return undefined;
    // Every widget waits for the slowest request, and any single failure fails the page.
    const timer = setTimeout(() => setStatus(failContracts ? 'failed' : 'ready'), 1400);
    return () => clearTimeout(timer);
  }, [status, failContracts]);

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.spacer}>Supply chain health</span>
        <label>
          <input type="checkbox" checked={failContracts} onChange={(e) => setFailContracts(e.target.checked)} /> Contracts service times out
        </label>
        <button type="button" className={s.btn} onClick={() => setStatus('loading')}>
          Reload
        </button>
      </div>
      <div {...failureTarget('global-failure')}>
        {status === 'loading' && (
          <p className={s.empty} {...failureTarget('global-spinner')}>
            Loading…
          </p>
        )}
        {status === 'failed' && <p className={s.empty}>Error loading dashboard.</p>}
        {status === 'ready' && (
          <div className={s.fixedGrid} {...failureTarget('fixed-columns')}>
            <section className={s.card}>
              <h4 className={s.cardTitle}>Committed spend</h4>
              <span className={s.big}>$4.21B</span>{' '}
              <span className={s.up} {...failureTarget('color-only-trend')}>
                ▲ 3.1%
              </span>
            </section>
            <section className={s.card}>
              <h4 className={s.cardTitle}>Late deliveries (30 days)</h4>
              <span className={s.big}>0.42%</span> <span className={s.down}>▲ 0.08</span>
            </section>
            <section className={s.card}>
              <h4 className={s.cardTitle}>Contract breaches</h4>
              <span className={s.big}>0</span>
            </section>
            <section className={s.card}>
              <h4 className={s.cardTitle}>Largest suppliers</h4>
              <ol className={s.shortScroll} {...failureTarget('scroll-trap')}>
                {RELATIONSHIPS.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
