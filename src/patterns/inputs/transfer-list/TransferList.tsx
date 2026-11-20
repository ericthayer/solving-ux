import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import styles from './TransferList.module.css';

export type TransferItem = { id: string; label: string; description?: string };
export type TransferNoun = { one: string; other: string };
export type TransferLayout = 'auto' | 'dual' | 'checklist';

export type TransferListProps = {
  /** Names the whole control, e.g. "Reviewer role members". */
  label: string;
  items: TransferItem[];
  /** Assigned item ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  hint?: string;
  availableLabel?: string;
  assignedLabel?: string;
  /** Used in counts and announcements: "3 people added". */
  noun?: TransferNoun;
  /** Rows rendered per list. Larger result sets ask users to filter. */
  maxRendered?: number;
  /** "auto" switches to one checklist when the control is narrower than collapseBelow. */
  layout?: TransferLayout;
  collapseBelow?: number;
};

/** "1 person", "1,204 people". */
export function countLabel(count: number, noun: TransferNoun): string {
  return `${count.toLocaleString()} ${count === 1 ? noun.one : noun.other}`;
}

/** Case-insensitive match on label or description. A blank query matches everything. */
export function matchItems(items: TransferItem[], query: string): TransferItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q));
}

/** Tracks whether the element is narrower than `threshold` px. Off when disabled or unsupported. */
function useNarrow(ref: RefObject<HTMLElement>, threshold: number, enabled: boolean): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setNarrow(entry.contentRect.width < threshold);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, enabled]);
  return narrow;
}

type PaneProps = {
  title: string;
  total: string;
  items: TransferItem[];
  checked: ReadonlySet<string>;
  onCheck: (ids: string[], on: boolean) => void;
  query: string;
  onQuery: (query: string) => void;
  emptyText: string;
  maxRendered: number;
  noun: TransferNoun;
};

