import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './PagedList.module.css';

/**
 * pages: tasks where people compare, cite, or return to a position (queues, records, search results).
 * load-more: browsing where reading order matters more than position (catalogs, activity).
 * infinite: almost never. Only for feeds with no footer; auto-loading pauses after maxAutoLoads.
 */
export type PagedListMode = 'pages' | 'load-more' | 'infinite';

export type PagedListProps<T extends { id: string }> = {
  /** Visible label. Names the list, the page navigation, and the load button's context. */
  label: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  mode: PagedListMode;
  pageSize?: number;
  /** Infinite mode only: automatic loads before falling back to the Load more button. */
  maxAutoLoads?: number;
  /** sessionStorage key. When set, page, loaded count, and the last opened item survive back navigation. */
  restoreKey?: string;
  /** Plural noun used in counts, e.g. "requests". */
  noun?: string;
};

type Saved = { page: number; count: number; anchorId: string | null };
type PendingFocus = { kind: 'list' } | { kind: 'item'; index: number } | { kind: 'anchor'; id: string } | null;

function readSaved(key: string | undefined): Saved | null {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && 'page' in parsed && 'count' in parsed) return parsed as Saved;
  } catch {
    // Storage blocked or corrupt: start fresh rather than fail.
  }
  return null;
}

/** Page numbers to show, with 'gap' where a run is collapsed: 1 … 4 5 6 … 20. */
export function pageWindow(current: number, total: number): Array<number | 'gap'> {
  const keep = new Set([0, total - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < total));
  const out: Array<number | 'gap'> = [];
  [...keep].sort((a, b) => a - b).forEach((p, i, all) => {
    const prev = all[i - 1];
    if (prev !== undefined && p - prev > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export function PagedList<T extends { id: string }>({
  label,
  items,
  renderItem,
  mode,
  pageSize = 10,
  maxAutoLoads = 2,
  restoreKey,
  noun = 'results',
}: PagedListProps<T>): JSX.Element {
  const labelId = useId();
  const [saved] = useState(() => readSaved(restoreKey));
  const [page, setPage] = useState(saved?.page ?? 0);
  const [count, setCount] = useState(saved?.count ?? pageSize);
  const [autoLoads, setAutoLoads] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const anchorRef = useRef<string | null>(saved?.anchorId ?? null);
  const pendingFocus = useRef<PendingFocus>(saved?.anchorId ? { kind: 'anchor', id: saved.anchorId } : null);
  const listRef = useRef<HTMLOListElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = mode === 'pages' ? currentPage * pageSize : 0;
  const end = mode === 'pages' ? Math.min(start + pageSize, total) : Math.min(count, total);
  const visible = items.slice(start, end);
  const remaining = total - end;
  const shown = mode === 'pages' ? `Showing ${start + 1} to ${end} of ${total} ${noun}` : `Showing ${end} of ${total} ${noun}`;

  // Remember where the user is, so Back returns them to the same place.
  const persist = (anchorId: string | null): void => {
    anchorRef.current = anchorId;
    if (!restoreKey) return;
    try {
      sessionStorage.setItem(restoreKey, JSON.stringify({ page: currentPage, count: end, anchorId }));
    } catch {
      // Private mode or quota: restoring is a convenience, not a requirement.
    }
  };
  useEffect(() => persist(anchorRef.current), [restoreKey, currentPage, end]);

  // Focus moves after the DOM has the new items, never before.
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target.kind === 'list') listRef.current?.focus();
    else if (target.kind === 'item') listRef.current?.querySelectorAll<HTMLElement>(':scope > li')[target.index]?.focus();
    else {
      const el = [...(listRef.current?.querySelectorAll<HTMLElement>(':scope > li') ?? [])].find((li) => li.dataset.itemId === target.id);
      if (!el) return;
      el.focus();
      setAnnouncement(`Returned to your place. ${shown}.`);
      persist(null); // One restore per visit; a fresh mount later starts at the top of the saved page.
    }
  });

  const goToPage = (next: number): void => {
    setPage(next);
    pendingFocus.current = { kind: 'list' };
    const first = next * pageSize + 1;
    setAnnouncement(`Page ${next + 1} of ${pageCount}. ${noun[0]?.toUpperCase()}${noun.slice(1)} ${first} to ${Math.min(first + pageSize - 1, total)} of ${total}.`);
  };

  const loadMore = (auto: boolean): void => {
    const added = Math.min(pageSize, remaining);
    if (added <= 0) return;
    setCount(end + added);
    if (auto) setAutoLoads((n) => n + 1);
    // Only a deliberate click moves focus; auto-loading must not yank the reader.
    else pendingFocus.current = { kind: 'item', index: end };
    setAnnouncement(`Loaded ${added} more. Showing ${end + added} of ${total} ${noun}.`);
  };

  const autoActive = mode === 'infinite' && autoLoads < maxAutoLoads && remaining > 0;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!autoActive || !sentinel || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore(true);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
    // Re-subscribing whenever `end` changes keeps loadMore's closure current.
  }, [autoActive, end]);

  const rememberAnchor = (target: EventTarget): void => {
    const id = (target as HTMLElement).closest<HTMLElement>('[data-item-id]')?.dataset.itemId;
    if (id) persist(id);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p id={labelId} className={styles.label}>
          {label}
        </p>
        <p className={styles.summary}>
          {total === 0 ? `No ${noun}` : mode === 'pages' ? `${start + 1}–${end} of ${total}` : `Showing ${end} of ${total}`}
        </p>
      </div>

      {total === 0 ? (
        <p className={styles.empty}>No {noun} to show.</p>
      ) : (
        <ol ref={listRef} className={styles.list} aria-labelledby={labelId} tabIndex={-1} onClickCapture={(e) => rememberAnchor(e.target)}>
          {visible.map((item, i) => (
            <li key={item.id} className={styles.item} data-item-id={item.id} tabIndex={-1} aria-setsize={total} aria-posinset={start + i + 1}>
              {renderItem(item)}
            </li>
          ))}
        </ol>
      )}

      {mode === 'pages' && pageCount > 1 && (
        <nav className={styles.pager} aria-label={`${label} pages`}>
          <button type="button" className={styles.button} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>
            Previous
          </button>
          <ol className={styles.pages}>
            {pageWindow(currentPage, pageCount).map((p, i) =>
              p === 'gap' ? (
                <li key={`gap-${i}`} className={styles.gap} aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={p}>
                  <button
                    type="button"
                    className={styles.pageButton}
                    aria-current={p === currentPage ? 'page' : undefined}
                    aria-label={`Page ${p + 1}`}
                    onClick={() => goToPage(p)}
                  >
                    {p + 1}
                  </button>
                </li>
              ),
            )}
          </ol>
          <button type="button" className={styles.button} onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pageCount - 1}>
            Next
          </button>
        </nav>
      )}

      {mode !== 'pages' && total > 0 && (
        <div className={styles.loader}>
          <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
          {remaining > 0 ? (
            <>
              <button type="button" className={styles.button} onClick={() => loadMore(false)}>
                Load {Math.min(pageSize, remaining)} more
              </button>
              {mode === 'infinite' && !autoActive && (
                <p className={styles.hint}>Automatic loading paused so the footer stays reachable.</p>
              )}
            </>
          ) : (
            <p className={styles.hint}>
              All {total} {noun} shown.
            </p>
          )}
        </div>
      )}

      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
    </div>
  );
}
