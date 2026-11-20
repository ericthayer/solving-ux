import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Person = { id: string; label: string };

const FIRST = ['Avery', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Quinn', 'Reese', 'Skyler', 'Rowan', 'Emerson', 'Harper'];
const LAST = ['Patel', 'Nguyen', 'Garcia', 'Okafor', 'Lindqvist', 'Moreau', 'Kim', 'Haddad', 'Silva', 'Novak'];

// Sorted by internal id, so names land in no order a person would recognize.
const PEOPLE: Person[] = Array.from({ length: 48 }, (_, i) => ({
  id: `U${(1000 + ((i * 37) % 48)).toString()}`,
  label: `${LAST[Math.floor(i / FIRST.length) % LAST.length] ?? 'Patel'}, ${FIRST[i % FIRST.length] ?? 'Avery'}`,
})).sort((a, b) => a.id.localeCompare(b.id));

const picked = (event: ChangeEvent<HTMLSelectElement>): string[] => Array.from(event.target.selectedOptions, (o) => o.value);

export default function TransferListBefore(): JSX.Element {
  const [assigned, setAssigned] = useState<string[]>(['U1002', 'U1005', 'U1013']);
  const [left, setLeft] = useState<string[]>([]);
  const [right, setRight] = useState<string[]>([]);

  const available = PEOPLE.filter((p) => !assigned.includes(p.id));
  const members = PEOPLE.filter((p) => assigned.includes(p.id));

  return (
    <div className={s.frame}>
      <p className={s.cardTitle}>Reviewer role members</p>
      <div className={s.transferRow} {...failureTarget('fixed-width')}>
        <div className={s.field} {...failureTarget('no-filter')}>
          <span>Available</span>
          <select multiple size={12} className={s.multiSelect} value={left} onChange={(e) => setLeft(picked(e))} {...failureTarget('ctrl-click')}>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className={s.btnStack} {...failureTarget('unlabelled-arrows')}>
          <button type="button" className={s.btn} onClick={() => {
              setAssigned((a) => [...a, ...left]);
              setLeft([]);
            }}>
            &gt;
          </button>
          <button type="button" className={s.btn} onClick={() => setAssigned(PEOPLE.map((p) => p.id))}>
            &gt;&gt;
          </button>
          <button type="button" className={s.btn} onClick={() => {
              setAssigned((a) => a.filter((id) => !right.includes(id)));
              setRight([]);
            }}>
            &lt;
          </button>
          <button type="button" className={s.btn} onClick={() => setAssigned([])} {...failureTarget('move-all-no-undo')}>
            &lt;&lt;
          </button>
        </div>
        <div className={s.field}>
          <span>Assigned</span>
          <select multiple size={12} className={s.multiSelect} value={right} onChange={(e) => setRight(picked(e))} {...failureTarget('silent-move')}>
            {members.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className={s.muted}>Hold Ctrl to select multiple.</p>
    </div>
  );
}
