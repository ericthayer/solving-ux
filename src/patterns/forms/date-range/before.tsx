import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Side = 'from' | 'to';

const short = (d: Date): string =>
  `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;

export default function DateRangeInputBefore(): JSX.Element {
  const now = new Date();
  const [dates, setDates] = useState<Record<Side, Date>>({ from: new Date(now.getFullYear(), now.getMonth(), 3), to: new Date(now.getFullYear(), now.getMonth(), 4) });
  const [open, setOpen] = useState<Side | null>(null);
  const [result, setResult] = useState('');
  const month = dates[open ?? 'from'];
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const pick = (side: Side, day: number): void => {
    setDates({ ...dates, [side]: new Date(month.getFullYear(), month.getMonth(), day) });
    setOpen(null);
  };

  const run = (): void => {
    // No check that To is after From: an inverted range silently returns nothing.
    const count = dates.to < dates.from ? 0 : Math.round((dates.to.getTime() - dates.from.getTime()) / 864e5) * 37 + 12;
    setResult(`${count} orders found for ${short(dates.from)} - ${short(dates.to)}`);
  };

  const field = (side: Side, label: string): JSX.Element => (
    <div className={`${s.field} ${s.anchor}`}>
      <span>{label}</span>
      <div className={s.dateControl}>
        {/* Read-only: the only way to set a date is the mouse-driven popup. */}
        <input className={s.input} readOnly value={short(dates[side])} aria-label={label} {...(side === 'from' ? failureTarget('calendar-only') : failureTarget('inverted-range'))} />
        <div className={s.btn} onClick={() => setOpen(open === side ? null : side)} {...(side === 'from' ? failureTarget('unlabeled-trigger') : {})}>
          ▦
        </div>
      </div>
      {open === side && (
        <div className={s.dayGrid} {...failureTarget('mouse-only-grid')}>
          {Array.from({ length: days }, (_, i) => (
            <div key={i} className={s.dayCell} onClick={() => pick(side, i + 1)}>
              {i + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={s.frame}>
      <div className={s.toolbar} {...failureTarget('format-unstated')}>
        {field('from', 'From')}
        {field('to', 'To')}
        <span className={s.spacer} />
        <button type="button" className={s.btnPrimary} onClick={run}>
          Run report
        </button>
      </div>
      <p className={s.muted} {...failureTarget('no-time-zone')}>
        {result || 'Choose dates and run the report.'}
      </p>
    </div>
  );
}
