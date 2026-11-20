import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Item = { id: string; label: string; children?: Item[] };

const MENU: Item[] = [
  { id: 'overview', label: 'Overview' },
  {
    id: 'customers',
    label: 'Customers',
    children: [
      { id: 'directory', label: 'Directory' },
      {
        id: 'relationships',
        label: 'Relationships',
        children: [
          { id: 'hierarchies', label: 'Entity hierarchies' },
          { id: 'spend', label: 'Spend', children: [{ id: 'by-industry', label: 'By industry' }, { id: 'by-region', label: 'By region' }] },
        ],
      },
    ],
  },
  { id: 'receiving', label: 'Receiving', children: [{ id: 'payments', label: 'Payments' }, { id: 'returns', label: 'Returns' }] },
  { id: 'reports', label: 'Reports' },
];

/** Breadcrumbs are authored per page, separately from the menu, and drift out of date. */
const CRUMBS: Record<string, string> = {
  'by-region': 'Home > Reports > Regional spend',
  'by-industry': 'Home > Customers > Spend',
  payments: 'Home > Payments',
};

function Flyout({ items, depth, onPick }: { items: Item[]; depth: number; onPick: (id: string) => void }): JSX.Element {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div className={depth === 1 ? s.menuDrop : s.menuSide} {...(depth === 2 ? failureTarget('offscreen-flyout') : {})}>
      {items.map((item) => (
        <div key={item.id} className={s.anchor} onMouseEnter={() => setHovered(item.id)} onMouseLeave={() => setHovered(null)}>
          <a className={s.menuItem} onClick={() => !item.children && onPick(item.id)}>
            {item.label} {item.children ? '›' : ''}
          </a>
          {item.children && hovered === item.id && <Flyout items={item.children} depth={depth + 1} onPick={onPick} />}
        </div>
      ))}
    </div>
  );
}

export default function NestedNavBefore(): JSX.Element {
  const [open, setOpen] = useState<string | null>(null);
  const [page, setPage] = useState('by-region');
  const pick = (id: string): void => {
    setPage(id);
    setOpen(null);
  };

  return (
    <div className={s.frame}>
      <div className={s.toolbar} {...failureTarget('state-reset')}>
        {MENU.map((item) => (
          <div key={item.id} className={s.anchor} onMouseEnter={() => setOpen(item.id)} onMouseLeave={() => setOpen(null)}>
            <a className={s.menuItem} onClick={() => !item.children && pick(item.id)} {...(item.id === 'customers' ? failureTarget('hover-only') : {})}>
              {item.label} {item.children ? '▾' : ''}
            </a>
            {item.children && open === item.id && (
              <Flyout items={item.children} depth={1} onPick={pick} />
            )}
          </div>
        ))}
      </div>
      <p className={s.muted} {...failureTarget('breadcrumb-mismatch')}>
        {CRUMBS[page] ?? 'Home'}
      </p>
      <p>Page content for {page}. Hover Customers, then Relationships, then Spend.</p>
    </div>
  );
}
