import { useMemo, useState } from 'react';
import { MfaSignIn } from './MfaSignIn';
import type { MfaAuthAdapter } from './MfaSignIn';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

/** Demo credentials. Shown on screen so anyone can walk the whole flow. */
const DEMO_PASSWORD = 'demo-password';
const DEMO_CODE = '246810';
const EXPIRED_CODE = '000000';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const buildAdapter = (destination: string): MfaAuthAdapter => ({
  verifyPassword: async (_email, password) => {
    await wait(500);
    return password === DEMO_PASSWORD
      ? { status: 'code-required', destination }
      : { status: 'invalid', message: 'The email or password is incorrect. Check both and try again, or sign in without a password.' };
  },
  verifyCode: async (code) => {
    await wait(400);
    if (code === DEMO_CODE) return { status: 'signed-in' };
    if (code === EXPIRED_CODE) return { status: 'invalid', message: 'This code has expired. Select Send a new code.' };
    return { status: 'invalid', message: 'That code is incorrect. Check the latest message and try again.' };
  },
  resendCode: () => wait(400),
  signInWithPasskey: async () => {
    await wait(600);
    return { status: 'signed-in' };
  },
  sendEmailLink: () => wait(400),
});

export default function MfaSignInDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const auth = useMemo(() => buildAdapter(stress.text('your phone ending in 0142')), [stress]);
  const [signedIn, setSignedIn] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (signedIn !== null) {
    return (
      <div className={demo.stack} role="status">
        <div className={demo.panel}>
          <p className={demo.panelTitle}>Signed in{signedIn ? ` as ${signedIn}` : ''}</p>
          <p className={demo.panelText}>The demo stops here. Start again to try another path.</p>
        </div>
        <div className={demo.row}>
          <button type="button" className={demo.button} onClick={() => { setSignedIn(null); setAttempt((n) => n + 1); }}>
            Start again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={demo.stack}>
      <p className={demo.log}>
        Demo: any email, password <code>{DEMO_PASSWORD}</code>, code <code>{DEMO_CODE}</code>. Code <code>{EXPIRED_CODE}</code> shows the expired state.
      </p>
      <MfaSignIn key={attempt} auth={auth} onSignedIn={setSignedIn} />
    </div>
  );
}
