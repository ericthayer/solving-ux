import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './DashboardGrid.module.css';

export type Density = 'comfortable' | 'compact';

export type WidgetState =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'empty'; message: string }
  | { status: 'ready'; content: ReactNode };

export type WidgetProps = {
  title: string;
  state: WidgetState;
  /** Short context line under the title, e.g. "Last 30 days". */
  description?: string;
  /** Columns to span on wide containers. Falls back to 1 on narrow ones. */
  span?: 1 | 2;
  /** Escape hatch for overflow: link to the full view instead of cramming rows into the card. */
  viewAll?: { label: string; href: string };
};

export function Widget({ title, state, description, span = 1, viewAll }: WidgetProps): JSX.Element {
  const titleId = useId();
  return (
    <section
      className={styles.widget}
      data-span={span}
      aria-labelledby={titleId}
      aria-busy={state.status === 'loading' || undefined}
    >
      <header className={styles.widgetHeader}>
        <h3 id={titleId} className={styles.widgetTitle}>
          {title}
        </h3>
        {description && <p className={styles.description}>{description}</p>}
      </header>

      <div className={styles.body}>
        {state.status === 'loading' && (
          <div className={styles.skeleton}>
            <span className={styles.visuallyHidden}>Loading {title}</span>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </div>
        )}
        {state.status === 'error' && (
          <div className={styles.message} role="status">
            <p>
              <strong>{title} did not load.</strong> {state.message}
            </p>
            <button type="button" className={styles.button} onClick={state.onRetry} aria-label={`Retry loading ${title}`}>
              Retry
            </button>
          </div>
        )}
        {state.status === 'empty' && (
          <div className={styles.message}>
            <p>{state.message}</p>
          </div>
        )}
        {state.status === 'ready' && state.content}
      </div>

      {viewAll && state.status === 'ready' && (
        <footer className={styles.footer}>
          <a href={viewAll.href} className={styles.link}>
            {viewAll.label}
          </a>
        </footer>
      )}
    </section>
  );
}

export type DashboardGridProps = {
  title: string;
  children: ReactNode;
  defaultDensity?: Density;
  onDensityChange?: (density: Density) => void;
};

export function DashboardGrid({ title, children, defaultDensity = 'comfortable', onDensityChange }: DashboardGridProps): JSX.Element {
  const headingId = useId();
  const [density, setDensity] = useState<Density>(defaultDensity);

  const change = (next: Density): void => {
    setDensity(next);
    onDensityChange?.(next);
  };

  return (
    <section className={styles.root} aria-labelledby={headingId} data-density={density}>
      <div className={styles.toolbar}>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        <fieldset className={styles.density}>
          <legend className={styles.visuallyHidden}>Density</legend>
          {(['comfortable', 'compact'] as const).map((option) => (
            <label key={option} className={styles.densityOption}>
              <input
                type="radio"
                name={`${headingId}-density`}
                value={option}
                checked={density === option}
                onChange={() => change(option)}
              />
              <span>{option === 'comfortable' ? 'Comfortable' : 'Compact'}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}

export type StatProps = { label: string; value: string; change?: { value: string; direction: 'up' | 'down' | 'flat'; good: boolean } };

/** Single KPI. Direction is spelled out in text so meaning never depends on color or arrow glyphs. */
export function Stat({ label, value, change }: StatProps): JSX.Element {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {change && (
        <p className={styles.statChange} data-good={change.good}>
          <span aria-hidden="true">{change.direction === 'up' ? '▲' : change.direction === 'down' ? '▼' : '■'} </span>
          {change.direction === 'flat' ? 'No change' : `${change.direction === 'up' ? 'Up' : 'Down'} ${change.value}`}
        </p>
      )}
    </div>
  );
}
