import { useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Row = { id: string; supplier: string; region: string; status: string; amount: number };

const SUPPLIERS = ['Northwind Supply', 'Apex Industrial', 'Harbor Logistics', 'Summit Components', 'Bluefin Packaging', 'Granite Tooling'];
const REGIONS = ['Midwest', 'Plains', 'Northwest', 'Southeast'];
const EXTRA = ['Buyer', 'Site', 'Category', 'Terms', 'Due date', 'Incoterms', 'Risk', 'Contract', 'Updated'];
const PAGE_SIZE = 8;

const seed: Row[] = Array.from({ length: 27 }, (_, i) => ({
  id: `PO-${(4100 + i * 7).toString()}`,
  supplier: SUPPLIERS[i % SUPPLIERS.length] ?? 'Unknown',
  region: REGIONS[i % REGIONS.length] ?? 'Unknown',
  status: ['Submitted', 'In review', 'Approved'][i % 3] ?? 'Submitted',
  amount: 125000 + ((i * 48271) % 900000),
}));

export default function BulkActionTableBefore(): JSX.Element {
  const [rows, setRows] = useState(seed);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [asc, setAsc] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const sorted = [...rows].sort((a, b) => (asc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)));
  const pageRows = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const toggle = (id: string): void =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const apply = (fn: (ids: Set<string>) => void): void => {
    fn(selected);
    setSelected(new Set());
    setMenuOpen(false);
  };

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.spacer}>Purchase orders</span>
        <span className={s.anchor}>
          <button type="button" className={s.btn} onClick={() => setMenuOpen((o) => !o)} {...failureTarget('selection-count')}>
            More actions ▾
          </button>
          {menuOpen && (
            <span className={s.menuBelow}>
              <button type="button" className={s.btn} onClick={() => apply((ids) => setRows((r) => r.map((x) => (ids.has(x.id) ? { ...x, status: 'Approved' } : x))))}>
                Approve
              </button>
              <button type="button" className={s.btn} onClick={() => apply((ids) => setRows((r) => r.filter((x) => !ids.has(x.id))))}>
                Withdraw
              </button>
            </span>
          )}
        </span>
      </div>
      <div className={s.scroll} {...failureTarget('frozen-column')}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                  {...failureTarget('select-all-scope')}
                />
              </th>
              <th onClick={() => setAsc((v) => !v)}>
                Application<span className={s.tinyArrow} {...failureTarget('sort-state')}>{asc ? '▲' : '▼'}</span>
              </th>
              <th>Supplier</th>
              <th>Region</th>
              <th>Status</th>
              <th>Total</th>
              {EXTRA.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={row.id}>
                <td>
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} {...(i === 0 ? failureTarget('checkbox-names') : {})} />
                </td>
                <td>{row.id}</td>
                <td>{row.supplier}</td>
                <td>{row.region}</td>
                <td>{row.status}</td>
                <td>${row.amount.toLocaleString('en-US')}</td>
                {EXTRA.map((h) => (
                  <td key={h} className={s.muted}>
                    —
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={s.toolbar}>
        {Array.from({ length: pages }, (_, p) => (
          <button key={p} type="button" className={p === page ? s.btnPrimary : s.btn} onClick={() => setPage(p)}>
            {p + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
