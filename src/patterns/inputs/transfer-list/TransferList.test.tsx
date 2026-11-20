import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TransferList, countLabel, matchItems } from './TransferList';
import type { TransferItem, TransferLayout } from './TransferList';

expect.extend(toHaveNoViolations);

const people: TransferItem[] = [
  { id: 'a', label: 'Avery Patel', description: 'Finance' },
  { id: 'b', label: 'Jordan Nguyen', description: 'Operations' },
  { id: 'c', label: 'Riley Garcia', description: 'Finance' },
  { id: 'd', label: 'Casey Okafor', description: 'Legal' },
];
const noun = { one: 'person', other: 'people' };

function Harness({ items = people, initial = ['d'], layout = 'dual', maxRendered }: { items?: TransferItem[]; initial?: string[]; layout?: TransferLayout; maxRendered?: number }): JSX.Element {
  const [value, setValue] = useState(initial);
  return <TransferList label="Reviewers" items={items} value={value} onChange={setValue} noun={noun} layout={layout} maxRendered={maxRendered} />;
}

function setup(props: Parameters<typeof Harness>[0] = {}) {
  const user = userEvent.setup();
  const utils = render(<Harness {...props} />);
  const available = () => screen.getByRole('group', { name: /^Available/ });
  const assigned = () => screen.getByRole('group', { name: /^Assigned/ });
  return { user, available, assigned, ...utils };
}

describe('TransferList', () => {
  it('labels each list with its count and names the buttons', () => {
    const { available, assigned } = setup();
    expect(available()).toHaveAccessibleName('Available (3 people)');
    expect(assigned()).toHaveAccessibleName('Assigned (1 person)');
    expect(screen.getByRole('button', { name: 'Add selected (0)' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Remove selected (0)' })).toBeInTheDocument();
  });

  it('adds checked items, announces the move, and keeps focus on the button', async () => {
    const { user, available, assigned } = setup();
    await user.click(within(available()).getByRole('checkbox', { name: /Avery Patel/ }));
    await user.click(within(available()).getByRole('checkbox', { name: /Riley Garcia/ }));
    const add = screen.getByRole('button', { name: 'Add selected (2)' });
    await user.click(add);
    expect(within(assigned()).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Avery PatelFinance', 'Riley GarciaFinance', 'Casey OkaforLegal']);
    expect(screen.getByRole('status')).toHaveTextContent('Added 2 people. 3 people assigned.');
    expect(add).toHaveFocus();
    expect(add).toHaveAccessibleName('Add selected (0)');
  });

  it('names a single moved item and removes from the assigned list', async () => {
    const { user, assigned } = setup();
    await user.click(within(assigned()).getByRole('checkbox', { name: /Casey Okafor/ }));
    await user.click(screen.getByRole('button', { name: 'Remove selected (1)' }));
    expect(screen.getByRole('status')).toHaveTextContent('Removed Casey Okafor. 0 people assigned.');
    expect(within(assigned()).getByText('No people assigned yet.')).toBeInTheDocument();
  });

  it('select-all covers only filtered matches, and hidden checks never move', async () => {
    const { user, available } = setup();
    await user.click(within(available()).getByRole('checkbox', { name: /Jordan Nguyen/ }));
    await user.type(within(available()).getByRole('searchbox', { name: 'Filter available' }), 'finance');
    const selectAll = within(available()).getByRole('checkbox', { name: 'Select all 2 people matching' });
    await user.click(selectAll);
    // Jordan is still checked but filtered out, so only the two visible people count.
    await user.click(screen.getByRole('button', { name: 'Add selected (2)' }));
    expect(screen.getByRole('status')).toHaveTextContent('Added 2 people. 3 people assigned.');
  });

  it('marks select-all as mixed when some matches are checked', async () => {
    const { user, available } = setup();
    await user.click(within(available()).getByRole('checkbox', { name: /Avery Patel/ }));
    expect(within(available()).getByRole('checkbox', { name: 'Select all 3 people' })).toBePartiallyChecked();
  });

  it('explains empty filter results (edge case)', async () => {
    const { user, available } = setup();
    await user.type(within(available()).getByRole('searchbox', { name: 'Filter available' }), 'zzz');
    expect(within(available()).getByText('No matches for "zzz".')).toBeInTheDocument();
    expect(within(available()).getByRole('checkbox', { name: /Select all 0 people/ })).toBeDisabled();
  });

  it('caps rendered rows and asks users to filter (edge case: large data set)', () => {
    const many = Array.from({ length: 1000 }, (_, i) => ({ id: `p${i}`, label: `Person ${i}` }));
    const { available } = setup({ items: many, initial: [], maxRendered: 50 });
    expect(within(available()).getAllByRole('listitem')).toHaveLength(50);
    expect(within(available()).getByText('Showing 50 of 1,000. Filter to narrow.')).toBeInTheDocument();
  });

  it('assigns immediately in checklist layout', async () => {
    const { user } = setup({ layout: 'checklist' });
    const list = screen.getByRole('group', { name: 'People (1 of 4 assigned)' });
    expect(within(list).getByRole('checkbox', { name: /Casey Okafor/ })).toBeChecked();
    await user.click(within(list).getByRole('checkbox', { name: /Jordan Nguyen/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Added Jordan Nguyen. 2 people assigned.');
    expect(screen.getByRole('group', { name: 'People (2 of 4 assigned)' })).toBeInTheDocument();
  });

  it('matches on description and formats counts', () => {
    expect(matchItems(people, ' LEGAL ').map((p) => p.id)).toEqual(['d']);
    expect(matchItems(people, '')).toBe(people);
    expect(countLabel(1204, noun)).toBe('1,204 people');
  });

  it('has no axe violations in either layout', async () => {
    const { user, available, container, unmount } = setup();
    await user.click(within(available()).getByRole('checkbox', { name: /Avery Patel/ }));
    expect(await axe(container)).toHaveNoViolations();
    unmount();
    const checklist = render(<Harness layout="checklist" />);
    expect(await axe(checklist.container)).toHaveNoViolations();
  });
});
