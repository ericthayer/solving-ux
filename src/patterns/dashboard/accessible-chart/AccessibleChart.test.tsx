import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleChart } from './AccessibleChart';
import type { ChartSeries } from './AccessibleChart';
import { niceTicks } from './chartGeometry';

expect.extend(toHaveNoViolations);

const CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr'];
const SERIES: ChartSeries[] = [
  { id: 'a', label: 'Small orders', values: [2, 2.5, 2, 3] },
  { id: 'b', label: 'Large orders', values: [6, null, 8, 11] },
];

function setup(defaultView: 'chart' | 'table' = 'chart') {
  const user = userEvent.setup();
  const utils = render(
    <AccessibleChart
      title="Approval time"
      summary="Large orders slowed from 6 to 11 days."
      categories={CATEGORIES}
      categoryLabel="Month"
      valueLabel="Days to approve"
      series={SERIES}
      formatValue={(v) => `${v} days`}
      defaultView={defaultView}
    />,
  );
  return { ...utils, user };
}

describe('AccessibleChart', () => {
  it('names the figure by its heading and shows the takeaway first', () => {
    setup();
    const figure = screen.getByRole('figure', { name: 'Approval time' });
    expect(within(figure).getByText('Large orders slowed from 6 to 11 days.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Approval time, chart' })).toHaveAccessibleDescription(/arrow keys/);
  });

  it('names every point with series, category, value, and position', () => {
    setup();
    expect(screen.getByRole('img', { name: 'Large orders, Apr: 11 days, 4 of 4' })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Small orders' })).getAllByRole('img')).toHaveLength(4);
  });

  it('puts the chart on one tab stop and moves between points with arrow keys', async () => {
    const { user } = setup();
    await user.tab();
    await user.tab();
    const first = screen.getByRole('img', { name: 'Small orders, Jan: 2 days, 1 of 4' });
    expect(first).toHaveFocus();
    expect(screen.getAllByRole('img').filter((el) => el.getAttribute('tabindex') === '0')).toHaveLength(1);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('img', { name: 'Small orders, Feb: 2.5 days, 2 of 4' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('img', { name: 'Small orders, Apr: 3 days, 4 of 4' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('img', { name: 'Large orders, Apr: 11 days, 4 of 4' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('img', { name: 'Large orders, Jan: 6 days, 1 of 4' })).toHaveFocus();
  });

  it('skips missing values when moving and shows them as "No data" in the table (edge case)', async () => {
    const { user } = setup();
    expect(screen.queryByRole('img', { name: /Large orders, Feb/ })).not.toBeInTheDocument();
    act(() => screen.getByRole('img', { name: 'Small orders, Jan: 2 days, 1 of 4' }).focus());
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('img', { name: 'Large orders, Mar: 8 days, 3 of 4' })).toHaveFocus();

    await user.click(screen.getByRole('radio', { name: 'Table' }));
    const row = screen.getByRole('row', { name: /^Feb/ });
    expect(within(row).getByRole('cell', { name: 'No data' })).toBeInTheDocument();
  });

  it('shows the tooltip on focus and hides it with Escape without moving focus', async () => {
    const { user, container } = setup();
    const point = screen.getByRole('img', { name: 'Small orders, Jan: 2 days, 1 of 4' });
    act(() => point.focus());
    const tooltip = (): Element | null => container.querySelector('[aria-hidden="true"] strong')?.parentElement ?? null;
    expect(tooltip()).toHaveTextContent('Small ordersJan: 2 days');
    await user.keyboard('{Escape}');
    expect(tooltip()).toBeNull();
    expect(point).toHaveFocus();
  });

  it('renders the same data as a table with caption and headers', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Table' }));
    const table = screen.getByRole('table', { name: 'Approval time, Days to approve' });
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Month', 'Small orders', 'Large orders']);
    expect(within(table).getByRole('rowheader', { name: 'Apr' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '11 days' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Approval time, chart' })).not.toBeInTheDocument();
  });

  it('rounds the value axis to a clean maximum (edge case: empty or zero data)', () => {
    expect(niceTicks(11.2)).toEqual([0, 5, 10, 15]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });

  it('has no axe violations in chart or table view', async () => {
    const chart = setup();
    expect(await axe(chart.container)).toHaveNoViolations();
    chart.unmount();
    const table = setup('table');
    expect(await axe(table.container)).toHaveNoViolations();
  });
});
