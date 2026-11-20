import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';
import { WORK_ORDERS } from './demo';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
export default function SidePanelBefore(): JSX.Element {
  const [openId, setOpenId] = useState<string | null>(null);
  // Closing re-creates the list, which throws away its scroll position.
  const [listKey, setListKey] = useState(0);
  const record = WORK_ORDERS.find((o) => o.id === openId);

  const close = (): void => {
    setOpenId(null);
    setListKey((k) => k + 1);
  };

  return (
    <div className={s.frame}>
      <p className={s.muted}>Scroll the list, open a work order, then press Tab or Escape.</p>
      <div key={listKey} className={`${s.scroll} ${s.panelListScroll}`} {...failureTarget('place-lost')}>
        <table className={s.table} {...failureTarget('focus-left-behind')}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Task</th>
              <th>Site</th>
            </tr>
          </thead>
          <tbody>
            {WORK_ORDERS.map((o) => (
              <tr key={o.id}>
                <td>
                  <button type="button" className={s.btn} onClick={() => setOpenId(o.id)}>
                    {o.id}
                  </button>
                </td>
                <td>{o.title}</td>
                <td>{o.site}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {record && (
        <div className={s.slideOver} {...failureTarget('covers-list')}>
          <div className={s.slideOverHeader} {...failureTarget('no-escape')}>
            <span>{record.id}</span>
            <span className={s.iconClose} onClick={close} {...failureTarget('mouse-only-close')}>
              ×
            </span>
          </div>
          <div className={s.slideOverBody} {...failureTarget('fixed-width')}>
            <b>{record.title}</b>
            <span>Site: {record.site}</span>
            <span>Owner: {record.owner}</span>
            <span>Due: {record.due}</span>
          </div>
        </div>
      )}
    </div>
  );
}
