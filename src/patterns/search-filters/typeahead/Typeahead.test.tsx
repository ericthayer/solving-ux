import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Typeahead, rankOptions } from './Typeahead';
import type { TypeaheadOption } from './Typeahead';

expect.extend(toHaveNoViolations);

const options: TypeaheadOption[] = [
  { id: '1', label: 'Cedar Ridge Farms', description: 'ACCT 10442' },
  { id: '2', label: 'North Plains Co-op', description: 'ACCT 20019' },
  { id: '3', label: 'Ridgeview Dairy', description: 'ACCT 30551' },
  ...Array.from({ length: 500 }, (_, i) => ({ id: `bulk-${i}`, label: `Farm Credit Account ${i}` })),
];

function setup(onSelect = jest.fn()) {
  const user = userEvent.setup();
  const { container } = render(<Typeahead label="Borrower" hint="Search by name or account number." options={options} onSelect={onSelect} maxResults={5} />);
  const input = screen.getByRole('combobox', { name: 'Borrower' });
  return { user, input, onSelect, container };
}

describe('Typeahead', () => {
  it('renders a labelled, collapsed combobox with a hint', () => {
    const { input } = setup();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAccessibleDescription('Search by name or account number.');
  });

  it('ranks prefix matches first and highlights the match', async () => {
    const { user, input } = setup();
    await user.type(input, 'ridge');
    const items = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(items.map((o) => o.textContent)).toEqual(['Ridgeview DairyACCT 30551', 'Cedar Ridge FarmsACCT 10442']);
    expect(items[1]!.querySelector('mark')).toHaveTextContent('Ridge');
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves the active option with arrow keys and selects with Enter', async () => {
    const { user, input, onSelect } = setup();
    await user.type(input, 'ridge');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const second = screen.getByRole('option', { name: /Cedar Ridge/ });
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', second.id);
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(options[0]);
    expect(input).toHaveValue('Cedar Ridge Farms');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape, then clears on a second Escape', async () => {
    const { user, input } = setup();
    await user.type(input, 'north');
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('caps rendered results and tells users to narrow (edge case: large data set)', async () => {
    const { user, input } = setup();
    await user.type(input, 'farm');
    expect(screen.getAllByRole('option')).toHaveLength(5);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 5 of 501 matches. Keep typing to narrow.');
  });

  it('announces when nothing matches (edge case)', async () => {
    const { user, input } = setup();
    await user.type(input, 'zzz');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('No matches for "zzz".');
  });

  it('matches on description and ignores blank queries', () => {
    expect(rankOptions(options, '30551').map((o) => o.id)).toEqual(['3']);
    expect(rankOptions(options, '   ')).toEqual([]);
  });

  it('has no axe violations while expanded', async () => {
    const { user, input, container } = setup();
    await user.type(input, 'ridge');
    await user.keyboard('{ArrowDown}');
    expect(await axe(container)).toHaveNoViolations();
  });
});
