import { useId } from 'react';
import styles from './StatusBadge.module.css';

/** Every tone pairs a hue with a distinct shape and a glyph, so no tone depends on color alone. */
export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';

export type StatusBadgeProps = {
  tone: StatusTone;
  /** Visible status text, e.g. "Failed". Always rendered: it is the accessible name. */
  label: string;
  /** Optional context after the label, e.g. "Timed out after 30 min". */
  detail?: string;
};

type Shape = { outline: string; filled: boolean; glyph: string };

/** 16×16 shapes. Filled shapes carry a knocked-out glyph; outlined ones are for states that are not outcomes yet. */
const SHAPES: Record<StatusTone, Shape> = {
  success: { outline: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z', filled: true, glyph: 'M4.8 8.3l2.1 2.1 4.3-4.6' },
  warning: { outline: 'M8 1.2 15.2 14.4H.8z', filled: true, glyph: 'M8 6v3.6M8 11.9v.1' },
  error: { outline: 'M5.1 1h5.8L15 5.1v5.8L10.9 15H5.1L1 10.9V5.1z', filled: true, glyph: 'M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8' },
  info: { outline: 'M2.5 1.5h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z', filled: true, glyph: 'M8 7.2v4.4M8 4.4v.1' },
  pending: { outline: 'M8 1.75a6.25 6.25 0 1 0 0 12.5A6.25 6.25 0 0 0 8 1.75z', filled: false, glyph: 'M8 4.6V8l2.3 1.5' },
  neutral: { outline: 'M8 1.75a6.25 6.25 0 1 0 0 12.5A6.25 6.25 0 0 0 8 1.75z', filled: false, glyph: 'M5.2 8h5.6' },
};

export function StatusIcon({ tone }: { tone: StatusTone }): JSX.Element {
  const shape = SHAPES[tone];
  return (
    <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-tone={tone}>
      <path className={shape.filled ? styles.shapeFilled : styles.shapeOutline} d={shape.outline} />
      <path className={shape.filled ? styles.glyphKnockout : styles.glyphStroke} d={shape.glyph} />
    </svg>
  );
}

/** A status that reads without color: shape, glyph, and visible text, each carrying the meaning on its own. */
export function StatusBadge({ tone, label, detail }: StatusBadgeProps): JSX.Element {
  return (
    <span className={styles.badge} data-tone={tone}>
      <StatusIcon tone={tone} />
      <span className={styles.label}>{label}</span>
      {detail && (
        <span className={styles.detail}>
          <span className={styles.visuallyHidden}>, </span>
          {detail}
        </span>
      )}
    </span>
  );
}

export type StatusLegendEntry = { tone: StatusTone; label: string; meaning: string };

export type StatusLegendProps = {
  /** Visible caption, e.g. "Status key". */
  caption: string;
  entries: StatusLegendEntry[];
};

/** Always-visible key for the status vocabulary. Replaces hover-only tooltips. */
export function StatusLegend({ caption, entries }: StatusLegendProps): JSX.Element {
  const captionId = useId();
  return (
    <figure className={styles.legend} aria-labelledby={captionId}>
      <figcaption id={captionId} className={styles.legendCaption}>
        {caption}
      </figcaption>
      <dl className={styles.legendList}>
        {entries.map((entry) => (
          <div key={entry.tone} className={styles.legendItem} data-tone={entry.tone}>
            <dt className={styles.legendTerm}>
              <StatusIcon tone={entry.tone} />
              {entry.label}
            </dt>
            <dd className={styles.legendMeaning}>{entry.meaning}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
