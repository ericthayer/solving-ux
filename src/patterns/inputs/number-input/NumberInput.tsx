import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styles from './NumberInput.module.css';

export type NumberFormat =
  | { style: 'currency'; currency: string }
  | { style: 'percent' }
  | { style: 'decimal'; unit?: string }
  | { style: 'integer'; unit?: string };

export type NumberInputProps = {
  label: string;
  /** Name of the hidden input that posts the canonical value ("1250.5"), never the formatted text. */
  name: string;
  format: NumberFormat;
  value: number | null;
  /** Called on every edit with the parsed number, or null when the text is empty or not a number. */
  onValueChange: (value: number | null) => void;
  locale?: string;
  min?: number;
  max?: number;
  /** Defaults to the currency's minor units (2 for USD, 0 for JPY), 2 for percent, 4 for decimal, 0 for integer. */
  maxFractionDigits?: number;
  required?: boolean;
  /** Replaces the generated range hint. */
  hint?: string;
  /** Defaults to "transaction-amount" for currency and "off" otherwise. */
  autoComplete?: string;
};

export type ParseResult =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'number'; value: number; decimals: number };

/** Decimal and grouping separators for a locale, read from Intl instead of hard-coded. */
function separators(locale: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
  };
}

/**
 * Tolerant parser for typed and pasted numbers. Accepts currency symbols and codes, "%",
 * spaces, accounting parentheses, Unicode minus, and either "1,250.50" or "1.250,50".
 */
export function parseNumber(text: string, locale = 'en-US'): ParseResult {
  let s = text.normalize('NFKC').trim();
  if (s === '') return { kind: 'empty' };
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s
    .replace(/^[A-Z]{3}|[A-Z]{3}$/i, '')
    .replace(/[\p{Sc}%\s'’]/gu, '')
    .replace(/[−‒–]/g, '-');
  if (/^-|-$/.test(s)) {
    negative = !negative;
    s = s.replace(/^-|-$/, '');
  }
  if (!/^[\d.,]*\d[\d.,]*$/.test(s)) return { kind: 'invalid' };

  // When both separators appear, the last one is the decimal. A separator used more than once groups.
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let decimal: string | null;
  if (lastDot >= 0 && lastComma >= 0) decimal = lastDot > lastComma ? '.' : ',';
  else if (lastDot < 0 && lastComma < 0) decimal = null;
  else {
    const only = lastDot >= 0 ? '.' : ',';
    decimal = s.split(only).length > 2 ? null : only === separators(locale).decimal ? only : null;
  }
  const pieces = decimal ? s.split(decimal) : [s];
  const [whole = '', fraction = ''] = pieces;
  if (pieces.length > 2 || /[.,]/.test(fraction)) return { kind: 'invalid' };
  // Grouping must look like grouping: "12,5" is a typo, not 125. Allows 1,250,000 and 12,50,000.
  const groups = whole.split(/[.,]/);
  if (groups.length > 1 && (groups.at(-1)?.length !== 3 || groups.slice(1, -1).some((g) => g.length < 2 || g.length > 3))) {
    return { kind: 'invalid' };
  }
  const digits = `${whole.replace(/[.,]/g, '')}.${fraction}`;
  const value = Number(digits) * (negative ? -1 : 1);
  return Number.isFinite(value) ? { kind: 'number', value: value === 0 ? 0 : value, decimals: fraction.length } : { kind: 'invalid' };
}

type Formatting = {
  /** Text shown in the field after blur: grouped, no symbol. */
  plain: (n: number) => string;
  /** Text used in hints and errors: "$1,000.00", "100%", "10,000 units". */
  spoken: (n: number) => string;
  maxDecimals: number;
  /** Visible adornment beside the field, hidden from assistive tech because the label carries it. */
  affix: { text: string; position: 'prefix' | 'suffix' } | null;
  /** Unit in the label, e.g. "USD" or "%". */
  unit: string | null;
};

export function createFormatting(format: NumberFormat, locale: string, maxFractionDigits?: number): Formatting {
  if (format.style === 'currency') {
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency: format.currency });
    const minor = money.resolvedOptions().maximumFractionDigits ?? 2;
    const parts = money.formatToParts(1);
    const symbolAt = parts.findIndex((p) => p.type === 'currency');
    const plain = new Intl.NumberFormat(locale, { minimumFractionDigits: minor, maximumFractionDigits: maxFractionDigits ?? minor });
    return {
      plain: (n) => plain.format(n),
      spoken: (n) => money.format(n),
      maxDecimals: maxFractionDigits ?? minor,
      affix: { text: parts[symbolAt]?.value ?? format.currency, position: symbolAt < parts.findIndex((p) => p.type === 'integer') ? 'prefix' : 'suffix' },
      unit: format.currency,
    };
  }
  const maxDecimals = maxFractionDigits ?? { percent: 2, decimal: 4, integer: 0 }[format.style];
  const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: maxDecimals });
  if (format.style === 'percent') {
    return { plain: (n) => plain.format(n), spoken: (n) => `${plain.format(n)}%`, maxDecimals, affix: { text: '%', position: 'suffix' }, unit: '%' };
  }
  const unit = format.unit ?? null;
  return { plain: (n) => plain.format(n), spoken: (n) => (unit ? `${plain.format(n)} ${unit}` : plain.format(n)), maxDecimals, affix: null, unit };
}

