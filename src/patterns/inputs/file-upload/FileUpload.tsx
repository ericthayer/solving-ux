import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import styles from './FileUpload.module.css';

export type UploadContext = {
  /** Aborted when the user selects Cancel. Pass it to fetch or XHR. */
  signal: AbortSignal;
  /** Report progress from 0 to 100. */
  onProgress: (percent: number) => void;
};

export type FileUploadProps = {
  /** Group label, e.g. "Supporting documents". */
  label: string;
  /** Lowercase extensions including the dot, e.g. ['.pdf', '.csv']. */
  accept: string[];
  maxSizeBytes: number;
  maxFiles?: number;
  /** Sends one file. Resolve on success, reject to mark the file as failed. */
  upload: (file: File, context: UploadContext) => Promise<void>;
  /** Called with every successfully uploaded file whenever that list changes. */
  onUploadedChange?: (files: File[]) => void;
};

export type FileUploadHandle = { addFiles: (files: File[]) => void };

export type UploadItem =
  | { id: string; file: File; status: 'rejected'; error: string }
  | { id: string; file: File; status: 'uploading'; progress: number }
  | { id: string; file: File; status: 'done' }
  | { id: string; file: File; status: 'failed'; error: string };

export type UploadRules = Pick<FileUploadProps, 'accept' | 'maxSizeBytes' | 'maxFiles'>;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

