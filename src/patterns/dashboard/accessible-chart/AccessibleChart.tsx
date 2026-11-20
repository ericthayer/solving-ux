import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import styles from './AccessibleChart.module.css';
import { markerPath, niceTicks, useWidth } from './chartGeometry';
import type { Shape } from './chartGeometry';

export type ChartView = 'chart' | 'table';

/** One line. `null` is a missing value: no point is drawn and the table says "No data". */
export type ChartSeries = { id: string; label: string; values: (number | null)[] };

export type AccessibleChartProps = {
  title: string;
  /** The one-sentence takeaway. Required: a chart without one makes every user decode it alone. */
  summary: string;
  /** X-axis categories, e.g. months. Every series has one value per category. */
  categories: string[];
  /** Header for the category column in table view, e.g. "Month". */
  categoryLabel: string;
  /** Up to four series. Each gets its own color, dash pattern, and marker shape. */
  series: ChartSeries[];
  /** Y-axis name, e.g. "Days to approve". */
  valueLabel: string;
  formatValue?: (value: number) => string;
  defaultView?: ChartView;
  headingLevel?: 2 | 3 | 4;
};

type Point = { s: number; i: number };

/** Color alone never identifies a series: each one also differs in dash and marker. */
const SERIES_STYLES: { dash: string; shape: Shape }[] = [
  { dash: '', shape: 'circle' },
  { dash: '8 4', shape: 'square' },
  { dash: '2 4', shape: 'triangle' },
  { dash: '12 4 2 4', shape: 'diamond' },
];

function styleOf(index: number): { dash: string; shape: Shape } {
  return SERIES_STYLES[index % SERIES_STYLES.length] ?? { dash: '', shape: 'circle' };
}

const HEIGHT = 260;
const PAD = { top: 16, bottom: 32, left: 48 };
const LABEL_GUTTER = 112;

