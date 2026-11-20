import { useMemo } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FacetedFilters, facetCounts, parseSelection, useFacetedFilters, writeSelection } from './FacetedFilters';
import type { Facet } from './FacetedFilters';

expect.extend(toHaveNoViolations);

type Row = { id: string; status: string; team: string };

const rows: Row[] = [
  { id: '1', status: 'open', team: 'ops' },
  { id: '2', status: 'open', team: 'finance' },
  { id: '3', status: 'closed', team: 'ops' },
  { id: '4', status: 'closed', team: 'ops' },
  { id: '5', status: 'open', team: 'ops' },
];

const facets: Facet<Row>[] = [
  { id: 'status', label: 'Status', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }], getValue: (r) => r.status },
  {
    id: 'team',
    label: 'Team',
    options: [{ value: 'ops', label: 'Operations' }, { value: 'finance', label: 'Finance' }, { value: 'legal', label: 'Legal' }],
    getValue: (r) => r.team,
  },
];

function Harness({ urlPrefix }: { urlPrefix?: string }): JSX.Element {
  const stable = useMemo(() => facets, []);
  const state = useFacetedFilters(rows, stable, urlPrefix);
  return (
    <FacetedFilters label="Filter rows" resultsLabel="Rows" noun={['row', 'rows']} state={state}>
      <ul>
        {state.results.map((r) => (
          <li key={r.id}>Row {r.id}</li>
        ))}
      </ul>
    </FacetedFilters>
  );
}

function setup(urlPrefix?: string) {
  const user = userEvent.setup();
  const utils = render(<Harness urlPrefix={urlPrefix} />);
  return { user, ...utils };
}

beforeEach(() => window.history.replaceState(null, '', '/'));

describe('FacetedFilters', () => {
  it('groups options in labelled fieldsets with per-option counts', () => {
    setup();
    const status = screen.getByRole('group', { name: 'Status' });
    expect(within(status).getByRole('checkbox', { name: 'Open 3 results' })).not.toBeChecked();
    expect(screen.getByRole('form', { name: 'Filter rows' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Showing all 5 rows.');
  });

  it('filters in place, keeps focus on the checkbox, and announces the count', async () => {
    const { user } = setup();
    const open = screen.getByRole('checkbox', { name: /^Open/ });
    await user.click(open);
    expect(open).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 3 of 5 rows.');
    expect(screen.getAllByRole('listitem').filter((li) => li.textContent?.startsWith('Row'))).toHaveLength(3);
    // Counts in other facets reflect the status filter; counts in Status itself do not.
    expect(screen.getByRole('checkbox', { name: 'Operations 2 results' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Closed 2 results' })).toBeInTheDocument();
  });

  it('ORs within a facet and ANDs across facets', () => {
    const counts = facetCounts(rows, facets, { status: ['open', 'closed'], team: ['finance'] });
    expect(counts.status).toEqual({ open: 1, closed: 0 });
    expect(counts.team).toEqual({ ops: 4, finance: 1, legal: 0 });
  });

  it('shows applied filters as chips and moves focus to the next chip on removal', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('checkbox', { name: /^Open/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Operations/ }));
    const chips = within(screen.getByRole('list', { name: 'Applied filters' })).getAllByRole('button');
    expect(chips.map((c) => c.getAttribute('aria-label'))).toEqual(['Remove filter Status: Open', 'Remove filter Team: Operations']);
    await user.click(chips[0]!);
    expect(screen.getByRole('button', { name: 'Remove filter Team: Operations' })).toHaveFocus();
    expect(screen.getByRole('checkbox', { name: /^Open/ })).not.toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 4 of 5 rows.');
  });

  it('moves focus to the results when the last chip or Clear all removes every filter (edge case)', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('checkbox', { name: /^Closed/ }));
    await user.click(screen.getByRole('button', { name: 'Remove filter Status: Closed' }));
    expect(screen.getByRole('region', { name: 'Rows' })).toHaveFocus();
    expect(screen.queryByRole('list', { name: 'Applied filters' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /^Open/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Finance/ }));
    await user.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(screen.getByRole('region', { name: 'Rows' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Showing all 5 rows.');
  });

  it('explains a dead end instead of showing an empty list (edge case: zero results)', async () => {
    const { user } = setup();
    const legal = screen.getByRole('checkbox', { name: 'Legal 0 results' });
    expect(legal).toBeEnabled();
    await user.click(legal);
    expect(screen.getByRole('status')).toHaveTextContent('No rows match these filters. Remove a filter to see more.');
  });

  it('restores from and writes to the URL, ignoring unknown values (edge case: stale link)', async () => {
    window.history.replaceState({ key: 'router' }, '', '/list?tab=preview&f-status=closed,bogus&f-nope=x');
    const { user } = setup('f-');
    expect(screen.getByRole('checkbox', { name: /^Closed/ })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 of 5 rows.');
    await user.click(screen.getByRole('checkbox', { name: /^Operations/ }));
    const params = new URLSearchParams(window.location.search);
    expect(params.get('tab')).toBe('preview');
    expect(params.get('f-status')).toBe('closed');
    expect(params.get('f-team')).toBe('ops');
    expect(window.history.state).toEqual({ key: 'router' });
  });

  it('parses and writes selections as pure functions', () => {
    expect(parseSelection('?x-team=ops,ops,legal', facets, 'x-')).toEqual({ team: ['ops', 'legal'] });
    const params = new URLSearchParams('x-status=open');
    writeSelection(params, facets, { status: [], team: ['finance'] }, 'x-');
    expect(params.toString()).toBe('x-team=finance');
  });

  it('opens the narrow-layout drawer and returns focus to the results from "Show N rows"', async () => {
    const { user } = setup();
    const toggle = screen.getByRole('button', { name: 'Filters' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('checkbox', { name: /^Open/ }));
    expect(screen.getByRole('button', { name: 'Filters (1 applied)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show 3 rows' }));
    expect(screen.getByRole('region', { name: 'Rows' })).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the drawer on Escape and returns focus to the toggle', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    screen.getByRole('checkbox', { name: /^Open/ }).focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no axe violations with filters applied', async () => {
    const { user, container } = setup();
    await user.click(screen.getByRole('checkbox', { name: /^Open/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Finance/ }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
