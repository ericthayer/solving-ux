import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import styles from './DateRangeInput.module.css';

/** A calendar date as "YYYY-MM-DD". It has no time part, so it never shifts across time zones. */
export type IsoDate = string;
export type DateRange = { start: IsoDate | null; end: IsoDate | null };
export type RangePreset = { label: string; range: (today: IsoDate) => { start: IsoDate; end: IsoDate } };
export type DateBounds = { min?: IsoDate; max?: IsoDate; maxDays?: number };
type FieldKey = 'start' | 'end';
type Labels = Record<FieldKey, string>;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MS = 86_400_000;
const pad = (n: number): string => String(n).padStart(2, '0');
const toNum = (iso: IsoDate): number => Date.parse(`${iso}T00:00:00Z`) / DAY_MS;
const fromNum = (n: number): IsoDate => new Date(n * DAY_MS).toISOString().slice(0, 10);
const parts = (iso: IsoDate): [number, number, number] => iso.split('-').map(Number) as [number, number, number];
const weekday = (iso: IsoDate): number => new Date(toNum(iso) * DAY_MS).getUTCDay();
const lower = (label: string): string => label.charAt(0).toLowerCase() + label.slice(1);
export const addDays = (iso: IsoDate, days: number): IsoDate => fromNum(toNum(iso) + days);
export const daysBetween = (from: IsoDate, to: IsoDate): number => toNum(to) - toNum(from);

/** Builds a date only if it exists: 02/30 is rejected, never rolled over into March. */
function makeIso(y: number, m: number, d: number): IsoDate | null {
  if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1) return null;
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  return Number.isFinite(toNum(iso)) && fromNum(toNum(iso)) === iso ? iso : null;
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const [y, m, d] = parts(iso);
  const index = y * 12 + m - 1 + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return makeIso(year, month, Math.min(d, lastDay)) ?? iso;
}

/** "03/04/2026": the format the label promises. */
export const formatShort = (iso: IsoDate): string => {
  const [y, m, d] = parts(iso);
  return `${pad(m)}/${pad(d)}/${y}`;
};

/** "Wednesday, March 4, 2026": an unambiguous echo of what the parser understood. */
export const formatLong = (iso: IsoDate): string => {
  const [y, m, d] = parts(iso);
  return `${WEEKDAYS[weekday(iso)]}, ${MONTHS[m - 1]} ${d}, ${y}`;
};

const monthFromName = (word: string): number =>
  word.length < 3 ? 0 : MONTHS.findIndex((name) => name.toLowerCase().startsWith(word.toLowerCase())) + 1;
const fullYear = (y: string): number => (y.length === 2 ? 2000 + Number(y) : Number(y));

/**
 * Tolerant, not clever. Accepts the stated MM/DD/YYYY with any separator or none, 2-digit years,
 * ISO dates and month names. It never guesses day-first, so 03/04 always means March 4.
 */
export function parseDate(text: string): IsoDate | null {
  const t = text.trim().replace(/\s+/g, ' ');
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) return makeIso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{2}|\d{4})$/.exec(t) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(t);
  if (m) return makeIso(fullYear(m[3] ?? ''), Number(m[1]), Number(m[2]));
  m = /^([a-z]+)\.? (\d{1,2}),? (\d{4})$/i.exec(t);
  if (m) return makeIso(Number(m[3]), monthFromName(m[1] ?? ''), Number(m[2]));
  m = /^(\d{1,2}) ([a-z]+)\.?,? (\d{4})$/i.exec(t);
  if (m) return makeIso(Number(m[3]), monthFromName(m[2] ?? ''), Number(m[1]));
  return null;
}

export type RangeCheck = { range: DateRange; errors: Partial<Record<FieldKey, string>> };

