import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Node = { id: string; label: string; children?: Node[]; lazy?: boolean };

const TREE: Node[] = [
  {
    id: 'north',
    label: 'North region',
    children: [
      { id: 'north-ops', label: 'Operations', children: [{ id: 'a1', label: 'Cedar Supply Co.' }, { id: 'a2', label: 'Harbor Logistics' }] },
      { id: 'north-sales', label: 'Field sales', children: [{ id: 'a3', label: 'Bluefin Packaging' }] },
    ],
  },
  { id: 'south', label: 'South region', children: [{ id: 'a4', label: 'Apex Industrial' }, { id: 'a5', label: 'Riverbend Foods' }] },
  { id: 'archived', label: 'Archived accounts', lazy: true },
];

export default function TreeViewBefore(): JSX.Element {
  const [open, setOpen] = useState<Set<string>>(new Set(['north']));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [spinning, setSpinning] = useState(false);

  const flip = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const renderNodes = (list: Node[]): JSX.Element[] =>
    list.map((node) => (
      <div key={node.id} {...(node.id === 'north' ? failureTarget('div-tree') : {})}>
        <div className={s.menuItem} {...(node.id === 'south' ? failureTarget('no-keyboard') : {})}>
          {node.children || node.lazy ? (
            <span
              onClick={() => {
                setOpen((o) => flip(o, node.id));
                if (node.lazy) setSpinning(true);
              }}
              {...(node.id === 'north' ? failureTarget('icon-only-state') : {})}
            >
              {open.has(node.id) ? '▾' : '▸'}
            </span>
          ) : (
            <span>&nbsp;&nbsp;</span>
          )}{' '}
          {/* Checking a parent only flags the parent; children keep their own state and nothing shows a partial selection. */}
          <input
            type="checkbox"
            checked={checked.has(node.id)}
            onChange={() => setChecked((c) => flip(c, node.id))}
            {...(node.id === 'north-ops' ? failureTarget('parent-select') : {})}
          />{' '}
          {node.label}
        </div>
        {open.has(node.id) && node.children && <div className={s.indent}>{renderNodes(node.children)}</div>}
        {open.has(node.id) && node.lazy && spinning && (
          <div className={`${s.indent} ${s.muted}`} {...failureTarget('silent-loading')}>
            <span className={s.tinyArrow}>◌</span>
          </div>
        )}
      </div>
    ));

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.spacer}>Account hierarchy</span>
        <span className={s.muted}>{checked.size} checked</span>
      </div>
      <div className={s.scroll}>{renderNodes(TREE)}</div>
    </div>
  );
}
