import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Pending = { action: 'archive' | 'delete'; run: () => Promise<void> } | null;

export default function ConfirmDialogBefore(): JSX.Element {
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const archive = async (): Promise<void> => {
    setIsError(false);
    setMessage('Cedar Ridge Farms archived.');
  };
  const remove = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    throw new Error('Error 409');
  };

  const confirm = (): void => {
    const job = pending;
    // The dialog closes immediately; the result lands somewhere else later.
    setPending(null);
    job?.run().catch((error: unknown) => {
      setIsError(true);
      setMessage(`Operation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    });
  };

  return (
    <div className={s.frame}>
      {message && (
        <p className={isError ? s.error : s.muted} {...(isError ? failureTarget('error-after-close') : {})}>
          {message}
        </p>
      )}
      <div className={s.toolbar} {...failureTarget('same-dialog')}>
        <button type="button" className={s.btn} onClick={() => setPending({ action: 'archive', run: archive })}>
          Archive relationship
        </button>
        <button type="button" className={s.btn} onClick={() => setPending({ action: 'delete', run: remove })} {...failureTarget('focus-not-returned')}>
          Delete facility FAC-2231
        </button>
      </div>
      <p className={s.muted}>Open either dialog, then press Tab a few times.</p>
      {pending && (
        <div className={s.overlay}>
          <div className={s.dialog} {...failureTarget('no-focus-trap')}>
            <strong>Confirm</strong>
            <span>Are you sure?</span>
            <div className={s.toolbar} {...failureTarget('ok-cancel')}>
              <button type="button" className={s.btnPrimary} onClick={confirm}>
                OK
              </button>
              <button type="button" className={s.btn} onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
