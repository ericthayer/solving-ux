import { useId, useState } from 'react';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const DRAFT_KEY = 'sux-demo-session-draft';

/** Demo timing so the warning is reachable: production defaults are a longer session and a 2-minute warning. */
const SESSION_MS = 25_000;
const WARNING_MS = 20_000;

function readDraft(): string {
  try {
    return sessionStorage.getItem(DRAFT_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function SessionTimeoutDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const fieldId = useId();
  // Starts signed out so the warning never interrupts someone reading the docs around the demo.
  const [signedIn, setSignedIn] = useState(false);
  const [session, setSession] = useState(0);
  const [notes, setNotes] = useState('');
  const [log, setLog] = useState('Sign in to start a demo session. The warning opens after 5 seconds without a key press or click.');

  const signIn = (): void => {
    const draft = readDraft();
    setNotes(draft);
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Storage can be unavailable (private mode). The draft is simply not restored.
    }
    setSession((n) => n + 1);
    setSignedIn(true);
    setLog(draft ? 'Signed in. Your draft was restored.' : 'Signed in.');
  };

  if (!signedIn) {
    return (
      <div className={demo.stack}>
        <div className={demo.panel}>
          <h3 className={demo.panelTitle}>{session === 0 ? 'Demo session' : 'Signed out'}</h3>
          <p className={demo.panelText}>{log}</p>
        </div>
        <div className={demo.row}>
          <button type="button" className={demo.button} onClick={signIn}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={demo.stack}>
      <div className={demo.panel}>
        <label htmlFor={fieldId} className={demo.panelTitle}>
          {text('Purchase request notes')}
        </label>
        <p className={demo.panelText}>
          {text('Demo timing: the warning opens after 5 seconds without a key press or click, and you are signed out 20 seconds later. Open this page in a second tab to see both tabs stay in sync.')}
        </p>
        <textarea
          id={fieldId}
          className={demo.textarea}
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      <p className={demo.log} aria-live="polite">
        {log}
      </p>

      <SessionTimeoutWarning
        key={session}
        sessionMs={SESSION_MS}
        warningMs={WARNING_MS}
        announceAt={[10]}
        channelName="sux-demo-session"
        onExtend={async () => {
          await new Promise((resolve) => setTimeout(resolve, 400));
          setLog('Session extended.');
        }}
        onSignOut={() => {
          setSignedIn(false);
          setLog('You signed out.');
        }}
        onExpire={() => {
          try {
            if (notes) sessionStorage.setItem(DRAFT_KEY, notes);
          } catch {
            // Without storage the draft cannot be kept; the expired message stays generic.
          }
          // A real expiry drops in-memory state on redirect. Clearing it here makes the restore visible.
          setNotes('');
        }}
        onSignIn={signIn}
        expiredMessage={
          <p>
            {text('For your security, you were signed out after a period of inactivity. Your notes are saved on this device and come back after you sign in.')}
          </p>
        }
      />
    </div>
  );
}
