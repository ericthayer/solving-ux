import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Item = { id: number; text: string; read: boolean };

const SEED: Item[] = [
  { id: 1, text: 'Invoice INV-2048 approved', read: false },
  { id: 2, text: 'Contract renewal due in 5 days', read: false },
  { id: 3, text: 'Weekly usage report generated', read: true },
  { id: 4, text: 'Access request from Sam Patel', read: false },
  { id: 5, text: 'Password expires in 14 days', read: true },
];

export default function NotificationCenterBefore(): JSX.Element {
  const [items, setItems] = useState(SEED);
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState('');
  const hasUnread = items.some((i) => !i.read);

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <button
          type="button"
          className={s.btn}
          onClick={() => setItems((list) => [{ id: list.length + 1, text: 'Export ready: Q3 vendor spend', read: false }, ...list])}
        >
          Simulate new notification
        </button>
        <span className={s.spacer} />
        {/* New items only flip the dot; nothing is announced. */}
        <span className={s.anchor} {...failureTarget('silent-arrival')}>
          {/* A div with an icon: not focusable, no role, no name, no count. */}
          <div className={s.btn} onClick={() => setOpen((o) => !o)} {...failureTarget('unnamed-bell')}>
            <span aria-hidden="true">&#128276;</span>
            {hasUnread && <span className={s.error} {...failureTarget('dot-without-count')}>&#9679;</span>}
          </div>
        </span>
      </div>
      <p className={s.muted}>Click the bell. There is no way to open it from the keyboard. {log}</p>
      <div className={s.spacer} />
      {/* Rendered at the end of the frame, far from the bell in DOM order, with no focus handling. */}
      {open && (
        <div className={s.card} {...failureTarget('panel-focus-order')}>
          <ul className={s.list} {...failureTarget('no-item-actions')}>
            {items.map((item) => (
              // Read state is font weight only; rows are clickable divs with no actions.
              <li key={item.id}>
                <div
                  className={item.read ? s.menuItem : s.menuItemBold}
                  onClick={() => {
                    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
                    setLog(`Navigated away to "${item.text}".`);
                  }}
                  {...(item.read ? {} : failureTarget('read-state-visual'))}
                >
                  {item.text}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
