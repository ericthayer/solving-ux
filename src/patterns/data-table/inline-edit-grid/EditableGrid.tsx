import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent, ReactNode } from 'react';
import { isTypeToEdit, nextPosition, validateCell } from './gridModel';
import type { CellEditor, GridPosition } from './gridModel';
import styles from './EditableGrid.module.css';

export type { CellEditor } from './gridModel';

export type GridColumn<T> = {
  key: keyof T & string;
  header: string;
  /** Omit to make the column read-only. The first column is always the read-only row header. */
  editor?: CellEditor;
  align?: 'start' | 'end';
  format?: (row: T) => string;
  /** Extra rule on top of the editor's built-in checks. Return an error sentence, or null when valid. */
  validate?: (value: string, row: T) => string | null;
};

export type EditableGridProps<T extends { id: string }> = {
  caption: string;
  rows: T[];
  columns: GridColumn<T>[];
  /** Names the row in editor labels and announcements, e.g. "PO-4100, Northwind Supply". */
  rowLabel: (row: T) => string;
  /** Persists one cell. Reject with an Error whose message the user should see. */
  onCommit: (rowId: string, key: keyof T & string, value: string) => Promise<void>;
};

type Editing = { rowId: string; key: string; draft: string; error: string | null };
type CellStatus = { status: 'saving' | 'saved' | 'failed'; value: string; message?: string };

const cellKey = (rowId: string, key: string): string => `${rowId}:${key}`;

