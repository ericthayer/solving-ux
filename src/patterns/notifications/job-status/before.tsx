import { useEffect, useRef, useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
export default function JobStatusBefore(): JSX.Element {
  const [page, setPage] = useState<'reports' | 'settings'>('reports');
  const [blocking, setBlocking] = useState(false);
  const [footer, setFooter] = useState('');
  const timers = useRef<number[]>([]);

  const clearAll = (): void => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearAll, []);

  const exportAll = (): void => {
    // Synchronous-feeling export: the whole app is blocked until it finishes.
    setBlocking(true);
    timers.current.push(window.setTimeout(() => setBlocking(false), 6000));
  };

  const importPrices = (): void => {
    // Runs with no indicator. 3 of 96 rows fail, but the result says "complete".
    timers.current.push(window.setTimeout(() => setFooter('Import complete'), 5000));
  };

  const go = (next: 'reports' | 'settings'): void => {
    // Leaving the page tears down the job with it.
    clearAll();
    setBlocking(false);
    setPage(next);
  };

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <button type="button" className={s.btn} onClick={() => go('reports')}>
          Reports
        </button>
        <button type="button" className={s.btn} onClick={() => go('settings')} {...failureTarget('nav-cancels')}>
          Settings
        </button>
      </div>
      {page === 'reports' ? (
        <div className={s.toolbar}>
          <button type="button" className={s.btnPrimary} onClick={exportAll}>
            Export customer list
          </button>
          <button type="button" className={s.btn} onClick={importPrices} {...failureTarget('silent-background')}>
            Import supplier prices
          </button>
        </div>
      ) : (
        <p className={s.muted}>Settings</p>
      )}
      <p className={s.muted}>
        Status: <span {...(footer ? failureTarget('hidden-partial') : {})}>{footer || 'Ready'}</span>
      </p>
      {blocking && (
        <div className={s.overlay} {...failureTarget('blocking-spinner')}>
          <div className={s.spinner} {...failureTarget('no-progress')} />
        </div>
      )}
    </div>
  );
}
