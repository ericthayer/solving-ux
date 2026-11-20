import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const CAPTCHA = 'X7KQ2';
const CODE_TIMEOUT_MS = 30_000;
const block = (e: ClipboardEvent<HTMLInputElement>): void => e.preventDefault();

export default function MfaSignInBefore(): JSX.Element {
  const form = useRef<HTMLFormElement>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const [stage, setStage] = useState<'login' | 'code' | 'done'>('login');
  const [message, setMessage] = useState('');

  // The code screen silently expires and drops the user back at an empty login form.
  useEffect(() => {
    if (stage !== 'code') return undefined;
    const timer = setTimeout(() => {
      setStage('login');
      setMessage('Session expired.');
    }, CODE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const login = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ok = data.get('user') && data.get('pass') === 'demo-password' && String(data.get('captcha')) === CAPTCHA;
    if (!ok) {
      form.current?.reset();
      setMessage('Invalid login.');
      return;
    }
    setMessage('');
    setStage('code');
  };

  const advance = (i: number) => (e: FormEvent<HTMLInputElement>): void => {
    if (e.currentTarget.value) boxes.current[i + 1]?.focus();
  };
  const back = (i: number) => (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !e.currentTarget.value) boxes.current[i - 1]?.focus();
  };

  if (stage === 'done') return <div className={s.frame}><p>Welcome.</p></div>;

  if (stage === 'code') {
    return (
      <form className={s.frame} onSubmit={(e) => { e.preventDefault(); setStage(boxes.current.map((b) => b?.value).join('') === '246810' ? 'done' : 'code'); }}>
        <p>Enter code</p>
        <div className={s.toolbar} {...failureTarget('split-code-boxes')}>
          {Array.from({ length: 6 }, (_, i) => (
            <input key={i} ref={(el) => { boxes.current[i] = el; }} className={s.codeBox} maxLength={1} onInput={advance(i)} onKeyDown={back(i)} onPaste={block} autoComplete="off" />
          ))}
        </div>
        <p className={s.muted} {...failureTarget('silent-timeout')}>Code sent.</p>
        <div><button type="submit" className={s.btnPrimary}>OK</button></div>
      </form>
    );
  }

  return (
    <form ref={form} className={s.frame} onSubmit={login} {...failureTarget('clears-on-error')}>
      {message && <p className={s.error}>{message}</p>}
      <div className={s.field}>
        User ID
        <input name="user" className={s.input} autoComplete="off" aria-label="user" {...failureTarget('no-autocomplete')} />
      </div>
      <div className={s.field}>
        Password
        <input name="pass" type="password" className={s.input} autoComplete="off" aria-label="pass" onPaste={block} {...failureTarget('paste-blocked')} />
      </div>
      <div className={s.field} {...failureTarget('captcha-only')}>
        <span aria-hidden="true" className={s.captcha}>{CAPTCHA}</span>
        <input name="captcha" className={s.input} aria-label="captcha" onPaste={block} autoComplete="off" />
      </div>
      <p className={s.muted}>Demo: password demo-password, then code 246810.</p>
      <div><button type="submit" className={s.btnPrimary}>Login</button></div>
    </form>
  );
}
