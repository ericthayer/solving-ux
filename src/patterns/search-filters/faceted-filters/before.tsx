import { useEffect, useRef, useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Order = { id: string; status: string; category: string };

const GROUPS = [
  { id: 'status', label: 'Status', options: ['Draft', 'Pending approval', 'Approved', 'Rejected'] },
  { id: 'category', label: 'Category', options: ['Office supplies', 'IT hardware', 'Software', 'Facilities'] },
] as const;

const ORDERS: Order[] = Array.from({ length: 120 }, (_, i) => ({
  id: `PO-${(24001 + i).toString()}`,
  status: GROUPS[0].options[(i * 3 + 1) % 4] ?? 'Draft',
  category: GROUPS[1].options[(i * 7) % 4] ?? 'Software',
}));

export default function FacetedFiltersBefore(): JSX.Element {
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Every change "posts back": focus drops to the top of the page and the groups collapse again.
  const change = (key: string, checked: boolean): void => {
    setSelected((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));
    (document.activeElement as HTMLElement | null)?.blur();
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setLoading(false);
      setExpanded([]);
    }, 700);
  };

  const results = ORDERS.filter((o) =>
    GROUPS.every((g) => {
      const picked = selected.filter((k) => k.startsWith(`${g.id}:`)).map((k) => k.slice(g.id.length + 1));
      return picked.length === 0 || picked.includes(g.id === 'status' ? o.status : o.category);
    }),
  );

  return (
    <div className={s.frame}>
      {loading && (
        <div className={s.overlay}>
          <div className={s.dialog}>Loading…</div>
        </div>
      )}
      <div className={s.toolbar} {...failureTarget('buried-applied')}>
        <strong>Filters</strong>
      </div>
      {GROUPS.map((g, gi) => {
        const open = expanded.includes(g.id);
        return (
          <div key={g.id} className={s.card}>
            <div
              className={s.cardTitle}
              onClick={() => setExpanded((prev) => (open ? prev.filter((x) => x !== g.id) : [...prev, g.id]))}
              {...(gi === 0 ? failureTarget('no-grouping') : {})}
            >
              {open ? '▼' : '►'} {g.label}
            </div>
            {open && (
              <div {...(gi === 0 ? failureTarget('reload-on-change') : {})}>
                {g.options.map((o) => {
                  const key = `${g.id}:${o}`;
                  return (
                    <div key={key}>
                      <input id={`before-${key}`} type="checkbox" checked={selected.includes(key)} onChange={(e) => change(key, e.target.checked)} />
                      <label htmlFor={`before-${key}`}>{o}</label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <p className={s.muted} {...failureTarget('silent-count')}>
        {results.length} records
      </p>
      <ul className={s.list}>
        {results.slice(0, 5).map((o) => (
          <li key={o.id}>
            {o.id} · {o.status} · {o.category}
          </li>
        ))}
      </ul>
      <a className={s.muted} onClick={() => setSelected([])} {...failureTarget('clear-all-far')}>
        clear all
      </a>
    </div>
  );
}
