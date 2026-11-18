import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import styles from './Typeahead.module.css';

export type TypeaheadOption = { id: string; label: string; description?: string };

export type TypeaheadProps = {
  label: string;
  options: TypeaheadOption[];
  onSelect: (option: TypeaheadOption) => void;
  hint?: string;
  /** Cap rendered results. Large DOM lists are slow and unhelpful; ask users to narrow instead. */
  maxResults?: number;
  /** Characters required before results show. */
  minChars?: number;
};

/** Prefix matches rank above substring matches; within each, original order is kept. */
export function rankOptions(options: TypeaheadOption[], query: string): TypeaheadOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const prefix: TypeaheadOption[] = [];
  const contains: TypeaheadOption[] = [];
  for (const option of options) {
    const label = option.label.toLowerCase();
    if (label.startsWith(q)) prefix.push(option);
    else if (label.includes(q) || option.description?.toLowerCase().includes(q)) contains.push(option);
  }
  return [...prefix, ...contains];
}

function highlight(text: string, query: string): ReactNode {
  const index = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (index === -1 || !query.trim()) return text;
  const end = index + query.trim().length;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export function Typeahead({ label, options, onSelect, hint, maxResults = 8, minChars = 1 }: TypeaheadProps): JSX.Element {
  const id = useId();
  const listId = `${id}-listbox`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);

  const matches = useMemo(() => rankOptions(options, deferredQuery), [options, deferredQuery]);
  const results = matches.slice(0, maxResults);
  const enoughChars = deferredQuery.trim().length >= minChars;
  const expanded = open && enoughChars && results.length > 0;

  useEffect(() => setActive(-1), [deferredQuery]);

  const status = !enoughChars
    ? ''
    : matches.length === 0
      ? `No matches for "${deferredQuery.trim()}".`
      : matches.length > results.length
        ? `Showing ${results.length} of ${matches.length.toLocaleString()} matches. Keep typing to narrow.`
        : `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}.`;

  const select = (option: TypeaheadOption): void => {
    onSelect(option);
    setQuery(option.label);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) setOpen(true);
        if (results.length) setActive((i) => (i + 1) % results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (results.length) setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
        break;
      case 'Enter': {
        const option = results[active];
        if (expanded && option) {
          event.preventDefault();
          select(option);
        }
        break;
      }
      case 'Escape':
        if (expanded) setOpen(false);
        else setQuery('');
        setActive(-1);
        break;
      default:
        break;
    }
  };

  const activeOption = expanded ? results[active] : undefined;

  return (
    <div className={styles.root}>
      <label htmlFor={`${id}-input`} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      <div className={styles.field}>
        <input
          ref={inputRef}
          id={`${id}-input`}
          className={styles.input}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={activeOption ? `${id}-option-${activeOption.id}` : undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          onFocus={() => setOpen(true)}
        />
        <div className={styles.popup} data-open={expanded || undefined}>
        <ul id={listId} role="listbox" aria-label={label} className={styles.listbox} hidden={!expanded}>
          {expanded &&
            results.map((option, index) => (
              <li
                key={option.id}
                id={`${id}-option-${option.id}`}
                role="option"
                aria-selected={index === active}
                className={styles.option}
                // mousedown fires before input blur, so the click is not lost when the list closes.
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(option);
                }}
                onMouseMove={() => setActive(index)}
              >
                <span className={styles.optionLabel}>{highlight(option.label, deferredQuery)}</span>
                {option.description && <span className={styles.optionDescription}>{option.description}</span>}
              </li>
            ))}
        </ul>
          {/* Lives in the popup so the count stays visible under the results; always rendered so announcements are reliable. */}
          <p role="status" className={styles.status}>
            {open ? status : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
