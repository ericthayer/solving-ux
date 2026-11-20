import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Row = { id: string; customer: string; status: string; quantity: string; updated: string };
type Field = 'customer' | 'status' | 'quantity';

const FIELDS: Field[] = ['customer', 'status', 'quantity'];
const CUSTOMERS = ['Northwind Supply', 'Apex Industrial', 'Harbor Logistics', 'Summit Components', 'Bluefin Packaging', 'Granite Tooling'];

const seed: Row[] = Array.from({ length: 6 }, (_, i) => ({
  id: `PO-${(4100 + i * 7).toString()}`,
  customer: CUSTOMERS[i] ?? 'Unknown',
  status: ['Draft', 'Open', 'On hold'][i % 3] ?? 'Draft',
  // Row 2 was saved with a bad value; the grid only paints its border red.
  quantity: i === 1 ? '12x' : String(40 + ((i * 37) % 400)),
  updated: `Nov ${(10 + i).toString()}`,
}));

export default function EditableGridBefore(): JSX.Element {
  const [rows, setRows] = useState(seed);
  const [hover, setHover] = useState<{ row: number; field: Field } | null>(null);

  // Saves silently on every keystroke and blur. A failed request would vanish the same way.
  const write = (index: number, field: Field, value: string): void =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  // Tab cycles between the row's inputs forever; there is no way out except the mouse.
  const trapTab = (event: KeyboardEvent<HTMLInputElement>, index: number, field: Field): void => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const next = FIELDS[(FIELDS.indexOf(field) + 1) % FIELDS.length] ?? 'customer';
    setHover({ row: index, field: next });
  };

  const cell = (row: Row, index: number, field: Field, extra: Record<string, string> = {}): JSX.Element => {
    const invalid = field === 'quantity' && !/^\d+$/.test(row.quantity);
    const editing = hover?.row === index && hover.field === field;
    return (
      <td onMouseEnter={() => setHover({ row: index, field })} {...extra}>
        {editing || invalid ? (
          <input
            className={invalid ? s.inputError : s.input}
            value={row[field]}
            autoFocus={editing}
            onChange={(e) => write(index, field, e.target.value)}
            onKeyDown={(e) => trapTab(e, index, field)}
            {...(invalid ? failureTarget('color-only-error') : {})}
          />
        ) : (
          row[field]
        )}
      </td>
    );
  };

  return (
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.spacer}>Open orders · hover a cell to edit</span>
      </div>
      <div className={s.scroll} {...failureTarget('tab-trap')}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Qty</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody {...failureTarget('silent-save')}>
            {rows.map((row, i) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                {cell(row, i, 'customer', i === 0 ? failureTarget('hover-to-edit') : {})}
                {cell(row, i, 'status')}
                {cell(row, i, 'quantity')}
                <td {...(i === 0 ? failureTarget('readonly-unmarked') : {})}>{row.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
