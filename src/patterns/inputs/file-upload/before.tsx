import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const MAX_BYTES = 2 * 1024 * 1024;

export default function FileUploadBefore(): JSX.Element {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<string[]>([]);

  const send = (list: File[]): void => {
    if (list.length === 0) return;
    setError('');
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      // One bad file rejects the whole batch, and the limits are only revealed now.
      if (list.some((f) => f.size > MAX_BYTES || !f.name.toLowerCase().endsWith('.pdf'))) {
        setError('Upload failed. Files must be PDF and under 2 MB.');
        return;
      }
      setFiles((prev) => [...prev, ...list.map((f) => f.name)]);
    }, 1500);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    send(Array.from(event.dataTransfer.files));
  };

  return (
    <div className={s.frame}>
      <b>Supporting documents</b>
      <div
        className={`${s.card} ${s.empty}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        {...failureTarget('drag-only')}
      >
        <span {...failureTarget('hidden-limits')}>Drag and drop files here</span>
        {busy && (
          <span className={s.muted} {...failureTarget('silent-spinner')}>
            {' '}◌
          </span>
        )}
      </div>
      <input ref={input} type="file" multiple hidden onChange={(e) => send(Array.from(e.target.files ?? []))} />
      {error && (
        <p className={s.error} {...failureTarget('batch-fails')}>
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className={s.list} {...failureTarget('no-undo')}>
          {files.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
