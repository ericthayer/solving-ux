import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import styles from './MfaSignIn.module.css';

/** What the server says about an email and password. */
export type PasswordResult =
  | { status: 'code-required'; destination: string }
  | { status: 'signed-in' }
  | { status: 'invalid'; message: string };

/** What the server says about a one-time code or a passkey. */
export type FactorResult = { status: 'signed-in' } | { status: 'invalid'; message: string };

/** The only seam to your auth backend. Reject a promise for network failures; resolve "invalid" for wrong answers. */
export type MfaAuthAdapter = {
  verifyPassword: (email: string, password: string) => Promise<PasswordResult>;
  verifyCode: (code: string) => Promise<FactorResult>;
  resendCode: () => Promise<void>;
  /** Omit to hide the passkey option. */
  signInWithPasskey?: () => Promise<FactorResult>;
  /** Omit to hide the email link option. */
  sendEmailLink?: (email: string) => Promise<void>;
};

export type MfaSignInProps = {
  auth: MfaAuthAdapter;
  onSignedIn: (email: string) => void;
  codeLength?: number;
  resendDelaySeconds?: number;
};

type Stage = 'credentials' | 'code';
type FieldName = 'email' | 'password' | 'code';
type FieldErrors = Partial<Record<FieldName, string>>;

/** Strips the spaces and hyphens that messages and password managers paste with a code. */
export function normalizeCode(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

export function validateCode(code: string, length: number): string | null {
  if (code === '') return `Enter the ${length}-digit code.`;
  if (!/^\d+$/.test(code)) return `The code is ${length} digits. Remove any letters or symbols.`;
  if (code.length !== length) return `The code is ${length} digits. You entered ${code.length}.`;
  return null;
}

/** "0:07" style wait text. Rendered in plain text, never in a live region, so it is not read every second. */
export const formatWait = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function useCountdown(seconds: number): [number, () => void] {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return undefined;
    const timer = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);
  return [left, () => setLeft(seconds)];
}

