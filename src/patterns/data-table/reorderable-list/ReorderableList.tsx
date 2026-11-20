import { useEffect, useId, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import styles from './ReorderableList.module.css';

/** Which control moved the item. Focus returns to the same control after the move. */
export type ReorderControl = 'up' | 'down' | 'position';

export type ReorderableListProps<T extends { id: string }> = {
  /** Visible heading. Also names the list and its region. */
  label: string;
  items: T[];
  /** Receives the full list in its new order. The list is controlled: pass the result back as items. */
  onReorder: (items: T[]) => void;
  /** Plain-text name of an item, used in control names and announcements, e.g. "Quarterly review". */
  itemLabel: (item: T) => string;
  /** Visible content of each item. Defaults to itemLabel. */
  renderItem?: (item: T) => ReactNode;
};

type PendingFocus = { id: string; control: ReorderControl };

/** Returns a copy of items with the item at `from` moved to `to`. `to` is clamped; a bad `from` is a no-op. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length) return next;
  const target = Math.min(Math.max(to, 0), next.length - 1);
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(target, 0, moved);
  return next;
}

export function ReorderableList<T extends { id: string }>({
  label,
  items,
  onReorder,
  itemLabel,
  renderItem,
}: ReorderableListProps<T>): JSX.Element {
  const labelId = useId();
  const hintId = useId();
  const [announcement, setAnnouncement] = useState('');
  const [movedId, setMovedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const pendingFocus = useRef<PendingFocus | null>(null);
  const controls = useRef(new Map<string, HTMLElement>());

  // React reorders by moving DOM nodes, and moving a focused node drops focus to <body>.
  // Put focus back on the control the user pressed, in the item's new position.
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    controls.current.get(`${pending.id}:${pending.control}`)?.focus();
  }, [items]);

  const register =
    (key: string) =>
    (el: HTMLElement | null): void => {
      if (el) controls.current.set(key, el);
      else controls.current.delete(key);
    };

  // A live region ignores a repeat of the same text, so a second "already first" would be silent.
  const announce = (message: string): void => setAnnouncement((prev) => (prev === message ? `${message} ` : message));

  const move = (from: number, to: number, control: ReorderControl | null): void => {
    const item = items[from];
    if (!item) return;
    const name = itemLabel(item);
    if (to < 0) return announce(`${name} is already first.`);
    if (to >= items.length) return announce(`${name} is already last.`);
    if (to === from) return;
    if (control) pendingFocus.current = { id: item.id, control };
    setMovedId(item.id);
    onReorder(moveItem(items, from, to));
    announce(`Moved ${name} to position ${to + 1} of ${items.length}.`);
  };

  const onDragStart = (event: DragEvent<HTMLLIElement>, id: string): void => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    setDragId(id);
  };

  const onDrop = (event: DragEvent<HTMLLIElement>, index: number): void => {
    event.preventDefault();
    const from = items.findIndex((item) => item.id === dragId);
    setDragId(null);
    if (from >= 0) move(from, index, null);
  };

  return (
    <section className={styles.root} aria-labelledby={labelId}>
      <h3 id={labelId} className={styles.label}>
        {label}
      </h3>
      <p id={hintId} className={styles.hint}>
        Use the arrow buttons or pick a position. With a mouse, you can also drag an item by its grip.
      </p>
      {items.length === 0 ? (
        <p className={styles.empty}>No items to order.</p>
      ) : (
        <ol className={styles.list} aria-labelledby={labelId} aria-describedby={hintId}>
          {items.map((item, index) => {
            const name = itemLabel(item);
            const first = index === 0;
            const last = index === items.length - 1;
            return (
              <li
                key={item.id}
                className={styles.item}
                draggable
                data-dragging={dragId === item.id || undefined}
                data-moved={movedId === item.id || undefined}
                onDragStart={(event) => onDragStart(event, item.id)}
                onDragOver={(event) => dragId && event.preventDefault()}
                onDrop={(event) => onDrop(event, index)}
                onDragEnd={() => setDragId(null)}
                onAnimationEnd={() => setMovedId(null)}
              >
                <span className={styles.grip} aria-hidden="true" />
                <span className={styles.position} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={styles.content}>{renderItem ? renderItem(item) : name}</div>
                <div className={styles.controls} role="group" aria-label={`Reorder ${name}`}>
                  <button
                    ref={register(`${item.id}:up`)}
                    type="button"
                    className={styles.button}
                    aria-label={`Move ${name} up`}
                    aria-disabled={first || undefined}
                    onClick={() => move(index, index - 1, 'up')}
                  >
                    <span className={styles.arrowUp} aria-hidden="true" />
                  </button>
                  <button
                    ref={register(`${item.id}:down`)}
                    type="button"
                    className={styles.button}
                    aria-label={`Move ${name} down`}
                    aria-disabled={last || undefined}
                    onClick={() => move(index, index + 1, 'down')}
                  >
                    <span className={styles.arrowDown} aria-hidden="true" />
                  </button>
                  <label className={styles.visuallyHidden} htmlFor={`${labelId}-${item.id}`}>
                    Position of {name}
                  </label>
                  <select
                    ref={register(`${item.id}:position`)}
                    id={`${labelId}-${item.id}`}
                    className={styles.select}
                    value={index + 1}
                    onChange={(event) => move(index, Number(event.target.value) - 1, 'position')}
                  >
                    {items.map((option, i) => (
                      <option key={option.id} value={i + 1}>
                        {i + 1} of {items.length}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
    </section>
  );
}
