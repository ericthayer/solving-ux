import { useEffect, useRef, useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Tone = 'success' | 'info' | 'warning' | 'error';
type Toast = { id: number; tone: Tone; text: string; undo?: boolean };

const SWATCH: Record<Tone, string | undefined> = { success: s.swatchSuccess, info: s.swatchInfo, warning: s.swatchWarning, error: s.swatchError };
const TIMEOUT_MS = 3000;

export default function ToastStackBefore(): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [log, setLog] = useState('');
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const notify = (tone: Tone, text: string, undo = false): void => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((list) => [...list, { id, tone, text, undo }]);
    // Same timeout for every severity, with no pause on hover or focus.
    timers.current.push(window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), TIMEOUT_MS));
  };

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <button type="button" className={s.btn} onClick={() => notify('success', 'Draft saved')}>
          Success
        </button>
        <button type="button" className={s.btn} onClick={() => notify('warning', 'Rate lock FAC-2231 expires at 5:00 PM CT')}>
          Warning
        </button>
        <button type="button" className={s.btn} onClick={() => notify('error', 'Payment file rejected: row 18 has an invalid routing number')}>
          Error
        </button>
        <button type="button" className={s.btn} onClick={() => notify('success', 'Relationship archived', true)}>
          Success with Undo
        </button>
        <button type="button" className={s.btn} onClick={() => Array.from({ length: 6 }, (_, i) => notify('info', `Statement ${(i + 1).toString()} generated`))}>
          Burst of 6
        </button>
      </div>
      <p className={s.muted}>Every toast disappears after 3 seconds. {log}</p>
      <div className={s.toastStack} {...failureTarget('unbounded')}>
        {toasts.map((t) => (
          // A new live region per toast: many screen readers miss regions inserted with content already inside.
          <div key={t.id} role="alert" className={s.toast} {...failureTarget('live-region-on-the-fly')}>
            <span className={SWATCH[t.tone]} {...failureTarget('color-only-severity')} />
            <span className={s.spacer} {...(t.tone === 'error' ? failureTarget('error-auto-dismiss') : {})}>
              {t.text}
            </span>
            {t.undo && (
              <a href="#undo" className={s.menuItem} onClick={(e) => { e.preventDefault(); setLog('Archive undone.'); }} {...failureTarget('undo-vanishes')}>
                Undo
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
