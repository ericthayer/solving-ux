import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './ToastStack.module.css';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export type ToastInput = {
  tone: ToastTone;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  /** Milliseconds before auto-dismiss. Errors and toasts with actions never auto-dismiss. */
  duration?: number;
};

type Toast = ToastInput & { id: string };

type ToastApi = {
  notify: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>.');
  return api;
}

export type ToastProviderProps = {
  children: ReactNode;
  /** Toasts beyond this count wait in a queue and are summarized as "N more". */
  maxVisible?: number;
  defaultDuration?: number;
  /** Shortcut that moves focus to the notification list. */
  hotkey?: string;
};

const TONE_LABEL: Record<ToastTone, string> = { info: 'Info', success: 'Success', warning: 'Warning', error: 'Error' };
let counter = 0;

export function ToastProvider({ children, maxVisible = 3, defaultDuration = 6000, hotkey = 'F8' }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [paused, setPaused] = useState(false);
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const listRef = useRef<HTMLOListElement>(null);

  const dismiss = useCallback((id: string) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const dismissAll = useCallback(() => setToasts([]), []);

  const notify = useCallback((input: ToastInput): string => {
    counter += 1;
    const id = `toast-${counter}`;
    // Errors go first so the highest-severity message is never queued out of sight.
    setToasts((list) => (input.tone === 'error' ? [{ ...input, id }, ...list] : [...list, { ...input, id }]));
    const text = `${TONE_LABEL[input.tone]}: ${input.title}${input.description ? `. ${input.description}` : ''}`;
    if (input.tone === 'error') setAssertive(text);
    else setPolite(text);
    return id;
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === hotkey) {
        event.preventDefault();
        listRef.current?.querySelector<HTMLElement>('[data-toast]')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hotkey]);

  const api = useMemo(() => ({ notify, dismiss, dismissAll }), [notify, dismiss, dismissAll]);
  const visible = toasts.slice(0, maxVisible);
  const queued = toasts.length - visible.length;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <p role="status" className={styles.visuallyHidden}>{polite}</p>
      <p role="alert" className={styles.visuallyHidden}>{assertive}</p>
      <section
        className={styles.viewport}
        aria-label={`Notifications (${hotkey})`}
        hidden={toasts.length === 0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
        }}
      >
        <ol ref={listRef} className={styles.list}>
          {visible.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              paused={paused}
              duration={toast.duration ?? defaultDuration}
              onDismiss={() => dismiss(toast.id)}
            />
          ))}
        </ol>
        {(queued > 0 || toasts.length > 1) && (
          <div className={styles.overflow}>
            {queued > 0 && <span>{queued} more</span>}
            <button type="button" className={styles.linkButton} onClick={dismissAll}>
              Dismiss all
            </button>
          </div>
        )}
      </section>
    </ToastContext.Provider>
  );
}

type ToastItemProps = { toast: Toast; paused: boolean; duration: number; onDismiss: () => void };

function ToastItem({ toast, paused, duration, onDismiss }: ToastItemProps): JSX.Element {
  const persistent = toast.tone === 'error' || Boolean(toast.action) || !Number.isFinite(duration);
  const remaining = useRef(duration);

  useEffect(() => {
    if (persistent || paused) return;
    const started = Date.now();
    const timer = setTimeout(onDismiss, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, persistent, onDismiss]);

  return (
    <li
      className={styles.toast}
      data-tone={toast.tone}
      data-toast=""
      tabIndex={-1}
      aria-labelledby={`${toast.id}-title`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDismiss();
      }}
    >
      <span className={styles.tone}>{TONE_LABEL[toast.tone]}</span>
      <div className={styles.body}>
        <p id={`${toast.id}-title`} className={styles.title}>
          {toast.title}
        </p>
        {toast.description && <p className={styles.description}>{toast.description}</p>}
        {toast.action && (
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button type="button" className={styles.close} onClick={onDismiss} aria-label={`Dismiss: ${toast.title}`}>
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}
