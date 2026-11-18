import { useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent, ReactNode, SyntheticEvent } from 'react';
import styles from './ConfirmDialog.module.css';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" uses alertdialog semantics, focuses Cancel first, and ignores backdrop clicks. */
  tone?: 'default' | 'danger';
  /** Itemized consequences, e.g. "3 pending payments will be cancelled". */
  consequences?: string[];
  /** For irreversible actions: the exact text the user must type to enable Confirm. */
  requireText?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  consequences = [],
  requireText,
  onConfirm,
  onClose,
}: ConfirmDialogProps): JSX.Element {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setTyped('');
      setError(null);
      dialog.showModal();
      // Least destructive control gets focus first; the confirm text input when one is required.
      (requireText ? inputRef.current : cancelRef.current)?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, requireText]);

  const handleNativeClose = (): void => {
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  };

  const requestClose = (): void => {
    if (!pending) onClose();
  };

  // Escape fires "cancel". Prevent the native close so React state stays the source of truth.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    event.preventDefault();
    requestClose();
  };

  const handleBackdrop = (event: MouseEvent<HTMLDialogElement>): void => {
    if (tone !== 'danger' && event.target === dialogRef.current) requestClose();
  };

  const confirm = async (): Promise<void> => {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'The action did not complete. Try again.');
    } finally {
      setPending(false);
    }
  };

  const matches = !requireText || typed.trim() === requireText;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      role={tone === 'danger' ? 'alertdialog' : undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      data-tone={tone}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onClick={handleBackdrop}
    >
      <form
        method="dialog"
        className={styles.panel}
        onSubmit={(event) => {
          event.preventDefault();
          if (matches && !pending) void confirm();
        }}
      >
        <h2 id={`${id}-title`} className={styles.title}>
          {title}
        </h2>
        <div id={`${id}-description`} className={styles.description}>
          {description}
          {consequences.length > 0 && (
            <ul className={styles.consequences}>
              {consequences.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        {requireText && (
          <div className={styles.field}>
            <label htmlFor={`${id}-confirm-text`}>
              Type <strong>{requireText}</strong> to confirm
            </label>
            <input
              ref={inputRef}
              id={`${id}-confirm-text`}
              className={styles.input}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button ref={cancelRef} type="button" className={styles.secondary} onClick={requestClose} disabled={pending}>
            {cancelLabel}
          </button>
          <button type="submit" className={tone === 'danger' ? styles.danger : styles.primary} disabled={!matches || pending}>
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
