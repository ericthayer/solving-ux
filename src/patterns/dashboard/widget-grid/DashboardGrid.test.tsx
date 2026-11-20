import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DashboardGrid, Stat, Widget } from './DashboardGrid';

expect.extend(toHaveNoViolations);

function setup(onRetry = jest.fn(), onDensityChange = jest.fn()) {
  const user = userEvent.setup();
  const utils = render(
    <DashboardGrid title="Operations" onDensityChange={onDensityChange}>
      <Widget title="Total spend" state={{ status: 'ready', content: <Stat label="Committed" value="$4.2B" change={{ value: '3.1%', direction: 'up', good: true }} /> }} viewAll={{ label: 'View exposure report', href: '/exposure' }} />
      <Widget title="Late deliveries" state={{ status: 'loading' }} />
      <Widget title="Contract breaches" state={{ status: 'error', message: 'The service timed out.', onRetry }} />
      <Widget title="Watchlist" state={{ status: 'empty', message: 'No suppliers on the watchlist.' }} />
    </DashboardGrid>,
  );
  return { ...utils, user, onRetry, onDensityChange };
}

describe('DashboardGrid', () => {
  it('renders each widget as a labelled region', () => {
    setup();
    expect(screen.getByRole('region', { name: 'Operations' })).toBeInTheDocument();
    ['Total spend', 'Late deliveries', 'Contract breaches', 'Watchlist'].forEach((name) =>
      expect(screen.getByRole('region', { name })).toBeInTheDocument(),
    );
  });

  it('marks loading widgets busy and gives them a text alternative', () => {
    setup();
    const loading = screen.getByRole('region', { name: 'Late deliveries' });
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveTextContent('Loading Late deliveries');
    expect(screen.getByRole('region', { name: 'Total spend' })).not.toHaveAttribute('aria-busy');
  });

  it('spells out KPI direction in text instead of relying on color', () => {
    setup();
    expect(screen.getByText('Up 3.1%')).toBeInTheDocument();
  });

  it('retries a failed widget from the keyboard', async () => {
    const { user, onRetry } = setup();
    const retry = screen.getByRole('button', { name: 'Retry loading Contract breaches' });
    retry.focus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('switches density with arrow keys in the radio group', async () => {
    const { user, onDensityChange, container } = setup();
    screen.getByRole('radio', { name: 'Comfortable' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Compact' })).toBeChecked();
    expect(onDensityChange).toHaveBeenCalledWith('compact');
    expect(container.querySelector('[data-density]')).toHaveAttribute('data-density', 'compact');
  });

  it('hides the view-all link until a widget has data (edge case)', () => {
    const { rerender } = render(<Widget title="Spend" state={{ status: 'loading' }} viewAll={{ label: 'View all', href: '/x' }} />);
    expect(screen.queryByRole('link', { name: 'View all' })).not.toBeInTheDocument();
    rerender(<Widget title="Spend" state={{ status: 'ready', content: 'Data' }} viewAll={{ label: 'View all', href: '/x' }} />);
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/x');
  });

  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
