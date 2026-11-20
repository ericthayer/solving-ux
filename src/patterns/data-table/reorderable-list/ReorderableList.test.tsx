import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReorderableList, moveItem } from './ReorderableList';

expect.extend(toHaveNoViolations);

type Item = { id: string; title: string };

const ITEMS: Item[] = ['Quarterly review', 'Budget check-in', 'Hiring plan', 'Vendor renewals'].map((title, i) => ({ id: `item-${i}`, title }));

function Harness({ initial = ITEMS, onReorder }: { initial?: Item[]; onReorder?: (items: Item[]) => void }): JSX.Element {
  const [items, setItems] = useState(initial);
  return (
    <ReorderableList<Item>
      label="Meeting agenda"
      items={items}
      itemLabel={(item) => item.title}
      onReorder={(next) => {
        setItems(next);
        onReorder?.(next);
      }}
    />
  );
}

const order = (): string[] => within(screen.getByRole('list', { name: 'Meeting agenda' })).getAllByRole('listitem').map((li) => li.textContent ?? '');

describe('moveItem', () => {
  it('moves, clamps the target, and ignores a bad source index', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, -5)).toEqual(['c', 'a', 'b']);
    expect(moveItem(['a', 'b'], 7, 0)).toEqual(['a', 'b']);
  });
});

describe('ReorderableList', () => {
  it('renders a named ordered list with named controls for every item', () => {
    render(<Harness />);
    expect(screen.getByRole('list', { name: 'Meeting agenda' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Reorder Hiring plan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Hiring plan up' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Position of Hiring plan' })).toHaveValue('3');
  });

  it('moves an item down with the keyboard, keeps focus on the button, and announces the move', async () => {
    const user = userEvent.setup();
    const onReorder = jest.fn();
    render(<Harness onReorder={onReorder} />);
    const down = screen.getByRole('button', { name: 'Move Quarterly review down' });
    down.focus();
    await user.keyboard('{Enter}');
    expect(order()[1]).toMatch(/Quarterly review/);
    expect(onReorder).toHaveBeenLastCalledWith([ITEMS[1], ITEMS[0], ITEMS[2], ITEMS[3]]);
    expect(screen.getByRole('button', { name: 'Move Quarterly review down' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Moved Quarterly review to position 2 of 4.');

    await user.keyboard(' ');
    expect(order()[2]).toMatch(/Quarterly review/);
    expect(screen.getByRole('status')).toHaveTextContent('Moved Quarterly review to position 3 of 4.');
  });

  it('sends an item straight to a position and keeps focus on the select', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Position of Vendor renewals' }), '1');
    expect(order()[0]).toMatch(/Vendor renewals/);
    expect(screen.getByRole('combobox', { name: 'Position of Vendor renewals' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Moved Vendor renewals to position 1 of 4.');
  });

  it('keeps end buttons focusable and explains why they do nothing (edge case)', async () => {
    const user = userEvent.setup();
    const onReorder = jest.fn();
    render(<Harness onReorder={onReorder} />);
    const up = screen.getByRole('button', { name: 'Move Quarterly review up' });
    expect(up).toHaveAttribute('aria-disabled', 'true');
    expect(up).toBeEnabled();
    await user.click(up);
    expect(onReorder).not.toHaveBeenCalled();
    expect(up).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Quarterly review is already first.');
    await user.click(screen.getByRole('button', { name: 'Move Vendor renewals down' }));
    expect(screen.getByRole('status')).toHaveTextContent('Vendor renewals is already last.');
  });

  it('reorders by drag and drop through the same move path', () => {
    render(<Harness />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    const data = { effectAllowed: '', setData: jest.fn() };
    fireEvent.dragStart(items[3] as HTMLElement, { dataTransfer: data });
    fireEvent.dragOver(items[0] as HTMLElement, { dataTransfer: data });
    fireEvent.drop(items[0] as HTMLElement, { dataTransfer: data });
    expect(order()[0]).toMatch(/Vendor renewals/);
    expect(screen.getByRole('status')).toHaveTextContent('Moved Vendor renewals to position 1 of 4.');
  });

  it('handles empty and single-item lists (edge case)', () => {
    const { rerender } = render(<Harness initial={[]} />);
    expect(screen.getByText('No items to order.')).toBeInTheDocument();
    rerender(<Harness key="one" initial={[{ id: 'only', title: 'Only item' }]} />);
    expect(screen.getByRole('button', { name: 'Move Only item up' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Move Only item down' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
