import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import styles from './SessionTimeoutWarning.module.css';

export type SessionPhase = 'active' | 'warning' | 'expired' | 'signed-out';

/** Messages shared between every open tab of the app. */
export type SessionMessage = { type: 'extended'; expiresAt: number } | { type: 'signed-out' };

export type SessionTimeoutWarningProps = {
  /** Idle time before the session ends, in ms. Match the server's idle timeout. */
  sessionMs: number;
  /** How long before expiry the warning opens, in ms. WCAG 2.2.1 needs at least 20 seconds. */
  warningMs?: number;
  /** Seconds remaining at which the live region speaks. The visible countdown still ticks every second. */
  announceAt?: number[];
  /** Refresh the server session. Throw to keep the dialog open with the error inside it. */
  onExtend: () => void | Promise<void>;
  /** The user chose to end the session. Other tabs are told through the channel. */
  onSignOut: () => void;
  /** The session ran out. Save unsaved drafts here so they can be restored after sign-in. */
  onExpire: () => void;
  /** The user chose "Sign in again" after expiry. */
  onSignIn: () => void;
  /** Shown after expiry. Only promise that work is kept if onExpire really keeps it. */
  expiredMessage?: ReactNode;
  /** BroadcastChannel name shared by every tab of the app. */
  channelName?: string;
};

const ACTIVITY_THROTTLE_MS = 1000;
const ACTIVITY_EVENTS = ['keydown', 'pointerdown'] as const;

/** "1:05" for the visible countdown. */
export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** "1 minute 5 seconds" for screen readers, which read "1:05" as a time of day. */
export function formatSpoken(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const part = (n: number, unit: string): string => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (m === 0) return part(s, 'second');
  return s === 0 ? part(m, 'minute') : `${part(m, 'minute')} ${part(s, 'second')}`;
}