/** Validates typed text. Every message says how to fix the problem, not just that one exists. */
export function validateRange(text: Labels, labels: Labels, bounds: DateBounds, single = false, required = false): RangeCheck {
  const result: RangeCheck = { range: { start: null, end: null }, errors: {} };
  for (const key of single ? (['start'] as const) : (['start', 'end'] as const)) {
    const value = text[key].trim();
    if (!value) {
      if (required) result.errors[key] = `Enter ${lower(labels[key])}.`;
      continue;
    }
    const iso = parseDate(value);
    if (!iso) result.errors[key] = `Enter ${lower(labels[key])} as MM/DD/YYYY, for example 03/04/2026.`;
    else if (bounds.min && iso < bounds.min) result.errors[key] = `${labels[key]} must be on or after ${formatLong(bounds.min)}.`;
    else if (bounds.max && iso > bounds.max) result.errors[key] = `${labels[key]} must be on or before ${formatLong(bounds.max)}.`;
    else result.range[key] = iso;
  }
  const { start, end } = result.range;
  if (start && end && end < start) {
    result.errors.end = `${labels.end} must be on or after ${lower(labels.start)}, ${formatLong(start)}.`;
    result.range.end = null;
  } else if (start && end && bounds.maxDays && daysBetween(start, end) + 1 > bounds.maxDays) {
    result.errors.end = `Choose a range of ${bounds.maxDays} days or fewer. This one is ${daysBetween(start, end) + 1} days.`;
    result.range.end = null;
  }
  return result;
}

export const DEFAULT_PRESETS: RangePreset[] = [
  { label: 'Last 7 days', range: (today) => ({ start: addDays(today, -6), end: today }) },
  { label: 'Last 30 days', range: (today) => ({ start: addDays(today, -29), end: today }) },
  { label: 'This month', range: (today) => ({ start: `${today.slice(0, 8)}01`, end: today }) },
  { label: 'Last month', range: (today) => ({ start: addMonths(`${today.slice(0, 8)}01`, -1), end: addDays(`${today.slice(0, 8)}01`, -1) }) },
];

type CalendarProps = { label: string; selected: IsoDate | null; today: IsoDate; bounds: DateBounds; range: DateRange; onPick: (iso: IsoDate) => void; onClose: (returnFocus: boolean) => void };

