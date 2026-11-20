import { useState } from 'react';
import { BulkActionTable } from './BulkActionTable';
import type { Column } from './BulkActionTable';
import { LARGE_DATA_COUNT, useStressTest } from '../../stress';

type OrderApplication = {
  id: string;
  supplier: string;
  region: string;
  status: 'Submitted' | 'In review' | 'Approved';
  amount: number;
};

const SUPPLIERS = ['Northwind Supply', 'Apex Industrial', 'Harbor Logistics', 'Summit Components', 'Bluefin Packaging', 'Granite Tooling'];
const REGIONS = ['Midwest', 'Plains', 'Northwest', 'Southeast'];
const STATUSES: OrderApplication['status'][] = ['Submitted', 'In review', 'Approved'];

const buildRows = (count: number, text: (value: string) => string): OrderApplication[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `PO-${(4100 + i * 7).toString()}`,
    supplier: text(SUPPLIERS[i % SUPPLIERS.length] ?? 'Unknown'),
    region: REGIONS[i % REGIONS.length] ?? 'Unknown',
    status: STATUSES[i % STATUSES.length] ?? 'Submitted',
    amount: 125000 + ((i * 48271) % 900000),
  }));

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const columns: Column<OrderApplication>[] = [
  { key: 'id', header: 'Application', sortable: true },
  { key: 'supplier', header: 'Supplier', sortable: true },
  { key: 'region', header: 'Region', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'amount', header: 'Total', sortable: true, align: 'end', render: (row) => currency.format(row.amount) },
];

export default function BulkActionTableDemo(): JSX.Element {
  const stress = useStressTest(['longText', 'largeData']);
  const [rows, setRows] = useState(() => buildRows(stress.largeData ? LARGE_DATA_COUNT : 27, stress.text));

  // Sets keep bulk actions O(n) when all 10,000 rows are selected.
  const setStatus = (ids: string[], status: OrderApplication['status']): void => {
    const targets = new Set(ids);
    setRows((prev) => prev.map((row) => (targets.has(row.id) ? { ...row, status } : row)));
  };

  return (
    <BulkActionTable<OrderApplication>
      caption={stress.text('Purchase orders')}
      rows={rows}
      columns={columns}
      rowLabel={(row) => `${row.id}, ${row.supplier}`}
      pageSize={8}
      bulkActions={[
        { id: 'review', label: 'Move to review', onSelect: (ids) => setStatus(ids, 'In review') },
        { id: 'approve', label: 'Approve', onSelect: (ids) => setStatus(ids, 'Approved') },
        {
          id: 'withdraw',
          label: 'Withdraw',
          tone: 'danger',
          onSelect: (ids) => {
            const targets = new Set(ids);
            setRows((prev) => prev.filter((row) => !targets.has(row.id)));
          },
        },
      ]}
    />
  );
}
