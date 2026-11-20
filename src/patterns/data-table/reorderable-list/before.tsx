import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const SEED = ['Quarterly review', 'Budget check-in', 'Hiring plan', 'Vendor renewals', 'Roadmap update', 'Open questions'];

export default function ReorderableListBefore(): JSX.Element {
  const [items, setItems] = useState(SEED);
  const [dragging, setDragging] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);

  const drop = (to: number): void => {
    if (dragging === null || dragging === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragging, 1);
      if (moved !== undefined) next.splice(to, 0, moved);
      return next;
    });
    setDragging(null);
    setChanged(true);
  };

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.spacer}>Agenda</span>
        <span className={s.muted} {...failureTarget('drag-only')}>
          Drag rows to reorder
        </span>
        {changed && (
          <span className={s.muted} {...failureTarget('silent-move')}>
            order changed
          </span>
        )}
      </div>
      <div className={s.list} {...failureTarget('div-rows')}>
        {items.map((item, i) => (
          <div
            key={item}
            className={s.card}
            draggable
            onDragStart={() => setDragging(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(i)}
          >
            <span className={s.tinyArrow} {...(i === 0 ? failureTarget('tiny-handle') : {})}>
              ⠿
            </span>{' '}
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