export function MfaSignIn({ auth, onSignedIn, codeLength = 6, resendDelaySeconds = 30 }: MfaSignInProps): JSX.Element {
  const id = useId();
  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [destination, setDestination] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, startResendWait] = useCountdown(resendDelaySeconds);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});
  const focusHeading = useRef(false);

  // Focus moves to the new heading after the stage commits, so "Enter your verification code" is announced.
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    headingRef.current?.focus();
  }, [stage]);

  const goTo = (next: Stage): void => {
    setStage(next);
    setErrors({});
    setAlert('');
    setStatus('');
    focusHeading.current = true;
  };

  const showErrors = (next: FieldErrors): boolean => {
    setErrors(next);
    const first = (['email', 'password', 'code'] as const).find((name) => next[name]);
    if (first) fieldRefs.current[first]?.focus();
    return first !== undefined;
  };

  /** Runs a server call. A thrown error keeps every value on screen and says so. */
  async function call<T>(task: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setAlert('');
    try {
      return await task();
    } catch {
      setAlert('We could not reach the server. Nothing you entered was lost. Try again.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  const submitCredentials = async (): Promise<void> => {
    if (showErrors({ email: email.trim() ? undefined : 'Enter your email address.', password: password ? undefined : 'Enter your password.' })) return;
    const result = await call(() => auth.verifyPassword(email.trim(), password));
    if (!result) return;
    if (result.status === 'invalid') return setAlert(result.message);
    if (result.status === 'signed-in') return onSignedIn(email.trim());
    setDestination(result.destination);
    startResendWait();
    goTo('code');
  };

  const submitCode = async (): Promise<void> => {
    const value = normalizeCode(code);
    const problem = validateCode(value, codeLength);
    if (problem) return void showErrors({ code: problem });
    const result = await call(() => auth.verifyCode(value));
    if (!result) return;
    if (result.status === 'invalid') return void showErrors({ code: result.message });
    onSignedIn(email.trim());
  };

  const signInWithPasskey = async (): Promise<void> => {
    const passkey = auth.signInWithPasskey;
    if (!passkey) return;
    const result = await call(passkey);
    if (result?.status === 'invalid') setAlert(result.message);
    else if (result) onSignedIn(email.trim());
  };

  const sendLink = async (): Promise<void> => {
    const send = auth.sendEmailLink;
    if (!send || showErrors({ email: email.trim() ? undefined : 'Enter your email address to get a sign-in link.' })) return;
    const sent = await call(() => send(email.trim()).then(() => true));
    if (sent) setStatus(`We sent a sign-in link to ${email.trim()}. Open it on this device to finish signing in.`);
  };

  const resend = async (): Promise<void> => {
    if (resendIn > 0 || busy) return;
    const sent = await call(() => auth.resendCode().then(() => true));
    if (!sent) return;
    setErrors({});
    setStatus(`We sent a new code to ${destination}.`);
    startResendWait();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void (stage === 'credentials' ? submitCredentials() : submitCode());
  };

  const field = (name: FieldName, hintId?: string) => ({
    id: `${id}-${name}`,
    name,
    ref: (el: HTMLInputElement | null) => { fieldRefs.current[name] = el; },
    className: name === 'code' ? styles.codeInput : styles.input,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': [hintId, errors[name] ? `${id}-${name}-error` : ''].filter(Boolean).join(' ') || undefined,
  });

  const errorFor = (name: FieldName): JSX.Element | null =>
    errors[name] ? <p id={`${id}-${name}-error`} className={styles.error}>{errors[name]}</p> : null;

  const waiting = resendIn > 0;

  return (
    <form className={styles.root} onSubmit={onSubmit} noValidate aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`} ref={headingRef} tabIndex={-1} className={styles.heading}>
        {stage === 'credentials' ? 'Sign in' : 'Enter your verification code'}
      </h3>

      <div role="alert" className={alert ? styles.alert : undefined}>{alert}</div>

      {stage === 'credentials' ? (
        <>
          <div className={styles.field}>
            <label htmlFor={`${id}-email`} className={styles.label}>Email address</label>
            {errorFor('email')}
            <input {...field('email')} type="email" autoComplete="username" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${id}-password`} className={styles.label}>Password</label>
            {errorFor('password')}
            <div className={styles.inputRow}>
              <input {...field('password')} type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className={styles.secondary} aria-pressed={showPassword} aria-controls={`${id}-password`} onClick={() => setShowPassword((v) => !v)}>
                Show password
              </button>
            </div>
          </div>
          <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>

          {(auth.signInWithPasskey || auth.sendEmailLink) && (
            <section className={styles.alternatives} aria-labelledby={`${id}-alt`}>
              <h4 id={`${id}-alt`} className={styles.subheading}>Or sign in without a password</h4>
              {auth.signInWithPasskey && (
                <button type="button" className={styles.secondary} disabled={busy} onClick={() => void signInWithPasskey()}>Sign in with a passkey</button>
              )}
              {auth.sendEmailLink && (
                <button type="button" className={styles.secondary} disabled={busy} onClick={() => void sendLink()}>Email me a sign-in link</button>
              )}
            </section>
          )}
        </>
      ) : (
        <>
          <div className={styles.field}>
            <label htmlFor={`${id}-code`} className={styles.label}>Verification code</label>
            <p id={`${id}-code-hint`} className={styles.hint}>
              We sent a {codeLength}-digit code to {destination}. Paste it or let your device fill it in.
            </p>
            {errorFor('code')}
            <input {...field('code', `${id}-code-hint`)} type="text" inputMode="numeric" autoComplete="one-time-code" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</button>
          <div className={styles.links}>
            <button type="button" className={styles.linkButton} aria-disabled={waiting || undefined} aria-describedby={waiting ? `${id}-wait` : undefined} onClick={() => void resend()}>
              Send a new code
            </button>
            {waiting && <span id={`${id}-wait`} className={styles.hint}>Available in {formatWait(resendIn)}</span>}
            <button type="button" className={styles.linkButton} onClick={() => goTo('credentials')}>Use a different sign-in method</button>
          </div>
        </>
      )}

      <p role="status" className={styles.status}>{status}</p>
    </form>
  );
}
