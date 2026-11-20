import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';
import { APPROVAL_SERIES, MONTHS } from './demo';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const W = 520;
const H = 220;
const COLORS = ['#138a36', '#d21f1f', '#c9dcef'];
const x = (i: number): number => 30 + (i / (MONTHS.length - 1)) * (W - 50);
const y = (v: number): number => H - 20 - (v / 12) * (H - 40);

export default function AccessibleChartBefore(): JSX.Element {
  const [hover, setHover] = useState<{ s: number; i: number } | null>(null);
  const [exported, setExported] = useState(false);

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.spacer}>PO approval time</span>
        <button type="button" className={s.btn} onClick={() => setExported(true)} {...failureTarget('no-data-access')}>
          Download PNG
        </button>
      </div>
      {exported && <p className={s.muted}>chart.png saved.</p>}
      <div className={s.anchor}>
        {/* No role, no title, no summary: assistive tech gets nothing. */}
        <svg width={W} height={H} {...failureTarget('no-text-alternative')} onMouseLeave={() => setHover(null)}>
          {[0, 3, 6, 9, 12].map((t) => (
            <line key={t} x1={30} x2={W - 20} y1={y(t)} y2={y(t)} stroke="#eeeeee" />
          ))}
          {APPROVAL_SERIES.map((ser, si) => (
            <polyline
              key={ser.id}
              fill="none"
              stroke={COLORS[si]}
              strokeWidth={1}
              points={ser.values.map((v, i) => `${x(i)},${y(v ?? 0)}`).join(' ')}
              {...(si === 2 ? failureTarget('low-contrast-lines') : {})}
            />
          ))}
          <g {...failureTarget('hover-only-tooltip')}>
            {APPROVAL_SERIES.map((ser, si) =>
              ser.values.map((v, i) => (
                <circle
                  key={`${ser.id}-${i}`}
                  cx={x(i)}
                  cy={y(v ?? 0)}
                  r={2}
                  fill={COLORS[si]}
                  onMouseMove={() => setHover({ s: si, i })}
                />
              )),
            )}
          </g>
          {hover && (
            <text x={x(hover.i) + 6} y={y(APPROVAL_SERIES[hover.s]?.values[hover.i] ?? 0) - 6} fontSize={10}>
              {APPROVAL_SERIES[hover.s]?.values[hover.i]}
            </text>
          )}
        </svg>
      </div>
      <div className={s.toolbar} {...failureTarget('color-only-series')}>
        {APPROVAL_SERIES.map((ser, si) => (
          <span key={ser.id}>
            <svg width={8} height={8}>
              <rect width={8} height={8} fill={COLORS[si]} />
            </svg>{' '}
            {ser.label}
          </span>
        ))}
      </div>
    </div>
  );
}