type Rules = Pick<NumberInputProps, 'label' | 'min' | 'max' | 'required'> & { integer: boolean };

export function validateNumber(result: ParseResult, rules: Rules, f: Formatting): string | null {
  if (result.kind === 'empty') return rules.required ? `Enter ${rules.label.charAt(0).toLowerCase()}${rules.label.slice(1)}.` : null;
  if (result.kind === 'invalid') return `Enter a number, like ${f.plain(rules.integer ? 1250 : 1250.5)}.`;
  if (rules.integer && result.decimals > 0) return 'Enter a whole number.';
  if (result.decimals > f.maxDecimals) return `Use no more than ${f.maxDecimals} decimal places.`;
  if (rules.min !== undefined && result.value < rules.min) return `Enter at least ${f.spoken(rules.min)}.`;
  if (rules.max !== undefined && result.value > rules.max) return `Enter no more than ${f.spoken(rules.max)}.`;
  return null;
}

export function NumberInput({
  label,
  name,
  format,
  value,
  onValueChange,
  locale = 'en-US',
  min,
  max,
  maxFractionDigits,
  required = false,
  hint,
  autoComplete,
}: NumberInputProps): JSX.Element {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const focused = useRef(false);
  const f = useMemo(() => createFormatting(format, locale, maxFractionDigits), [format, locale, maxFractionDigits]);
  const integer = format.style === 'integer';
  const [text, setText] = useState(() => (value === null ? '' : f.plain(value)));
  const [touched, setTouched] = useState(false);

  const result = useMemo(() => parseNumber(text, locale), [text, locale]);
  const error = validateNumber(result, { label, min, max, required, integer }, f);
  const shownError = touched ? error : null;

  // A value set from outside (reset, prefill) replaces the text, but never while the user is typing.
  // Only `value` is a dependency: re-running on every keystroke would undo the edit.
  useEffect(() => {
    if (focused.current) return;
    const current = parseNumber(text, locale);
    const same = current.kind === 'number' ? current.value === value : value === null && current.kind === 'empty';
    if (!same) setText(value === null ? '' : f.plain(value));
  }, [value]);

  // Native validity lets a parent form call checkValidity() and find the first invalid field.
  useEffect(() => {
    inputRef.current?.setCustomValidity(error ?? '');
  }, [error]);

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    // Keep exactly what was typed: no reformatting mid-edit, so the caret never jumps.
    const next = event.target.value;
    setText(next);
    const parsed = parseNumber(next, locale);
    onValueChange(parsed.kind === 'number' ? parsed.value : null);
  };

  const onBlur = (): void => {
    focused.current = false;
    setTouched(true);
    // Format only a valid value. Invalid text stays as typed so the user can fix it.
    if (result.kind === 'number' && !error) setText(f.plain(result.value));
  };

  const onInvalid = (event: FormEvent<HTMLInputElement>): void => {
    event.preventDefault(); // Suppress the browser bubble; the inline error says the same thing better.
    setTouched(true);
  };

  const generatedHint =
    min !== undefined && max !== undefined
      ? `From ${f.affix ? f.spoken(min) : f.plain(min)} to ${f.spoken(max)}.`
      : min !== undefined
        ? `${f.spoken(min)} or more.`
        : max !== undefined
          ? `Up to ${f.spoken(max)}.`
          : null;
  const hintText = hint ?? (integer && generatedHint ? `Whole numbers. ${generatedHint}` : generatedHint);
  const describedBy = [hintText ? `${id}-hint` : '', shownError ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  // iOS numeric and decimal keypads have no minus key, so only use them when negatives are impossible.
  const inputMode = min !== undefined && min >= 0 ? (integer ? 'numeric' : 'decimal') : 'text';

  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {f.unit && <span className={styles.unit}> ({f.unit})</span>}
      </label>
      {hintText && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hintText}
        </p>
      )}
      {shownError && (
        <p id={`${id}-error`} className={styles.error}>
          {shownError}
        </p>
      )}
      <div className={styles.control} data-invalid={shownError ? '' : undefined}>
        {f.affix?.position === 'prefix' && (
          <span className={styles.affix} aria-hidden="true">
            {f.affix.text}
          </span>
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete={autoComplete ?? (format.style === 'currency' ? 'transaction-amount' : 'off')}
          spellCheck={false}
          className={styles.input}
          value={text}
          required={required}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy}
          onChange={onChange}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={onBlur}
          onInvalid={onInvalid}
        />
        {f.affix?.position === 'suffix' && (
          <span className={styles.affix} aria-hidden="true">
            {f.affix.text}
          </span>
        )}
      </div>
      <input type="hidden" name={name} value={result.kind === 'number' && !error ? String(result.value) : ''} />
    </div>
  );
}
