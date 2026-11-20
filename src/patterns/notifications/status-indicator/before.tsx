import { useEffect, useRef, useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Dot = 'green' | 'red' | 'yellow' | 'blue';
type Job = { id: string; name: string; dot: Dot; failure?: string };

const DOT: Record<Dot, string | undefined> = { green: s.dotGreen, red: s.dotRed, yellow: s.dotYellow, blue: s.dotBlue };

const JOBS: Job[] = [
  { id: 'export', name: 'Nightly ledger export', dot: 'green', failure: 'color-only' },
  { id: 'sync', name: 'Invoice sync', dot: 'red', failure: 'red-green' },
  { id: 'import', name: 'Vendor file import', dot: 'yellow', failure: 'low-contrast-dot' },
  { id: 'refresh', name: 'Rate table refresh', dot: 'blue', failure: 'no-text-alternative' },
  { id: 'report', name: 'Weekly report delivery', dot: 'blue' },
];

export default function StatusIndicatorBefore(): JSX.Element {
  const [jobs, setJobs] = useState(JOBS);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // The dot changes color twice and nothing is announced.
  const rerun = (): void => {
    window.clearTimeout(timer.current);
    setJobs((list) => list.map((j) => (j.id === 'sync' ? { ...j, dot: 'blue' } : j)));
    timer.current = window.setTimeout(() => setJobs((list) => list.map((j) => (j.id === 'sync' ? { ...j, dot: 'green' } : j))), 1500);
  };

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.spacer}>Scheduled jobs</span>
        <button type="button" className={s.btn} onClick={rerun}>
          Rerun Invoice sync
        </button>
      </div>
      <div className={s.scroll} {...failureTarget('silent-change')}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Job</th>
              <th>
                Status{' '}
                {/* The only key is a native tooltip on a 10px icon: mouse hover only. */}
                <span className={s.muted} title="Green = OK, Red = Failed, Yellow = Warning, Blue = Running or Scheduled" {...failureTarget('hover-only-legend')}>
                  (?)
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.name}</td>
                <td>
                  <span className={DOT[job.dot]} {...(job.failure ? failureTarget(job.failure) : {})} />
                </td>
              </tr>
            ))}
            <tr>
              <td>Statement run</td>
              <td>
                {/* Pastel badge: pale text on a pale fill, about 1.6:1. */}
                <span className={s.pastelBadge} {...failureTarget('pastel-badge')}>
                  Pending
                </span>
              </td>
            </tr>
            <tr>
              <td>Archive cleanup</td>
              <td>
                {/* Icon-only pause glyph with no accessible name. */}
                <svg width="12" height="12" viewBox="0 0 12 12" {...failureTarget('icon-only')}>
                  <rect x="2" y="1" width="3" height="10" fill="#9aa0a6" />
                  <rect x="7" y="1" width="3" height="10" fill="#9aa0a6" />
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