export function AccessibleChart({
  title,
  summary,
  categories,
  categoryLabel,
  series,
  valueLabel,
  formatValue = (v) => v.toLocaleString(),
  defaultView = 'chart',
  headingLevel = 3,
}: AccessibleChartProps): JSX.Element {
  const id = useId();
  const Heading = `h${headingLevel}` as const;
  const [view, setView] = useState<ChartView>(defaultView);
  const [plotRef, width] = useWidth();
  const [active, setActive] = useState<Point>({ s: 0, i: 0 });
  const [tip, setTip] = useState<Point | null>(null);
  const pointRefs = useRef(new Map<string, SVGGElement>());
  const focusNext = useRef(false);

  const directLabels = width >= 480;
  const right = directLabels ? LABEL_GUTTER : 16;
  const plotW = width - PAD.left - right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const max = Math.max(0, ...series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] ?? 1;
  const x = (i: number): number => PAD.left + (categories.length < 2 ? plotW / 2 : (i / (categories.length - 1)) * plotW);
  const y = (v: number): number => PAD.top + plotH - (v / top) * plotH;
  const labelEvery = Math.ceil(categories.length / Math.max(2, Math.floor(plotW / 56)));

  const valueAt = (s: number, i: number): number | null => series[s]?.values[i] ?? null;

  const pointLabel = ({ s, i }: Point): string => {
    const v = valueAt(s, i);
    return `${series[s]?.label ?? ''}, ${categories[i] ?? ''}: ${v === null ? 'no data' : formatValue(v)}, ${i + 1} of ${categories.length}`;
  };

  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    pointRefs.current.get(`${active.s}-${active.i}`)?.focus();
  }, [active]);

  /** Nearest point with data in direction `step`, or null at the edge. */
  const findIndex = (s: number, from: number, step: 1 | -1): number | null => {
    for (let i = from; i >= 0 && i < categories.length; i += step) if (valueAt(s, i) !== null) return i;
    return null;
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>): void => {
    const { s, i } = active;
    let next: Point | null = null;
    if (e.key === 'ArrowRight') next = { s, i: findIndex(s, i + 1, 1) ?? i };
    else if (e.key === 'ArrowLeft') next = { s, i: findIndex(s, i - 1, -1) ?? i };
    else if (e.key === 'Home') next = { s, i: findIndex(s, 0, 1) ?? i };
    else if (e.key === 'End') next = { s, i: findIndex(s, categories.length - 1, -1) ?? i };
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const ns = (s + (e.key === 'ArrowDown' ? 1 : -1) + series.length) % series.length;
      next = { s: ns, i: findIndex(ns, i, 1) ?? findIndex(ns, i, -1) ?? i };
    } else if (e.key === 'Escape') setTip(null);
    if (!next) return;
    e.preventDefault();
    focusNext.current = true;
    setActive(next);
    setTip(next);
  };

  // Direct end labels, nudged apart so close lines don't print on top of each other.
  const endLabels = series
    .map((s, si) => {
      const last = findIndex(si, categories.length - 1, -1);
      return last === null ? null : { si, last, y: y(s.values[last] as number) };
    })
    .filter((l): l is { si: number; last: number; y: number } => l !== null)
    .sort((a, b) => a.y - b.y);
  endLabels.forEach((l, k) => {
    const prev = endLabels[k - 1];
    if (prev) l.y = Math.max(l.y, prev.y + 14);
  });

  const tipValue = tip ? valueAt(tip.s, tip.i) : null;

  return (
    <figure className={styles.root} aria-labelledby={`${id}-title`}>
      <figcaption className={styles.header}>
        <Heading id={`${id}-title`} className={styles.title}>
          {title}
        </Heading>
        <p className={styles.summary}>{summary}</p>
      </figcaption>

      <fieldset className={styles.views}>
        <legend className={styles.visuallyHidden}>View {title} as</legend>
        {(['chart', 'table'] as const).map((option) => (
          <label key={option} className={styles.viewOption}>
            <input type="radio" name={`${id}-view`} value={option} checked={view === option} onChange={() => setView(option)} />
            <span>{option === 'chart' ? 'Chart' : 'Table'}</span>
          </label>
        ))}
      </fieldset>

      {view === 'chart' ? (
        <>
          <div ref={plotRef} className={styles.plot} onMouseLeave={() => setTip(null)}>
            <svg
              className={styles.svg}
              width={width}
              height={HEIGHT}
              role="group"
              aria-label={`${title}, chart`}
              aria-describedby={`${id}-hint`}
              onKeyDown={onKeyDown}
            >
              <g aria-hidden="true">
                {ticks.map((t) => (
                  <g key={t}>
                    <line className={styles.grid} x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} />
                    <text className={styles.tick} x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                      {t.toLocaleString()}
                    </text>
                  </g>
                ))}
                <line className={styles.axis} x1={PAD.left} x2={PAD.left + plotW} y1={y(0)} y2={y(0)} />
                {categories.map((c, i) =>
                  (i % labelEvery === 0 && categories.length - 1 - i >= labelEvery) || i === categories.length - 1 ? (
                    <text key={c} className={styles.tick} x={x(i)} y={HEIGHT - 10} textAnchor={directLabels || (i > 0 && i < categories.length - 1) ? 'middle' : i === 0 ? 'start' : 'end'}>
                      {c}
                    </text>
                  ) : null,
                )}
                {series.map((s, si) => (
                  <path
                    key={s.id}
                    className={styles.line}
                    data-series={si}
                    strokeDasharray={styleOf(si).dash || undefined}
                    d={s.values.reduce<string>((d, v, i) => (v === null ? d : `${d}${i === 0 || s.values[i - 1] === null ? 'M' : 'L'}${x(i)} ${y(v)}`), '')}
                  />
                ))}
                {directLabels &&
                  endLabels.map((l) => (
                    <text key={l.si} className={styles.endLabel} data-series={l.si} x={x(l.last) + 10} y={l.y} dy="0.32em">
                      {series[l.si]?.label}
                    </text>
                  ))}
              </g>

              {series.map((s, si) => (
                <g key={s.id} role="group" aria-label={s.label}>
                  {s.values.map((v, i) =>
                    v === null ? null : (
                      <g
                        key={categories[i]}
                        ref={(el) => {
                          if (el) pointRefs.current.set(`${si}-${i}`, el);
                          else pointRefs.current.delete(`${si}-${i}`);
                        }}
                        className={styles.point}
                        data-series={si}
                        role="img"
                        aria-label={pointLabel({ s: si, i })}
                        tabIndex={active.s === si && active.i === i ? 0 : -1}
                        onFocus={() => {
                          setActive({ s: si, i });
                          setTip({ s: si, i });
                        }}
                        onBlur={() => setTip(null)}
                        onMouseEnter={() => setTip({ s: si, i })}
                      >
                        <circle className={styles.hit} cx={x(i)} cy={y(v)} r={12} />
                        <circle className={styles.ring} cx={x(i)} cy={y(v)} r={9} />
                        <path className={styles.marker} d={markerPath(styleOf(si).shape, x(i), y(v))} />
                      </g>
                    ),
                  )}
                </g>
              ))}
            </svg>

            {tip && tipValue !== null && (
              <div
                className={styles.tooltip}
                aria-hidden="true"
                data-align={x(tip.i) > width * 0.66 ? 'end' : 'start'}
                style={{ '--tip-x': `${x(tip.i)}px`, '--tip-y': `${y(tipValue)}px` } as CSSProperties}
              >
                <strong>{series[tip.s]?.label}</strong>
                <span>
                  {categories[tip.i]}: {formatValue(tipValue)}
                </span>
              </div>
            )}
          </div>

          <ul className={styles.legend} aria-label="Series">
            {series.map((s, si) => (
              <li key={s.id} data-series={si}>
                <svg width="32" height="14" aria-hidden="true">
                  <line x1="0" x2="32" y1="7" y2="7" strokeDasharray={styleOf(si).dash || undefined} />
                  <path d={markerPath(styleOf(si).shape, 16, 7)} />
                </svg>
                {s.label}
              </li>
            ))}
          </ul>
          <p id={`${id}-hint`} className={styles.hint}>
            Tab to the chart, then use arrow keys to read each point. Up and Down switch series. Escape hides the tooltip.
          </p>
        </>
      ) : (
        <div className={styles.tableWrap} role="region" aria-labelledby={`${id}-caption`} tabIndex={0}>
          <table className={styles.table}>
            <caption id={`${id}-caption`} className={styles.visuallyHidden}>
              {title}, {valueLabel}
            </caption>
            <thead>
              <tr>
                <th scope="col">{categoryLabel}</th>
                {series.map((s) => (
                  <th key={s.id} scope="col">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c}>
                  <th scope="row">{c}</th>
                  {series.map((s) => {
                    const v = s.values[i] ?? null;
                    return <td key={s.id}>{v === null ? 'No data' : formatValue(v)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
