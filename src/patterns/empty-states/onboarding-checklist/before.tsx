import { useEffect, useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const STEPS = [
  { text: 'Welcome! Let’s take a quick tour of your new workspace.', ring: null },
  { text: 'This is Import. Use it to bring in your data.', ring: 'import' },
  { text: 'Invite your team with the Invite button.', ring: 'invite' },
  { text: 'Reports live here. You’re all set, have fun!', ring: 'reports' },
] as const;

const ADVANCE_MS = 4000;

export default function OnboardingChecklistBefore(): JSX.Element {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const current = STEPS[Math.min(step, STEPS.length - 1)] ?? STEPS[0];
  const ring = open ? current.ring : null;

  // Advances on a timer whether or not the user has finished reading. No pause, no extend.
  useEffect(() => {
    if (!open || step >= STEPS.length - 1) return undefined;
    const timer = window.setTimeout(() => setStep((n) => n + 1), ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [open, step]);

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.muted}>Demo control:</span>
        <button
          type="button"
          className={s.btn}
          onClick={() => {
            setStep(0);
            setOpen(true);
          }}
        >
          Replay first visit
        </button>
      </div>
      <div className={s.toolbar}>
        <span className={s.spacer}>Workspace</span>
        <button type="button" className={ring === 'import' ? `${s.btn} ${s.coachRing}` : s.btn}>
          Import
        </button>
        <button type="button" className={ring === 'reports' ? `${s.btn} ${s.coachRing}` : s.btn}>
          Reports
        </button>
        <button type="button" className={s.btn}>
          Settings
        </button>
      </div>
      <div className={`${s.scroll} ${s.shortScroll}`}>
        <p className={s.muted}>No records yet.</p>
        <p className={s.muted}>Recent activity: none.</p>
        <p className={s.muted}>Team: just you.</p>
        <p className={s.muted}>Reports: none saved.</p>
        <p className={s.muted}>Notifications: defaults.</p>
        <p>
          {/* The tour rings this button, but it sits below the fold of its scroll area. */}
          <button type="button" className={ring === 'invite' ? `${s.btn} ${s.coachRing}` : s.btn} {...failureTarget('off-screen-target')}>
            Invite
          </button>
        </p>
      </div>

      {open && (
        <>
          <div className={s.coachDim} />
          {/* Rendered last, outside the tab order, with no role: focus and screen readers never reach it. */}
          <div className={s.coachMark} {...failureTarget('auto-advance')}>
            <span className={s.muted} {...failureTarget('screens-not-tasks')}>
              Step {step + 1} of {STEPS.length}
            </span>
            <p {...failureTarget('silent-steps')}>{current.text}</p>
            <div className={s.toolbar}>
              <span className={s.spacer}>
                <span className={s.fakeLink} onClick={() => setStep((n) => Math.min(n + 1, STEPS.length - 1))} {...failureTarget('unreachable-controls')}>
                  Next ›
                </span>
              </span>
              <span className={s.fakeLink} title="Close" onClick={() => setOpen(false)} {...failureTarget('no-way-back')}>
                ×
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