/** Optional helper, never the only way in. Follows the APG date picker dialog pattern. */
function CalendarDialog({ label, selected, today, bounds, range, onPick, onClose }: CalendarProps): JSX.Element {
  const headingId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const clamp = (iso: IsoDate): IsoDate => (bounds.min && iso < bounds.min ? bounds.min : bounds.max && iso > bounds.max ? bounds.max : iso);
  const [focus, setFocus] = useState<IsoDate>(() => clamp(selected ?? today));
  const moveFocus = useRef(true);
  const isDisabled = (iso: IsoDate): boolean => Boolean((bounds.min && iso < bounds.min) || (bounds.max && iso > bounds.max));

  // Roving tabindex: the focused day is the only tabbable cell. Month buttons page without stealing focus.
  useEffect(() => {
    if (moveFocus.current) ref.current?.querySelector<HTMLElement>('td[tabindex="0"]')?.focus();
  }, [focus]);

  useEffect(() => {
    const onDown = (event: MouseEvent): void => {
      if (!ref.current?.parentElement?.contains(event.target as Node)) onClose(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  const onGridKey = (event: KeyboardEvent<HTMLTableElement>): void => {
    const dow = weekday(focus);
    const moves: Record<string, () => IsoDate> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -dow),
      End: () => addDays(focus, 6 - dow),
      PageUp: () => addMonths(focus, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, event.shiftKey ? 12 : 1),
    };
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isDisabled(focus)) onPick(focus);
      return;
    }
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveFocus.current = true;
    setFocus(clamp(move()));
  };

  // Modal: Tab cycles inside the dialog and Escape returns focus to the button that opened it.
  const onDialogKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose(true);
    } else if (event.key === 'Tab' && ref.current) {
      const items = [...ref.current.querySelectorAll<HTMLElement>('button, td[tabindex="0"]')];
      const edge = event.shiftKey ? items[0] : items[items.length - 1];
      if (document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey ? items[items.length - 1] : items[0])?.focus();
      }
    }
  };

  const page = (months: number): void => {
    moveFocus.current = false;
    setFocus(clamp(addMonths(focus, months)));
  };

  const [y, m] = parts(focus);
  const first = makeIso(y, m, 1) ?? focus;
  const lead = weekday(first);
  const weeks = Math.ceil((lead + daysBetween(first, addMonths(first, 1))) / 7);
  const inRange = (iso: IsoDate): boolean => Boolean(range.start && range.end && iso >= range.start && iso <= range.end);

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className={styles.dialog} onKeyDown={onDialogKey}>
      <div className={styles.dialogHeader}>
        <button type="button" className={styles.navButton} aria-label="Previous month" onClick={() => page(-1)}>‹</button>
        <p id={headingId} className={styles.month} aria-live="polite">{`${MONTHS[m - 1]} ${y}`}</p>
        <button type="button" className={styles.navButton} aria-label="Next month" onClick={() => page(1)}>›</button>
      </div>
      <table role="grid" className={styles.grid} aria-labelledby={headingId} onKeyDown={onGridKey}>
        <thead>
          <tr>{WEEKDAYS.map((d) => <th key={d} scope="col" abbr={d}>{d.slice(0, 2)}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: weeks }, (_, w) => (
            <tr key={w}>
              {Array.from({ length: 7 }, (_, i) => {
                const iso = addDays(first, w * 7 + i - lead);
                if (!iso.startsWith(first.slice(0, 8))) return <td key={i} role="gridcell" />;
                const disabled = isDisabled(iso);
                return (
                  <td key={i} role="gridcell" tabIndex={iso === focus ? 0 : -1} aria-label={formatLong(iso)} aria-selected={iso === selected}
                    aria-disabled={disabled || undefined} aria-current={iso === today ? 'date' : undefined} data-in-range={inRange(iso) || undefined}
                    onClick={() => !disabled && onPick(iso)}>
                    {Number(iso.slice(8))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.dialogFooter}>
        <p className={styles.hint}>Arrows move by day. Page Up and Page Down change month.</p>
        <button type="button" className={styles.linkButton} onClick={() => onClose(true)}>Cancel</button>
      </div>
    </div>
  );
}

export type DateRangeInputProps = DateBounds & {
  /** Group name in range mode; the field label in single mode. */
  legend: string;
  mode?: 'range' | 'single';
  labels?: Labels;
  defaultValue?: DateRange;
  /** Called only with a valid range. A range with errors is never emitted. */
  onChange: (range: DateRange) => void;
  presets?: RangePreset[];
  required?: boolean;
  /** Where dates turn into instants, say how, e.g. "Dates use UTC, 00:00 to 23:59." */
  timeZoneNote?: string;
  /** Today's date for presets and the calendar. Defaults to the user's local date. */
  today?: IsoDate;
};

const localToday = (): IsoDate => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function DateRangeInput({ legend, mode = 'range', labels = { start: 'Start date', end: 'End date' }, defaultValue, onChange, presets = DEFAULT_PRESETS, min, max, maxDays, required = false, timeZoneNote, today = localToday() }: DateRangeInputProps): JSX.Element {
  const id = useId();
  const single = mode === 'single';
  const keys: FieldKey[] = single ? ['start'] : ['start', 'end'];
  const names: Labels = single ? { start: legend, end: labels.end } : labels;
  const bounds: DateBounds = { min, max, maxDays };
  const initial = (iso: IsoDate | null | undefined): string => (iso ? formatShort(iso) : '');
  const [text, setText] = useState<Labels>({ start: initial(defaultValue?.start), end: initial(defaultValue?.end) });
  const [touched, setTouched] = useState<ReadonlySet<FieldKey>>(new Set());
  const [applied, setApplied] = useState<DateRange>(defaultValue ?? { start: null, end: null });
  const [open, setOpen] = useState<FieldKey | null>(null);
  const triggers = useRef<Partial<Record<FieldKey, HTMLButtonElement | null>>>({});
  const { errors } = validateRange(text, names, bounds, single, required);

  const commit = (next: Labels, keysTouched: FieldKey[]): void => {
    // Rewrite what was understood in the stated format, so "3-4-26" visibly becomes 03/04/2026.
    const normalized = { ...next };
    for (const key of keys) {
      const iso = parseDate(next[key]);
      if (iso) normalized[key] = formatShort(iso);
    }
    setText(normalized);
    setTouched(new Set([...touched, ...keysTouched]));
    const check = validateRange(normalized, names, bounds, single, required);
    if (Object.keys(check.errors).length > 0) return;
    if (check.range.start !== applied.start || check.range.end !== applied.end) {
      setApplied(check.range);
      onChange(check.range);
    }
  };

  const close = (key: FieldKey, returnFocus: boolean): void => {
    setOpen(null);
    if (returnFocus) triggers.current[key]?.focus();
  };

  const status = !applied.start
    ? ''
    : single || !applied.end
      ? `${single ? 'Selected' : 'From'} ${formatLong(applied.start)}${single ? '.' : ' onward.'}`
      : `${formatLong(applied.start)} to ${formatLong(applied.end)}, ${daysBetween(applied.start, applied.end) + 1} days.`;
  const tzId = timeZoneNote ? `${id}-tz` : undefined;
  const Wrapper = single ? 'div' : 'fieldset';

  return (
    <Wrapper className={styles.root} aria-describedby={single ? undefined : tzId}>
      {!single && <legend className={styles.legend}>{legend}</legend>}
      {!single && presets.length > 0 && (
        <div role="group" aria-label="Quick ranges" className={styles.presets}>
          {presets.map((p) => {
            const r = p.range(today);
            return (
              <button key={p.label} type="button" className={styles.preset} aria-pressed={applied.start === r.start && applied.end === r.end}
                onClick={() => commit({ start: r.start, end: r.end }, ['start', 'end'])}>
                {p.label}
              </button>
            );
          })}
        </div>
      )}
      <div className={styles.fields}>
        {keys.map((key) => {
          const fieldId = `${id}-${key}`;
          const iso = parseDate(text[key]);
          const error = touched.has(key) ? errors[key] : undefined;
          const describedBy = [iso ? `${fieldId}-echo` : '', error ? `${fieldId}-error` : '', single ? tzId : ''].filter(Boolean).join(' ') || undefined;
          return (
            <div key={key} className={styles.field}>
              <label htmlFor={fieldId} className={styles.label}>
                {names[key]} <span className={styles.format}>(MM/DD/YYYY)</span>
              </label>
              <div className={styles.control}>
                <input id={fieldId} className={styles.input} autoComplete="off" spellCheck={false} value={text[key]}
                  aria-invalid={error ? true : undefined} aria-describedby={describedBy} aria-required={required || undefined}
                  onChange={(e) => setText({ ...text, [key]: e.target.value })} onBlur={() => commit(text, [key])} />
                <button type="button" ref={(el) => { triggers.current[key] = el; }} className={styles.trigger} aria-haspopup="dialog" aria-expanded={open === key}
                  aria-label={iso ? `Change ${lower(names[key])}, ${formatLong(iso)}` : `Choose ${lower(names[key])}`} onClick={() => setOpen(open === key ? null : key)}>
                  <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M6 2v3M14 2v3M3 8h14M4 4h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                </button>
                {open === key && (
                  <CalendarDialog label={`Choose ${lower(names[key])}`} selected={iso} today={today} bounds={bounds} range={applied}
                    onPick={(day) => { commit({ ...text, [key]: day }, [key]); close(key, true); }} onClose={(back) => close(key, back)} />
                )}
              </div>
              {iso && <p id={`${fieldId}-echo`} className={styles.echo}>{formatLong(iso)}</p>}
              {error && <p id={`${fieldId}-error`} className={styles.error}>{error}</p>}
            </div>
          );
        })}
      </div>
      {timeZoneNote && <p id={tzId} className={styles.hint}>{timeZoneNote}</p>}
      <p role="status" className={styles.status}>{status}</p>
    </Wrapper>
  );
}
