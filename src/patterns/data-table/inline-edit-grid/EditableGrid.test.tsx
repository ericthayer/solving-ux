import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EditableGrid } from './EditableGrid';
import type { GridColumn } from './EditableGrid';
import { nextPosition, validateCell } from './gridModel';

expect.extend(toHaveNoViolations);

type Line = { id: string; customer: string; status: string; quantity: number; updated: string };

const seed: Line[] = [
  { id: 'L-1', customer: 'Alpha', status: 'Open', quantity: 10, updated: 'Mon' },
  { id: 'L-2', customer: 'Bravo', status: 'Closed', quantity: 20, updated: 'Tue' },
  { id: 'L-3', customer: 'Charlie', status: 'Open', quantity: 30, updated: 'Wed' },
];

const columns: GridColumn<Line>[] = [
  { key: 'id', header: 'Line' },
  { key: 'customer', header: 'Customer', editor: { kind: 'text', required: true } },
  { key: 'status', header: 'Status', editor: { kind: 'select', options: ['Open', 'Closed'] } },
  { key: 'quantity', header: 'Quantity', align: 'end', editor: { kind: 'number', integer: true, min: 1 } },
  { key: 'updated', header: 'Updated' },
];

type Commit = (rowId: string, key: keyof Line, value: string) => Promise<void>;

function Harness({ commit, rows = seed }: { commit: Commit; rows?: Line[] }): JSX.Element {
  const [data, setData] = useState(rows);
  return (
    <>
      <EditableGrid<Line>
        caption="Order lines"
        rows={data}
        columns={columns}
        rowLabel={(row) => row.id}
        onCommit={async (id, key, value) => {
          await commit(id, key, value);
          setData((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: key === 'quantity' ? Number(value) : value } : r)));
        }}
      />
      <button type="button">After grid</button>
    </>
  );
}

function setup(commit: Commit = () => Promise.resolve(), rows?: Line[]) {
  const user = userEvent.setup();
  const spy = jest.fn(commit);
  const utils = render(<Harness commit={spy} rows={rows} />);
  return { ...utils, user, spy };
}

const cell = (name: string): HTMLElement => screen.getByRole('gridcell', { name });
const status = (): HTMLElement => screen.getByRole('status');

