import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BulkActionTable } from './BulkActionTable';
import type { Column } from './BulkActionTable';

expect.extend(toHaveNoViolations);

type Loan = { id: string; borrower: string; amount: number };

const rows: Loan[] = Array.from({ length: 12 }, (_, i) => ({
  id: `L-${100 + i}`,
  borrower: `Borrower ${String.fromCharCode(76 - i)}`,
  amount: (i + 1) * 1000,
}));

const columns: Column<Loan>[] = [
  { key: 'id', header: 'Loan', sortable: true },
  { key: 'borrower', header: 'Borrower', sortable: true },
  { key: 'amount', header: 'Amount', sortable: true, align: 'end' },
];

function setup(overrides: Partial<Parameters<typeof BulkActionTable<Loan>>[0]> = {}) {
  const onArchive = jest.fn();
  const user = userEvent.setup();
  const utils = render(
    <BulkActionTable<Loan>
      caption="Loan applications"
      rows={rows}
      columns={columns}
      rowLabel={(row) => row.id}
      pageSize={5}
      bulkActions={[{ id: 'archive', label: 'Archive', onSelect: onArchive }]}
      {...overrides}
    />,
  );
  return { ...utils, user, onArchive };
}

describe('BulkActionTable', () => {
  it('renders a captioned table with the first page of rows', () => {
    setup();
    const table = screen.getByRole('table', { name: 'Loan applications' });
    // 1 header row + 5 body rows
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    expect(screen.getByText('1–5 of 12')).toBeInTheDocument();
  });

  it('sorts by a column and exposes aria-sort', async () => {
    const { user } = setup();
    const header = screen.getByRole('columnheader', { name: /amount/i });
    expect(header).toHaveAttribute('aria-sort', 'none');

    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getAllByRole('rowheader')[0]).toHaveTextContent('L-111');
    expect(screen.getByRole('status')).toHaveTextContent('Sorted by Amount, descending.');
  });

  it('selects rows and runs a bulk action using only the keyboard', async () => {
    const { user, onArchive } = setup();
    screen.getByRole('checkbox', { name: 'Select L-100' }).focus();
    await user.keyboard(' ');
    await user.tab();
    await user.keyboard(' ');

    expect(screen.getByRole('status')).toHaveTextContent('2 of 12 rows selected.');
    await user.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onArchive).toHaveBeenCalledWith(['L-100', 'L-101']);
    expect(screen.getByRole('status')).toHaveTextContent('Archive applied to 2 rows.');
    expect(screen.getByText('Select rows to apply bulk actions.')).toBeInTheDocument();
  });

  it('marks the select-all checkbox indeterminate for a partial page selection', async () => {
    const { user } = setup();
    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows on this page' }) as HTMLInputElement;
    await user.click(screen.getByRole('checkbox', { name: 'Select L-102' }));
    expect(selectAll.indeterminate).toBe(true);

    await user.click(selectAll);
    expect(selectAll).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Select all 12 rows' }));
    expect(screen.getByRole('status')).toHaveTextContent('12 of 12 rows selected.');
  });

  it('paginates and disables boundary buttons', async () => {
    const { user } = setup();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('handles an empty data set (edge case)', () => {
    setup({ rows: [] });
    expect(screen.getByText('No rows to display.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select all rows on this page' })).toBeDisabled();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('drops selections for rows removed by the parent (edge case)', async () => {
    const { user, rerender } = setup();
    await user.click(screen.getByRole('checkbox', { name: 'Select L-100' }));
    rerender(
      <BulkActionTable<Loan>
        caption="Loan applications"
        rows={rows.slice(1)}
        columns={columns}
        rowLabel={(row) => row.id}
        pageSize={5}
        bulkActions={[]}
      />,
    );
    expect(screen.getByText('Select rows to apply bulk actions.')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