const typeList = (accept: string[]): string => {
  const names = accept.map((ext) => ext.replace('.', '').toUpperCase());
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}` : names.join('');
};

/** The limits, stated before the user picks anything. */
export function describeRules({ accept, maxSizeBytes, maxFiles }: UploadRules): string {
  return `${typeList(accept)}. Up to ${formatBytes(maxSizeBytes)} each${maxFiles ? `, ${maxFiles} files at most` : ''}.`;
}

/** Returns why one file cannot be added, or null. Each message names the file and the fix. */
export function validateFile(file: File, rules: UploadRules, kept: File[]): string | null {
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';
  if (!rules.accept.includes(ext)) return `${file.name} is not a ${typeList(rules.accept)} file. Choose a file of an accepted type.`;
  if (file.size === 0) return `${file.name} is empty. Choose a file with content.`;
  if (file.size > rules.maxSizeBytes) {
    return `${file.name} is ${formatBytes(file.size)}. Choose a file of ${formatBytes(rules.maxSizeBytes)} or less.`;
  }
  if (kept.some((k) => k.name === file.name && k.size === file.size)) return `${file.name} is already attached.`;
  if (rules.maxFiles !== undefined && kept.length >= rules.maxFiles) {
    return `${file.name} was not added. You can attach ${rules.maxFiles} files at most; remove one first.`;
  }
  return null;
}

/** One polite sentence for the whole batch, e.g. "2 of 3 uploaded, 1 failed." */
export function summarize(items: UploadItem[]): string {
  const count = (status: UploadItem['status']): number => items.filter((i) => i.status === status).length;
  const accepted = items.length - count('rejected');
  const parts = accepted > 0 ? [`${count('done')} of ${accepted} uploaded`] : [];
  if (count('uploading') > 0) parts.push(`${count('uploading')} in progress`);
  if (count('failed') > 0) parts.push(`${count('failed')} failed`);
  if (count('rejected') > 0) parts.push(`${count('rejected')} not added`);
  return parts.length > 0 ? `${parts.join(', ')}.` : '';
}

export const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(function FileUpload(
  { label, accept, maxSizeBytes, maxFiles, upload, onUploadedChange },
  ref,
): JSX.Element {
  const baseId = useId();
  const nextId = useRef(0);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const focusRowAfterRemove = useRef<number | null>(null);
  const rules: UploadRules = { accept, maxSizeBytes, maxFiles };

  const patch = (id: string, next: UploadItem | null): void =>
    setItems((prev) => (next ? prev.map((i) => (i.id === id ? next : i)) : prev.filter((i) => i.id !== id)));

  // Each file uploads on its own, so one failure never takes the rest of the batch with it.
  const start = (id: string, file: File): void => {
    const controller = new AbortController();
    controllers.current.set(id, controller);
    patch(id, { id, file, status: 'uploading', progress: 0 });
    const onProgress = (percent: number): void =>
      setItems((prev) => prev.map((i) => (i.id === id && i.status === 'uploading' ? { ...i, progress: Math.round(percent) } : i)));
    upload(file, { signal: controller.signal, onProgress })
      .then(() => patch(id, { id, file, status: 'done' }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const reason = err instanceof Error && err.message ? err.message : 'The upload did not finish';
        patch(id, { id, file, status: 'failed', error: `${reason}. Select Retry to try ${file.name} again.` });
      })
      .finally(() => controllers.current.delete(id));
  };

  const addFiles = (files: File[]): void => {
    const kept = items.filter((i) => i.status !== 'rejected').map((i) => i.file);
    const added: UploadItem[] = [];
    for (const file of files) {
      const id = `${baseId}-${nextId.current++}`;
      const error = validateFile(file, rules, kept);
      if (error) added.push({ id, file, status: 'rejected', error });
      else {
        kept.push(file);
        added.push({ id, file, status: 'uploading', progress: 0 });
      }
    }
    setItems((prev) => [...prev, ...added]);
    added.forEach((item) => item.status === 'uploading' && start(item.id, item.file));
  };

  useImperativeHandle(ref, () => ({ addFiles }));

  const remove = (id: string): void => {
    controllers.current.get(id)?.abort();
    focusRowAfterRemove.current = items.findIndex((i) => i.id === id);
    patch(id, null);
  };

  // Removing a row would drop focus to <body>. Move it to the next row, or back to the picker.
  useEffect(() => {
    if (focusRowAfterRemove.current === null) return;
    const rows = listRef.current?.querySelectorAll('li') ?? [];
    const row = rows[Math.min(focusRowAfterRemove.current, rows.length - 1)];
    focusRowAfterRemove.current = null;
    (row?.querySelector('button') ?? inputRef.current)?.focus();
  }, [items]);

  useEffect(() => () => controllers.current.forEach((c) => c.abort()), []);

  const uploaded = useMemo(() => items.flatMap((i) => (i.status === 'done' ? [i.file] : [])), [items]);
  useEffect(() => onUploadedChange?.(uploaded), [uploaded, onUploadedChange]);

  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <fieldset className={styles.root} aria-describedby={`${baseId}-rules`}>
      <legend className={styles.legend}>{label}</legend>
      <p id={`${baseId}-rules`} className={styles.hint}>{describeRules(rules)}</p>

      {/* Dropping is an enhancement. The native input below is the path that always works (WCAG 2.5.7). */}
      <div
        className={styles.dropZone}
        data-dragging={dragging || undefined}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          id={`${baseId}-input`}
          type="file"
          multiple
          accept={accept.join(',')}
          className={styles.visuallyHidden}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        <label htmlFor={`${baseId}-input`} className={styles.chooseButton}>
          Choose files
        </label>
        <span className={styles.dropText}>or drop them here</span>
      </div>

      <p role="status" className={styles.summary}>{summarize(items)}</p>

      {items.length > 0 && (
        <ul ref={listRef} className={styles.list} aria-label={`${label}, ${items.length} ${items.length === 1 ? 'file' : 'files'}`}>
          {items.map((item) => (
            <li key={item.id} className={styles.row} data-status={item.status}>
              <span className={styles.name}>{item.file.name}</span>
              <span className={styles.meta}>
                {formatBytes(item.file.size)}
                {item.status === 'uploading' && `, uploading ${item.progress}%`}
                {item.status === 'done' && ', uploaded'}
              </span>
              {item.status === 'uploading' && (
                <progress className={styles.progress} max={100} value={item.progress} aria-label={`${item.file.name} upload progress`} />
              )}
              {(item.status === 'rejected' || item.status === 'failed') && <p className={styles.error}>{item.error}</p>}
              <span className={styles.actions}>
                {item.status === 'failed' && (
                  <button type="button" className={styles.action} onClick={() => start(item.id, item.file)} aria-label={`Retry ${item.file.name}`}>
                    Retry
                  </button>
                )}
                <button type="button" className={styles.action} onClick={() => remove(item.id)} aria-label={`${item.status === 'uploading' ? 'Cancel' : 'Remove'} ${item.file.name}`}>
                  {item.status === 'uploading' ? 'Cancel' : 'Remove'}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
});
