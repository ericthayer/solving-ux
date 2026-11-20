import { useId, useRef, useState } from 'react';
import { EditableGrid } from './EditableGrid';
import type { GridColumn } from './EditableGrid';
import { useStressTest } from '../../stress';
import d from '../../demo.module.css';

type OrderLine = {
  id: string;
  customer: string;
  owner: string;
  status: string;
  quantity: number;
  updated: string;
};

const CUSTOMERS = ['Northwind Supply', 'Apex Industrial', 'Harbor Logistics', 'Summit Components', 'Bluefin Packaging', 'Granite Tooling'];
const OWNERS = ['Unassigned', 'A. Rivera', 'J. Chen', 'M. Okafor', 'S. Patel'] as const;
const STATUSES = ['Draft', 'Open', 'On hold', 'Closed'] as const;

const buildRows = (text: (value: string) => string): OrderLine[] =>
  Array.from({ length: 8 }, (_, i) => ({
    id: `PO-${(4100 + i * 7).toString()}`,
    customer: text(CUSTOMERS[i % CUSTOMERS.length] ?? 'Unknown'),
    owner: OWNERS[i % OWNERS.length] ?? 'Unassigned',
    status: STATUSES[i % STATUSES.length] ?? 'Draft',
    quantity: 40 + ((i * 37) % 400),
    updated: `Nov ${(10 + i).toString()}`,
  }));

const columns: GridColumn<OrderLine>[] = [
  { key: 'id', header: 'Order' },
  { key: 'customer', header: 'Customer', editor: { kind: 'text', required: true } },
  { key: 'owner', header: 'Owner', editor: { kind: 'select', options: OWNERS } },
  { key: 'status', header: 'Status', editor: { kind: 'select', options: STATUSES } },
  {
    key: 'quantity',
    header: 'Quantity',
    align: 'end',
    editor: { kind: 'number', integer: true, min: 1, max: 9999 },
    format: (row) => row.quantity.toLocaleString('en-US'),
    validate: (value, row) => (row.status === 'Closed' && Number(value) !== row.quantity ? 'Closed orders cannot change quantity.' : null),
  },
  { key: 'updated', header: 'Updated' },
];

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export default function EditableGridDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const [rows, setRows] = useState(() => buildRows(stress.text));
  const [failSaves, setFailSaves] = useState(false);
  const failRef = useRef(failSaves);
  failRef.current = failSaves;
  const toggleId = useId();

  // Stands in for a PATCH request: resolves after a delay, or rejects with a server message.
  const commit = async (rowId: string, key: keyof OrderLine, value: string): Promise<void> => {
    await wait(700);
    if (failRef.current) throw new Error('The server is not responding.');
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: key === 'quantity' ? Number(value) : value, updated: 'Just now' } : row)),
    );
  };

  return (
    <div className={d.stack}>
      <EditableGrid<OrderLine>
        caption={stress.text('Open orders')}
        rows={rows}
        columns={columns}
        rowLabel={(row) => `${row.id}, ${row.customer}`}
        onCommit={commit}
      />
      <p className={d.row}>
        <input id={toggleId} type="checkbox" checked={failSaves} onChange={(e) => setFailSaves(e.target.checked)} />
        <label htmlFor={toggleId}>Simulate failed saves</label>
      </p>
    </div>
  );
}