describe('EditableGrid', () => {
  it('renders a named grid that is a single tab stop', async () => {
    const { user } = setup();
    expect(screen.getByRole('grid', { name: 'Order lines' })).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('rowheader', { name: 'L-1' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After grid' })).toHaveFocus();
  });

  it('moves between cells with arrow keys, Home and End', async () => {
    const { user } = setup();
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(cell('Bravo')).toHaveFocus();
    await user.keyboard('{End}');
    expect(cell('Tue')).toHaveFocus();
    await user.keyboard('{Control>}{Home}{/Control}');
    expect(screen.getByRole('rowheader', { name: 'L-1' })).toHaveFocus();
  });

  it('edits with Enter, saves, and announces the result', async () => {
    const { user, spy } = setup();
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{Enter}');
    const editor = screen.getByRole('textbox', { name: 'Quantity, L-1' });
    expect(editor).toHaveFocus();
    await user.keyboard('25{Enter}');
    expect(spy).toHaveBeenCalledWith('L-1', 'quantity', '25');
    await waitFor(() => expect(status()).toHaveTextContent('Saved Quantity for L-1.'));
    expect(cell('25 Saved')).toHaveFocus();
  });

  it('starts editing by typing, and Escape cancels without saving', async () => {
    const { user, spy } = setup();
    await user.tab();
    await user.keyboard('{ArrowRight}Z');
    expect(screen.getByRole('textbox', { name: 'Customer, L-1' })).toHaveValue('Z');
    await user.keyboard('{Escape}');
    expect(cell('Alpha')).toHaveFocus();
    expect(status()).toHaveTextContent('Edit canceled.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows validation errors as text tied to the editor', async () => {
    const { user, spy } = setup();
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{F2}');
    await user.keyboard('{Control>}a{/Control}12x{Enter}');
    const editor = screen.getByRole('textbox', { name: 'Quantity, L-1' });
    expect(editor).toHaveAttribute('aria-invalid', 'true');
    expect(editor).toHaveAccessibleDescription(/Quantity must be a number\./);
    expect(status()).toHaveTextContent('Quantity must be a number.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('keeps a failed value on screen and retries with Enter (edge case)', async () => {
    let fail = true;
    const { user, spy } = setup(() => (fail ? Promise.reject(new Error('Server down.')) : Promise.resolve()));
    await user.tab();
    await user.keyboard('{ArrowRight}{Enter}{Control>}a{/Control}Delta{Enter}');
    await waitFor(() => expect(status()).toHaveTextContent("Couldn't save Customer for L-1. Server down. Press Enter on the cell to retry."));
    expect(screen.getByText(/Not saved\. Server down\./).closest('td')).toHaveFocus();
    expect(screen.getByText('Delta')).toBeInTheDocument();
    fail = false;
    await user.keyboard('{Enter}');
    expect(screen.getByRole('textbox', { name: 'Customer, L-1' })).toHaveValue('Delta');
    await user.keyboard('{Enter}');
    expect(spy).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(status()).toHaveTextContent('Saved Customer for L-1.'));
  });

  it('announces read-only cells instead of ignoring Enter', async () => {
    const { user } = setup();
    await user.tab();
    await user.keyboard('{End}{Enter}');
    expect(cell('Mon')).toHaveAttribute('aria-readonly', 'true');
    expect(status()).toHaveTextContent('Updated is read only.');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('Tab from an editor saves and leaves the grid; no keyboard trap (edge case)', async () => {
    const { user, spy } = setup();
    await user.tab();
    await user.keyboard('{ArrowRight}{Enter}{Control>}a{/Control}Echo');
    await user.tab();
    expect(screen.getByRole('button', { name: 'After grid' })).toHaveFocus();
    expect(spy).toHaveBeenCalledWith('L-1', 'customer', 'Echo');
  });

  it('keeps an invalid draft open and refuses to replace it (edge case)', async () => {
    const { user } = setup();
    await user.tab();
    await user.keyboard('{ArrowRight}{Enter}{Control>}a{/Control}{Backspace}');
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Customer, L-1' })).toHaveAttribute('aria-invalid', 'true');
    act(() => cell('Bravo').focus());
    await user.keyboard('{Enter}');
    expect(screen.getByRole('textbox', { name: 'Customer, L-1' })).toHaveFocus();
    expect(status()).toHaveTextContent('Finish or cancel the open edit first.');
  });

  it('runs column rules that depend on the row', () => {
    expect(validateCell({ kind: 'select', options: ['Open'] }, 'Nope', 'Status')).toBe('Choose one of: Open.');
    expect(validateCell({ kind: 'number', max: 5 }, '9', 'Qty')).toBe('Qty must be 5 or less.');
    expect(validateCell({ kind: 'text' }, '', 'Note')).toBeNull();
  });

  it('clamps navigation at the edges and ignores other keys (edge case)', () => {
    expect(nextPosition('ArrowUp', false, { row: 0, col: 0 }, 3, 5)).toEqual({ row: 0, col: 0 });
    expect(nextPosition('End', true, { row: 0, col: 0 }, 3, 5)).toEqual({ row: 2, col: 4 });
    expect(nextPosition('Tab', false, { row: 0, col: 0 }, 3, 5)).toBeNull();
  });

  it('handles an empty data set (edge case)', () => {
    setup(undefined, []);
    expect(screen.getByText('No rows to edit.')).toBeInTheDocument();
  });

  it('has no axe violations, including while editing with an error', async () => {
    const { container, user } = setup();
    expect(await axe(container)).toHaveNoViolations();
    await user.tab();
    await user.keyboard('{ArrowRight}{Enter}{Control>}a{/Control}{Backspace}{Enter}');
    expect(await axe(container)).toHaveNoViolations();
  });
});