export function EditableGrid<T extends { id: string }>({ caption, rows, columns, rowLabel, onCommit }: EditableGridProps<T>): JSX.Element {
  const baseId = useId();
  const captionId = `${baseId}-caption`;
  const helpId = `${baseId}-help`;
  const errorId = `${baseId}-error`;
  const tableRef = useRef<HTMLTableElement>(null);
  const [active, setActive] = useState<GridPosition>({ row: 0, col: 0 });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [cells, setCells] = useState<Record<string, CellStatus>>({});
  const [announcement, setAnnouncement] = useState('');
  const focusTarget = useRef<'cell' | 'input' | null>(null);
  const selectDraft = useRef(false);
  const skipBlur = useRef(false);

  // Keep the roving tab stop inside the grid when rows are removed.
  const position: GridPosition = {
    row: Math.min(active.row, Math.max(rows.length - 1, 0)),
    col: Math.min(active.col, columns.length - 1),
  };

  // Focus moves after React commits, so the element being focused always exists.
  useEffect(() => {
    const target = focusTarget.current;
    focusTarget.current = null;
    if (!target || !tableRef.current) return;
    const selector = target === 'input' ? '[data-editor]' : `[data-pos="${position.row}:${position.col}"]`;
    const el = tableRef.current.querySelector<HTMLElement>(selector);
    el?.focus();
    if (el instanceof HTMLInputElement) {
      if (selectDraft.current) el.select();
      else el.setSelectionRange(el.value.length, el.value.length);
    }
  });

  const rawValue = (row: T, col: GridColumn<T>): string => String(row[col.key] ?? '');

  const save = (row: T, col: GridColumn<T>, value: string): void => {
    const k = cellKey(row.id, col.key);
    const where = `${col.header} for ${rowLabel(row)}`;
    setCells((prev) => ({ ...prev, [k]: { status: 'saving', value } }));
    onCommit(row.id, col.key, value).then(
      () => {
        setCells((prev) => ({ ...prev, [k]: { status: 'saved', value } }));
        setAnnouncement(`Saved ${where}.`);
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : 'The server did not respond.';
        setCells((prev) => ({ ...prev, [k]: { status: 'failed', value, message } }));
        setAnnouncement(`Couldn't save ${where}. ${message} Press Enter on the cell to retry.`);
      },
    );
  };

  const startEdit = (r: number, c: number, typed?: string): void => {
    const row = rows[r];
    const col = columns[c];
    if (!row || !col) return;
    if (editing && (editing.rowId !== row.id || editing.key !== col.key)) {
      // Never drop an unfinished edit: send the user back to it.
      focusTarget.current = 'input';
      setAnnouncement('Finish or cancel the open edit first.');
      return;
    }
    if (!col.editor || c === 0) {
      setAnnouncement(`${col.header} is read only.`);
      return;
    }
    const failed = cells[cellKey(row.id, col.key)];
    const draft = typed ?? (failed?.status === 'failed' ? failed.value : rawValue(row, col));
    skipBlur.current = false;
    selectDraft.current = typed === undefined;
    focusTarget.current = 'input';
    setEditing({ rowId: row.id, key: col.key, draft, error: null });
  };

  /** Validates and saves the open edit. Returns false when the draft is invalid and the editor stays open. */
  const commit = (): boolean => {
    if (!editing) return true;
    const row = rows.find((x) => x.id === editing.rowId);
    const col = columns.find((x) => x.key === editing.key);
    if (!row || !col?.editor) {
      setEditing(null);
      return true;
    }
    const value = editing.draft.trim();
    const error = validateCell(col.editor, value, col.header) ?? col.validate?.(value, row) ?? null;
    if (error) {
      setEditing({ ...editing, error });
      setAnnouncement(error);
      return false;
    }
    setEditing(null);
    const failed = cells[cellKey(row.id, col.key)]?.status === 'failed';
    if (value !== rawValue(row, col) || failed) save(row, col, value);
    return true;
  };

  const onCellKeyDown = (event: KeyboardEvent<HTMLElement>, r: number, c: number): void => {
    if (event.target !== event.currentTarget) return; // Keys typed inside the editor.
    const next = nextPosition(event.key, event.ctrlKey || event.metaKey, { row: r, col: c }, rows.length, columns.length);
    if (next) {
      event.preventDefault();
      focusTarget.current = 'cell';
      setActive(next);
    } else if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      startEdit(r, c);
    } else if (isTypeToEdit(event) && columns[c]?.editor && columns[c]?.editor?.kind !== 'select') {
      event.preventDefault();
      startEdit(r, c, event.key);
    }
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      skipBlur.current = true;
      if (commit()) focusTarget.current = 'cell';
      else skipBlur.current = false;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      skipBlur.current = true;
      focusTarget.current = 'cell';
      setEditing(null);
      setAnnouncement('Edit canceled.');
    }
  };

  // Tab and pointer clicks leave the editor by blurring it: valid drafts save, invalid ones stay open.
  const onEditorBlur = (): void => {
    if (skipBlur.current) skipBlur.current = false;
    else commit();
  };

  const onDraftChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    if (editing) setEditing({ ...editing, draft: event.target.value });
  };

  const renderEditor = (row: T, col: GridColumn<T>, open: Editing): ReactNode => {
    const shared = {
      'data-editor': '',
      className: styles.editor,
      value: open.draft,
      'aria-label': `${col.header}, ${rowLabel(row)}`,
      'aria-invalid': open.error ? true : undefined,
      'aria-describedby': open.error ? errorId : undefined,
      onChange: onDraftChange,
      onKeyDown: onEditorKeyDown,
      onBlur: onEditorBlur,
    };
    return (
      <>
        {col.editor?.kind === 'select' ? (
          <select {...shared}>
            {col.editor.options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input type="text" inputMode={col.editor?.kind === 'number' ? 'decimal' : undefined} {...shared} />
        )}
        {open.error && (
          <span id={errorId} className={styles.error}>
            <span aria-hidden="true" className={styles.errorIcon}>!</span> {open.error}
          </span>
        )}
      </>
    );
  };

  const renderStatus = (row: T, col: GridColumn<T>, status: CellStatus): ReactNode => (
    <span className={styles.status} data-status={status.status}>
      {status.status === 'saving' && 'Saving…'}
      {status.status === 'saved' && (
        <>
          <span aria-hidden="true">✓</span>
          <span className={styles.visuallyHidden}>Saved</span>
        </>
      )}
      {status.status === 'failed' && (
        <>
          <span aria-hidden="true" className={styles.errorIcon}>!</span> Not saved. {status.message}
          <button type="button" tabIndex={-1} className={styles.retry} onClick={() => save(row, col, status.value)}>
            Retry
          </button>
        </>
      )}
    </span>
  );

  return (
    <div className={styles.root}>
      <p id={helpId} className={styles.help}>
        Arrow keys move between cells. Enter or F2 edits, Escape cancels, Tab leaves the grid.
      </p>
      <div className={styles.scroller}>
        <table ref={tableRef} role="grid" aria-labelledby={captionId} aria-describedby={helpId} className={styles.table}>
          <caption id={captionId} className={styles.caption}>
            {caption}
          </caption>
          <thead>
            <tr>
              {columns.map((col, c) => (
                <th key={col.key} scope="col" data-align={col.align ?? 'start'}>
                  {col.header}
                  {c > 0 && !col.editor && <span className={styles.tag}>Read only</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td role="gridcell" colSpan={columns.length} className={styles.empty}>
                  No rows to edit.
                </td>
              </tr>
            ) : (
              rows.map((row, r) => (
                <tr key={row.id}>
                  {columns.map((col, c) => {
                    const status = cells[cellKey(row.id, col.key)];
                    const open = editing?.rowId === row.id && editing.key === col.key ? editing : null;
                    const shown = status && status.status !== 'saved' ? status.value : col.format ? col.format(row) : rawValue(row, col);
                    const cellProps = {
                      'data-pos': `${r}:${c}`,
                      'data-status': status?.status,
                      'data-editing': open ? '' : undefined,
                      'data-align': col.align ?? 'start',
                      tabIndex: position.row === r && position.col === c && !open ? 0 : -1,
                      onKeyDown: (event: KeyboardEvent<HTMLElement>) => onCellKeyDown(event, r, c),
                      onFocus: (event: FocusEvent<HTMLElement>) => {
                        if (event.target === event.currentTarget) setActive({ row: r, col: c });
                      },
                      onDoubleClick: () => startEdit(r, c),
                    };
                    const content = open ? (
                      renderEditor(row, col, open)
                    ) : (
                      <>
                        <span className={styles.value}>{shown}</span>
                        {status && renderStatus(row, col, status)}
                      </>
                    );
                    return c === 0 ? (
                      <th key={col.key} scope="row" {...cellProps}>
                        {content}
                      </th>
                    ) : (
                      <td key={col.key} role="gridcell" aria-readonly={col.editor ? undefined : true} {...cellProps}>
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
      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
    </div>
  );
}