export function SessionTimeoutWarning({
  sessionMs,
  warningMs = 120_000,
  announceAt = [60, 30, 10],
  onExtend,
  onSignOut,
  onExpire,
  onSignIn,
  expiredMessage = 'For your security, you were signed out after a period of inactivity. Sign in again to continue.',
  channelName = 'sux-session',
}: SessionTimeoutWarningProps): JSX.Element {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const signInRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastAnnouncedRef = useRef(Infinity);
  const callbacks = useRef({ onSignOut, onExpire });
  callbacks.current = { onSignOut, onExpire };

  const [expiresAt, setExpiresAt] = useState(() => Date.now() + sessionMs);
  const [now, setNow] = useState(() => Date.now());
  const [ended, setEnded] = useState<'expired' | 'signed-out' | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingMs = Math.max(0, expiresAt - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const phase: SessionPhase = ended ?? (remainingMs === 0 ? 'expired' : remainingMs <= warningMs ? 'warning' : 'active');

  const extendTo = (next: number, broadcast: boolean): void => {
    setExpiresAt(next);
    setNow(Date.now());
    if (broadcast) channelRef.current?.postMessage({ type: 'extended', expiresAt: next } satisfies SessionMessage);
  };

  // Every tab shares one session. Activity or "Stay signed in" in any tab moves the deadline in all of them.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<SessionMessage>) => {
      if (event.data.type === 'extended') {
        const next = event.data.expiresAt;
        setExpiresAt((prev) => Math.max(prev, next));
        setNow(Date.now());
        setError(null);
      } else {
        setEnded('signed-out');
        callbacks.current.onSignOut();
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [channelName]);

  // Wall-clock time, not a decrementing counter: background tabs throttle timers, so we re-read Date.now().
  useEffect(() => {
    if (ended) return undefined;
    const tick = (): void => setNow(Date.now());
    const timer =
      phase === 'warning' ? window.setInterval(tick, 1000) : window.setTimeout(tick, Math.max(0, expiresAt - warningMs - Date.now()));
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [phase, ended, expiresAt, warningMs]);

  // Real activity resets the idle clock, but only before the warning. Once it opens, only an explicit choice counts.
  useEffect(() => {
    if (phase !== 'active') return undefined;
    let last = 0;
    const onActivity = (): void => {
      const t = Date.now();
      if (t - last < ACTIVITY_THROTTLE_MS) return;
      last = t;
      extendTo(t + sessionMs, true);
    };
    for (const type of ACTIVITY_EVENTS) document.addEventListener(type, onActivity, true);
    return () => {
      for (const type of ACTIVITY_EVENTS) document.removeEventListener(type, onActivity, true);
    };
    // extendTo only touches refs and state setters, so it is safe to leave out of the deps.
  }, [phase, sessionMs]);

  useEffect(() => {
    if (phase === 'expired' && !ended) {
      setEnded('expired');
      setAnnouncement('You have been signed out.');
      callbacks.current.onExpire();
    }
  }, [phase, ended]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const shouldOpen = phase === 'warning' || phase === 'expired';
    if (shouldOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      // The dialog's description already reads the time left, so skip thresholds we are already past.
      lastAnnouncedRef.current = Math.min(Infinity, ...announceAt.filter((t) => t >= seconds));
      dialog.showModal();
    } else if (!shouldOpen && dialog.open) {
      dialog.close();
    }
    if (phase === 'warning') stayRef.current?.focus();
    if (phase === 'expired') signInRef.current?.focus();
    // Focus moves only when the phase changes, not on every countdown tick.
  }, [phase]);

  // Speak at a few thresholds, never every second. Crossing is checked with <= so a throttled tab still speaks.
  useEffect(() => {
    if (phase !== 'warning') return;
    const due = announceAt.filter((t) => seconds <= t && t < lastAnnouncedRef.current);
    if (due.length === 0) return;
    lastAnnouncedRef.current = Math.min(...due);
    setAnnouncement(`${formatSpoken(seconds)} remaining before you are signed out.`);
  }, [phase, seconds, announceAt]);

  const handleNativeClose = (): void => {
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
    setAnnouncement('');
  };

  const stay = async (): Promise<void> => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onExtend();
      extendTo(Date.now() + sessionMs, true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'We could not extend your session. Try again.');
    } finally {
      setPending(false);
    }
  };

  const signOut = (): void => {
    setEnded('signed-out');
    channelRef.current?.postMessage({ type: 'signed-out' } satisfies SessionMessage);
    onSignOut();
  };

  // Escape is a deliberate response from a present user, so it keeps the session. After expiry there is nothing to dismiss.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    event.preventDefault();
    if (phase === 'warning') void stay();
  };

  const urgent = phase === 'warning' && seconds <= 10;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={phase === 'expired' ? `${id}-description` : `${id}-description ${id}-countdown`}
      data-phase={phase}
      onCancel={handleCancel}
      onClose={handleNativeClose}
    >
      <div className={styles.panel}>
        <h2 id={`${id}-title`} className={styles.title}>
          {phase === 'expired' ? 'You have been signed out' : 'Your session is about to end'}
        </h2>
        <div id={`${id}-description`} className={styles.description}>
          {phase === 'expired' ? expiredMessage : <p>For your security, inactive sessions end automatically. Choose Stay signed in to keep working.</p>}
        </div>

        {phase !== 'expired' && (
          <p id={`${id}-countdown`} className={styles.countdown} data-urgent={urgent || undefined}>
            <span className={styles.srOnly}>Time remaining: {formatSpoken(seconds)}</span>
            <time aria-hidden="true" dateTime={`PT${seconds}S`}>
              {formatClock(seconds)}
            </time>
            <span aria-hidden="true" className={styles.countdownLabel}>
              {urgent ? 'Signing out soon' : 'until sign-out'}
            </span>
          </p>
        )}

        <p role="status" className={styles.srOnly}>
          {announcement}
        </p>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          {phase === 'expired' ? (
            <button ref={signInRef} type="button" className={styles.primary} onClick={onSignIn}>
              Sign in again
            </button>
          ) : (
            <>
              <button type="button" className={styles.secondary} onClick={signOut} disabled={pending}>
                Sign out now
              </button>
              <button ref={stayRef} type="button" className={styles.primary} onClick={() => void stay()} disabled={pending}>
                {pending ? 'Extending…' : 'Stay signed in'}
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
