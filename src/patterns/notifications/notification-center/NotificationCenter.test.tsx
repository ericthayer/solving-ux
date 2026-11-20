import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NotificationCenter, groupByDay } from './NotificationCenter';
import type { NotificationItem } from './NotificationCenter';

expect.extend(toHaveNoViolations);

const NOW = new Date(2026, 10, 20, 15, 0);
const at = (daysAgo: number, hour: number): string => new Date(2026, 10, 20 - daysAgo, hour, 0).toISOString();

const SEED: NotificationItem[] = [
  { id: 'a', title: 'Invoice approved', timestamp: at(0, 9), read: false, action: { label: 'View invoice', onClick: jest.fn() } },
  { id: 'b', title: 'Report generated', timestamp: at(0, 11), read: true },
  { id: 'c', title: 'Access requested', timestamp: at(1, 10), read: false },
  { id: 'd', title: 'Password expiring', timestamp: at(4, 8), read: true },
];

function Harness({ initial = SEED }: { initial?: NotificationItem[] }): JSX.Element {
  const [items, setItems] = useState(initial);
  return (
    <>
      <button type="button" onClick={() => setItems((l) => [{ id: `n${l.length}`, title: 'Export ready', timestamp: NOW.toISOString(), read: false }, ...l])}>
        Add
      </button>
      <NotificationCenter
        now={NOW}
        items={items}
        onReadChange={(id, read) => setItems((l) => l.map((i) => (i.id === id ? { ...i, read } : i)))}
        onMarkAllRead={() => setItems((l) => l.map((i) => ({ ...i, read: true })))}
      />
    </>
  );
}

const trigger = (): HTMLElement => screen.getByRole('button', { name: /^Notifications/ });

describe('NotificationCenter', () => {
  it('names the bell with the unread count and toggles a labelled panel', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(trigger()).toHaveAccessibleName('Notifications, 2 unread');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument();
    await user.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeVisible();
  });

  it('groups items by day, newest first, with read state in text', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings[0]).toBe('Today');
    expect(headings[1]).toBe('Yesterday');
    expect(headings).toHaveLength(3);
    const today = screen.getByRole('region', { name: 'Today' });
    const rows = within(today).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Report generated');
    expect(rows[1]).toHaveTextContent('Unread: Invoice approved');
  });

  it('marks one item read, runs its action, and marks all read with an announcement', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'View invoice' }));
    expect(SEED[0]?.action?.onClick).toHaveBeenCalled();
    expect(trigger()).toHaveAccessibleName('Notifications, 1 unread');
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(trigger()).toHaveAccessibleName('Notifications');
    expect(screen.getByRole('status')).toHaveTextContent('1 notification marked as read');
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getAllByRole('button', { name: 'Mark as unread' })[0]!);
    expect(trigger()).toHaveAccessibleName('Notifications, 1 unread');
  });

  it('announces only new arrivals, politely', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('status')).toHaveTextContent('New notification: Export ready');
  });

  it('closes on Escape and returns focus to the bell', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('caps the visual badge at 99+ but names the exact count (edge case)', () => {
    const many = Array.from({ length: 120 }, (_, i) => ({ id: `m${i}`, title: `Item ${i}`, timestamp: at(0, 9), read: false }));
    render(<Harness initial={many} />);
    expect(trigger()).toHaveAccessibleName('Notifications, 120 unread');
    expect(trigger()).toHaveTextContent('99+');
  });

  it('shows an empty state with nothing to mark (edge case)', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(trigger());
    expect(screen.getByText(/all caught up/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('groups across days and names older dates (edge case)', () => {
    const groups = groupByDay(SEED, NOW);
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday', 'Monday, Nov 16']);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('has no axe violations with the panel open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.click(trigger());
    expect(await axe(container)).toHaveNoViolations();
  });
});