function Pane({ title, total, items, checked, onCheck, query, onQuery, emptyText, maxRendered, noun }: PaneProps): JSX.Element {
  const id = useId();
  const deferredQuery = useDeferredValue(query);
  const matches = useMemo(() => matchItems(items, deferredQuery), [items, deferredQuery]);
  const shown = matches.slice(0, maxRendered);
  const checkedCount = matches.filter((item) => checked.has(item.id)).length;
  const all = matches.length > 0 && checkedCount === matches.length;
  const filtered = deferredQuery.trim() !== '';

  return (
    <fieldset className={styles.pane}>
      <legend className={styles.legend}>
        {title} <span className={styles.legendCount}>({total})</span>
      </legend>
      <label htmlFor={`${id}-filter`} className={styles.filterLabel}>
        Filter {title.toLowerCase()}
      </label>
      <input
        id={`${id}-filter`}
        className={styles.input}
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(event) => onQuery(event.target.value)}
      />
      <label className={styles.selectAll}>
        <input
          type="checkbox"
          checked={all}
          // Indeterminate is a DOM property, not an attribute.
          ref={(el) => {
            if (el) el.indeterminate = checkedCount > 0 && !all;
          }}
          disabled={matches.length === 0}
          onChange={() => onCheck(matches.map((item) => item.id), !all)}
        />
        Select all {countLabel(matches.length, noun)}
        {filtered ? ' matching' : ''}
      </label>
      {matches.length === 0 ? (
        <p className={styles.empty}>{filtered ? `No matches for "${deferredQuery.trim()}".` : emptyText}</p>
      ) : (
        <ul className={styles.list}>
          {shown.map((item) => (
            <li key={item.id}>
              <label className={styles.option}>
                <input type="checkbox" checked={checked.has(item.id)} onChange={(event) => onCheck([item.id], event.target.checked)} />
                <span className={styles.optionText}>
                  <span>{item.label}</span>
                  {item.description && <span className={styles.optionDescription}>{item.description}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {matches.length > shown.length && (
        <p className={styles.more}>
          Showing {shown.length.toLocaleString()} of {matches.length.toLocaleString()}. Filter to narrow.
        </p>
      )}
    </fieldset>
  );
}

const toggle = (set: ReadonlySet<string>, ids: string[], on: boolean): Set<string> => {
  const next = new Set(set);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return next;
};

export function TransferList({
  label,
  items,
  value,
  onChange,
  hint,
  availableLabel = 'Available',
  assignedLabel = 'Assigned',
  noun = { one: 'item', other: 'items' },
  maxRendered = 200,
  layout = 'auto',
  collapseBelow = 560,
}: TransferListProps): JSX.Element {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const narrow = useNarrow(rootRef, collapseBelow, layout === 'auto');
  const mode = layout === 'auto' ? (narrow ? 'checklist' : 'dual') : layout;

  const assignedIds = useMemo(() => new Set(value), [value]);
  const available = useMemo(() => items.filter((item) => !assignedIds.has(item.id)), [items, assignedIds]);
  const assigned = useMemo(() => items.filter((item) => assignedIds.has(item.id)), [items, assignedIds]);

  const [staged, setStaged] = useState<{ add: Set<string>; remove: Set<string> }>(() => ({ add: new Set(), remove: new Set() }));
  const [queries, setQueries] = useState({ add: '', remove: '', all: '' });
  const [message, setMessage] = useState('');

  // Only items still in their source list and matching its filter can move: what you see is what moves.
  const addable = matchItems(available, queries.add).filter((item) => staged.add.has(item.id));
  const removable = matchItems(assigned, queries.remove).filter((item) => staged.remove.has(item.id));

  const announce = (verb: 'Added' | 'Removed', moved: TransferItem[], nextCount: number): void => {
    const what = moved.length === 1 ? (moved[0]?.label ?? '') : countLabel(moved.length, noun);
    setMessage(`${verb} ${what}. ${countLabel(nextCount, noun)} assigned.`);
  };

  const move = (direction: 'add' | 'remove'): void => {
    const moving = direction === 'add' ? addable : removable;
    if (moving.length === 0) return;
    const ids = new Set(moving.map((item) => item.id));
    const next = direction === 'add' ? [...value, ...ids] : value.filter((v) => !ids.has(v));
    onChange(next);
    setStaged((prev) => ({ ...prev, [direction]: toggle(prev[direction], [...ids], false) }));
    announce(direction === 'add' ? 'Added' : 'Removed', moving, next.length);
  };

  // Checklist mode: checking assigns immediately, so there is nothing to stage.
  const assignNow = (ids: string[], on: boolean): void => {
    const requested = new Set(ids);
    const changing = items.filter((item) => requested.has(item.id) && assignedIds.has(item.id) !== on);
    if (changing.length === 0) return;
    const changed = new Set(changing.map((item) => item.id));
    const next = on ? [...value, ...changed] : value.filter((v) => !changed.has(v));
    onChange(next);
    announce(on ? 'Added' : 'Removed', changing, next.length);
  };

  const moveButton = (direction: 'add' | 'remove', count: number): JSX.Element => (
    <button
      type="button"
      className={styles.button}
      // aria-disabled keeps focus on the button after a move empties the selection.
      aria-disabled={count === 0}
      onClick={() => move(direction)}
    >
      {direction === 'add' ? 'Add' : 'Remove'} selected ({count.toLocaleString()})
      <span aria-hidden="true" className={styles.arrow}>
        {direction === 'add' ? '→' : '←'}
      </span>
    </button>
  );

  return (
    <div ref={rootRef} className={styles.root} role="group" aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined}>
      <p id={`${id}-label`} className={styles.title}>
        {label}
      </p>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {mode === 'dual' ? (
        <div className={styles.dual} data-layout="dual">
          <Pane
            title={availableLabel}
            total={countLabel(available.length, noun)}
            items={available}
            checked={staged.add}
            onCheck={(ids, on) => setStaged((prev) => ({ ...prev, add: toggle(prev.add, ids, on) }))}
            query={queries.add}
            onQuery={(q) => setQueries((prev) => ({ ...prev, add: q }))}
            emptyText={`Every ${noun.one} is assigned.`}
            maxRendered={maxRendered}
            noun={noun}
          />
          <div className={styles.actions}>
            {moveButton('add', addable.length)}
            {moveButton('remove', removable.length)}
          </div>
          <Pane
            title={assignedLabel}
            total={countLabel(assigned.length, noun)}
            items={assigned}
            checked={staged.remove}
            onCheck={(ids, on) => setStaged((prev) => ({ ...prev, remove: toggle(prev.remove, ids, on) }))}
            query={queries.remove}
            onQuery={(q) => setQueries((prev) => ({ ...prev, remove: q }))}
            emptyText={`No ${noun.other} assigned yet.`}
            maxRendered={maxRendered}
            noun={noun}
          />
        </div>
      ) : (
        <div data-layout="checklist">
          <Pane
            title={noun.other.charAt(0).toUpperCase() + noun.other.slice(1)}
            total={`${assigned.length.toLocaleString()} of ${items.length.toLocaleString()} ${assignedLabel.toLowerCase()}`}
            items={items}
            checked={assignedIds}
            onCheck={assignNow}
            query={queries.all}
            onQuery={(q) => setQueries((prev) => ({ ...prev, all: q }))}
            emptyText={`No ${noun.other} to assign.`}
            maxRendered={maxRendered}
            noun={noun}
          />
        </div>
      )}
      <p role="status" className={styles.status}>
        {message}
      </p>
    </div>
  );
}
