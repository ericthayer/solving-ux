import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DashboardGrid, Stat, Widget } from './DashboardGrid';

expect.extend(toHaveNoViolations);

function setup(onRetry = jest.fn(), onDensityChange = jest.fn()) {
  const user = userEvent.setup();
  const utils = render(
    <DashboardGrid title="Portfolio" onDensityChange={onDensityChange}>
      <Widget title="Total exposure" state={{ status: 'ready', content: <Stat label="Committed" value="$4.2B" change={{ value: '3.1%', direction: 'up', good: true }} /> }} viewAll={{ label: 'View exposure report', href: '/exposure' }} />
      <Widget title="Delinquencies" state={{ status: 'loading' }} />
      <Widget title="Covenant breaches" state={{ status: 'error', message: 'The service timed out.', onRetry }} />
      <Widget title="Watchlist" state={{ status: 'empty', message: 'No borrowers on the watchlist.' }} />
    </DashboardGrid>,
  );
  return { ...utils, user, onRetry, onDensityChange };
}

describe('DashboardGrid', () => {
  it('renders each widget as a labelled region', () => {
    setup();
    expect(screen.getByRole('region', { name: 'Portfolio' })).toBeInTheDocument();
    ['Total exposure', 'Delinquencies', 'Covenant breaches', 'Watchlist'].forEach((name) =>
      expect(screen.getByRole('region', { name })).toBeInTheDocument(),
    );
  });

  it('marks loading widgets busy and gives them a text alternative', () => {
    setup();
    const loading = screen.getByRole('region', { name: 'Delinquencies' });
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveTextContent('Loading Delinquencies');
    expect(screen.getByRole('region', { name: 'Total exposure' })).not.toHaveAttribute('aria-busy');
  });

  it('spells out KPI direction in text instead of relying on color', () => {
    setup();
    expect(screen.getByText('Up 3.1%')).toBeInTheDocument();
  });

  it('retries a failed widget from the keyboard', async () => {
    const { user, onRetry } = setup();
    const retry = screen.getByRole('button', { name: 'Retry loading Covenant breaches' });
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
    const { rerender } = render(<Widget title="Exposure" state={{ status: 'loading' }} viewAll={{ label: 'View all', href: '/x' }} />);
    expect(screen.queryByRole('link', { name: 'View all' })).not.toBeInTheDocument();
    rerender(<Widget title="Exposure" state={{ status: 'ready', content: 'Data' }} viewAll={{ label: 'View all', href: '/x' }} />);
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/x');
  });

  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
