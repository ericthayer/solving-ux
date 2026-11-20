import { useEffect, useId, useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const WARN_AT_MS = 6_000;
const EXPIRE_AT_MS = 16_000;

type Screen = 'form' | 'login';

export default function SessionTimeoutBefore(): JSX.Element {
  const fieldId = useId();
  const [screen, setScreen] = useState<Screen>('form');
  const [warning, setWarning] = useState(false);
  const [notes, setNotes] = useState('');
  const [run, setRun] = useState(0);

  // One fixed timer from page load. Typing never resets it, and dismissing the warning does not either.
  useEffect(() => {
    if (screen !== 'form') return undefined;
    const warn = window.setTimeout(() => setWarning(true), WARN_AT_MS);
    const expire = window.setTimeout(() => {
      setWarning(false);
      setNotes('');
      setScreen('login');
    }, EXPIRE_AT_MS);
    return () => {
      window.clearTimeout(warn);
      window.clearTimeout(expire);
    };
  }, [screen, run]);

  if (screen === 'login') {
    return (
      <div className={s.frame} {...failureTarget('silent-redirect')}>
        <strong>Sign in</strong>
        <span className={s.muted}>Your session has expired. Please sign in again.</span>
        <div className={s.toolbar}>
          <button
            type="button"
            className={s.btnPrimary}
            onClick={() => {
              setScreen('form');
              setRun((n) => n + 1);
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.frame}>
      <div className={s.field}>
        <label htmlFor={fieldId}>Purchase request notes</label>
        <textarea
          id={fieldId}
          className={s.input}
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          {...failureTarget('draft-lost')}
        />
      </div>
      <p className={s.muted}>Type a few words in the notes, then wait.</p>
      {warning && (
        <div className={s.overlay}>
          <div className={s.dialog} {...failureTarget('focus-not-moved')}>
            <strong>Warning</strong>
            <span {...failureTarget('no-countdown')}>Your session will expire soon.</span>
            <div className={s.toolbar}>
              <button type="button" className={s.btnPrimary} onClick={() => setWarning(false)} {...failureTarget('ok-does-not-extend')}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
