import { useMemo, useState } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Supplier = { id: number; label: string };

const PREFIXES = ['Cedar', 'North', 'Blue', 'Prairie', 'River', 'Sand', 'High', 'Golden', 'Willow', 'Stone', 'Elk', 'Clear'];
const MIDDLES = ['Ridge', 'Plains', 'Mesa', 'Valley', 'Bend', 'Hill', 'Creek', 'Point', 'Field', 'Lake'];
const SUFFIXES = ['Supply', 'Industrial', 'Logistics', 'Components', 'Packaging', 'Tooling', 'Metals', 'Systems'];

function buildSuppliers(): Supplier[] {
  const list: Supplier[] = [];
  for (const p of PREFIXES) for (const m of MIDDLES) for (const x of SUFFIXES) list.push({ id: 10000 + ((list.length * 7919) % 9000), label: `${p} ${m} ${x}` });
  return list;
}

export default function TypeaheadBefore(): JSX.Element {
  const suppliers = useMemo(buildSuppliers, []);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('Nothing selected.');

  // Substring match over the whole list, sorted by account id, never capped.
  const q = query.trim().toLowerCase();
  const matches = q ? suppliers.filter((b) => b.label.toLowerCase().includes(q)).sort((a, b) => a.id - b.id) : [];

  return (
    <div className={s.frame}>
      <div className={s.field}>
        <label htmlFor="before-supplier">Supplier</label>
        <input
          id="before-supplier"
          className={s.input}
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          // Closes slightly before a slow click lands, so option clicks fail intermittently.
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          {...failureTarget('no-combobox-roles')}
        />
      </div>
      {open && q && (
        <div className={`${s.scroll} ${s.anchor}`} {...failureTarget('no-count')}>
          <ul className={s.list} {...failureTarget('renders-everything')}>
            {matches.map((b, i) => (
              <li key={b.id} {...(i === 0 ? failureTarget('id-sort') : {})}>
                <a
                  className={s.menuItem}
                  onClick={() => {
                    setSelected(`Selected ${b.label} (ACCT ${b.id.toString()}).`);
                    setQuery(b.label);
                    setOpen(false);
                  }}
                  {...(i === 0 ? failureTarget('blur-race') : {})}
                >
                  {b.id} · {b.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className={s.muted}>{selected}</p>
    </div>
  );
}
