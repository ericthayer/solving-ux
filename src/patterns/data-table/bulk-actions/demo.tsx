import { useState } from 'react';
import { BulkActionTable } from './BulkActionTable';
import type { Column } from './BulkActionTable';

type LoanApplication = {
  id: string;
  borrower: string;
  region: string;
  status: 'Submitted' | 'In review' | 'Approved';
  amount: number;
};

const BORROWERS = ['Cedar Ridge Farms', 'North Plains Co-op', 'Halvorsen Dairy', 'Blue Mesa Grain', 'Riverbend Orchards', 'Sandhill Cattle'];
const REGIONS = ['Midwest', 'Plains', 'Northwest', 'Southeast'];
const STATUSES: LoanApplication['status'][] = ['Submitted', 'In review', 'Approved'];

const initialRows: LoanApplication[] = Array.from({ length: 27 }, (_, i) => ({
  id: `APP-${(4100 + i * 7).toString()}`,
  borrower: BORROWERS[i % BORROWERS.length] ?? 'Unknown',
  region: REGIONS[i % REGIONS.length] ?? 'Unknown',
  status: STATUSES[i % STATUSES.length] ?? 'Submitted',
  amount: 125000 + ((i * 48271) % 900000),
}));

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const columns: Column<LoanApplication>[] = [
  { key: 'id', header: 'Application', sortable: true },
  { key: 'borrower', header: 'Borrower', sortable: true },
  { key: 'region', header: 'Region', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'amount', header: 'Requested', sortable: true, align: 'end', render: (row) => currency.format(row.amount) },
];

export default function BulkActionTableDemo(): JSX.Element {
  const [rows, setRows] = useState(initialRows);

  const setStatus = (ids: string[], status: LoanApplication['status']): void =>
    setRows((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, status } : row)));

  return (
    <BulkActionTable<LoanApplication>
      caption="Loan applications"
      rows={rows}
      columns={columns}
      rowLabel={(row) => `${row.id}, ${row.borrower}`}
      pageSize={8}
      bulkActions={[
        { id: 'review', label: 'Move to review', onSelect: (ids) => setStatus(ids, 'In review') },
        { id: 'approve', label: 'Approve', onSelect: (ids) => setStatus(ids, 'Approved') },
        {
          id: 'withdraw',
          label: 'Withdraw',
          tone: 'danger',
          onSelect: (ids) => setRows((prev) => prev.filter((row) => !ids.includes(row.id))),
        },
      ]}
    />
  );
}
