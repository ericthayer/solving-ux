import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const COMMANDS = [
  { key: 'n', label: 'New purchase order' },
  { key: 'o', label: 'Go to orders' },
  { key: 's', label: 'Go to suppliers' },
  { key: 'r', label: 'Go to reports' },
  { key: 'e', label: 'Export current view' },
  { key: 'd', label: 'Toggle compact rows' },
  { key: '', label: 'Go to invoices' },
  { key: '', label: 'Go to settings' },
  { key: '', label: 'Invite a teammate' },
];

export default function CommandPaletteBefore(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [ran, setRan] = useState<string[]>([]);

  // Keeps every accidental run visible, so typing one word shows the damage.
  const run = (label: string): void => setRan((r) => [...r, label].slice(-6));

  // Listens on the whole frame and ignores where focus is: letters typed into fields run commands too.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    const hit = COMMANDS.find((c) => c.key && c.key === e.key.toLowerCase());
    if (hit) run(hit.label);
  };

  const q = query.trim().toLowerCase();
  const results = COMMANDS.filter((c) => c.label.toLowerCase().includes(q));

  return (
    <div className={s.frame} onKeyDown={onKeyDown}>
      <div className={s.toolbar}>
        <span className={s.menuItem} onClick={() => setOpen(true)} {...failureTarget('icon-trigger')}>
          &#x2315;
        </span>
        <span className={s.spacer} />
        <span className={s.muted} title="Shortcuts: N new, O orders, S suppliers, R reports, E export, D density" {...failureTarget('no-shortcut-list')}>
          (?)
        </span>
      </div>
      <div className={s.field}>
        <label htmlFor="before-cp-notes">Notes</label>
        <input id="before-cp-notes" className={s.input} autoComplete="off" {...failureTarget('char-shortcuts-unscoped')} />
      </div>
      <p className={s.muted} aria-live="polite">
        {ran.length ? `Ran ${ran.join(', ')}.` : 'No command run yet.'}
      </p>

      {open && (
        <div className={s.overlay} {...failureTarget('no-focus-return')}>
          <div className={s.dialog}>
            <input
              className={s.input}
              placeholder="Search…"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              {...failureTarget('div-palette')}
            />
            <div className={s.list}>
              {results.map((c) => (
                <div
                  key={c.label}
                  className={s.menuItem}
                  onClick={() => {
                    run(c.label);
                    setQuery('');
                    setOpen(false);
                  }}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
