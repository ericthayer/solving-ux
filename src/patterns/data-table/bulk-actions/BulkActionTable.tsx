import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './BulkActionTable.module.css';

export type SortDirection = 'ascending' | 'descending';

export type Column<T> = {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'end';
  render?: (row: T) => ReactNode;
};

export type BulkAction = {
  id: string;
  label: string;
  tone?: 'default' | 'danger';
  onSelect: (ids: string[]) => void;
};

export type BulkActionTableProps<T extends { id: string }> = {
  caption: string;
  rows: T[];
  columns: Column<T>[];
  bulkActions: BulkAction[];
  /** Used for each row checkbox's accessible name, e.g. "Select Order 1042". */
  rowLabel: (row: T) => string;
  pageSize?: number;
};

type SortState<T> = { key: keyof T & string; direction: SortDirection } | null;

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}

export function BulkActionTable<T extends { id: string }>({
  caption,
  rows,
  columns,
  bulkActions,
  rowLabel,
  pageSize = 10,
}: BulkActionTableProps<T>): JSX.Element {
  const captionId = useId();
  const [sort, setSort] = useState<SortState<T>>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState('');
  const selectAllRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo((): T[] => {
    if (!sort) return rows;
    const factor = sort.direction === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => compareValues(a[sort.key], b[sort.key]) * factor);
  }, [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const pageIds = pageRows.map((row) => row.id);
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPage = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someOnPage = selectedOnPage > 0 && !allOnPage;

  // Drop selections for rows that no longer exist (deleted, filtered out upstream).
  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(rows.map((row) => row.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someOnPage;
  }, [someOnPage]);

  const toggleSort = (column: Column<T>): void => {
    const direction: SortDirection =
      sort?.key === column.key && sort.direction === 'ascending' ? 'descending' : 'ascending';
    setSort({ key: column.key, direction });
    setPage(0);
    setAnnouncement(`Sorted by ${column.header}, ${direction}.`);
  };

  const updateSelection = (next: Set<string>): void => {
    setSelected(next);
    setAnnouncement(`${next.size} of ${rows.length} rows selected.`);
  };

  const toggleRow = (id: string): void => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateSelection(next);
  };

  const togglePage = (): void => {
    const next = new Set(selected);
    pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id)));
    updateSelection(next);
  };

  const runAction = (action: BulkAction): void => {
    const ids = [...selected];
    action.onSelect(ids);
    setSelected(new Set());
    setAnnouncement(`${action.label} applied to ${ids.length} ${ids.length === 1 ? 'row' : 'rows'}.`);
  };

  const goToPage = (next: number): void => {
    setPage(next);
    setAnnouncement(`Page ${next + 1} of ${pageCount}.`);
  };

  const first = sorted.length === 0 ? 0 : currentPage * pageSize + 1;
  const last = Math.min((currentPage + 1) * pageSize, sorted.length);

  return (
    <div className={styles.root}>
      <div className={styles.selectionBar} data-active={selected.size > 0 || undefined}>
        {selected.size === 0 ? (
          <p className={styles.hint}>Select rows to apply bulk actions.</p>
        ) : (
          <>
            <p className={styles.count}>
              <strong>{selected.size}</strong> selected
            </p>
            {allOnPage && selected.size < rows.length && (
              <button type="button" className={styles.linkButton} onClick={() => updateSelection(new Set(rows.map((r) => r.id)))}>
                Select all {rows.length} rows
              </button>
            )}
            <div className={styles.actions}>
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={action.tone === 'danger' ? styles.dangerButton : styles.button}
                  onClick={() => runAction(action)}
                >
                  {action.label}
                </button>
              ))}
              <button type="button" className={styles.linkButton} onClick={() => updateSelection(new Set())}>
                Clear selection
              </button>
            </div>
          </>
        )}
      </div>

      <div className={styles.scroller} role="region" aria-labelledby={captionId} tabIndex={0}>
        <table className={styles.table}>
          <caption id={captionId} className={styles.caption}>
            {caption}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.checkCell}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allOnPage}
                  disabled={pageIds.length === 0}
                  onChange={togglePage}
                  aria-label="Select all rows on this page"
                />
              </th>
              {columns.map((column, index) => {
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={index === 0 ? styles.frozen : undefined}
                    data-align={column.align ?? 'start'}
                    aria-sort={column.sortable ? (active ? sort.direction : 'none') : undefined}
                  >
                    {column.sortable ? (
                      <button type="button" className={styles.sortButton} onClick={() => toggleSort(column)}>
                        {column.header}
                        <span aria-hidden="true" className={styles.sortIcon} data-direction={active ? sort.direction : 'none'} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className={styles.emptyCell}>
                  No rows to display.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} data-selected={selected.has(row.id) || undefined}>
                  <td className={styles.checkCell}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${rowLabel(row)}`}
                    />
                  </td>
                  {columns.map((column, index) => {
                    const content = column.render ? column.render(row) : String(row[column.key] ?? '');
                    return index === 0 ? (
                      <th key={column.key} scope="row" className={styles.frozen}>
                        {content}
                      </th>
                    ) : (
                      <td key={column.key} data-align={column.align ?? 'start'}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <nav className={styles.pagination} aria-label={`${caption} pagination`}>
        <p className={styles.range}>
          {first}–{last} of {sorted.length}
        </p>
        <button type="button" className={styles.button} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>
          Previous
        </button>
        <p className={styles.range}>
          Page {currentPage + 1} of {pageCount}
        </p>
        <button
          type="button"
          className={styles.button}
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= pageCount - 1}
        >
          Next
        </button>
      </nav>

      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
    </div>
  );
}
