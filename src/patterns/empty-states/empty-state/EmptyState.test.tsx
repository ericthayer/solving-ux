import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EmptyState } from './EmptyState';

expect.extend(toHaveNoViolations);

describe('EmptyState', () => {
  it('renders a first-use state with a heading and primary action', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(
      <EmptyState
        variant="first-use"
        title="No saved reports yet"
        description="Save a report to rerun it later."
        primaryAction={{ label: 'Create report', onClick }}
        learnMore={{ label: 'How reports work', href: '/help/reports' }}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'No saved reports yet' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'Create report' }).focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });

  it('announces no-results politely and offers to clear filters', async () => {
    const onClearFilters = jest.fn();
    const user = userEvent.setup();
    render(<EmptyState variant="no-results" query="halvorsn" activeFilterCount={3} onClearFilters={onClearFilters} />);
    expect(screen.getByRole('status')).toHaveTextContent('No results for “halvorsn”');
    expect(screen.getByText('3 filters are narrowing these results.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear all 3 filters' }));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it('omits the clear action when no filters are active (edge case)', () => {
    render(<EmptyState variant="no-results" activeFilterCount={0} onClearFilters={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'No matching results' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses an alert for errors and copies the reference id', async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<EmptyState variant="error" description="The ledger service timed out." onRetry={jest.fn()} errorReference="ERR-7F3A" headingLevel={3} />);
    expect(screen.getByRole('alert')).toHaveTextContent('This data could not be loaded');
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy error reference' }));
    expect(writeText).toHaveBeenCalledWith('ERR-7F3A');
    expect(await screen.findByRole('button', { name: 'Copied error reference' })).toBeInTheDocument();
  });

  it('explains who to ask in the no-access state', () => {
    render(<EmptyState variant="no-access" resource="Credit memos" ownerName="Credit Administration" requestAccessHref="/access" />);
    expect(screen.getByRole('heading', { name: 'You do not have access to Credit memos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request access' })).toHaveAttribute('href', '/access');
  });

  it('labels the section by its heading and hides the icon from assistive tech', () => {
    const { container } = render(<EmptyState variant="no-results" activeFilterCount={0} onClearFilters={jest.fn()} />);
    expect(screen.getByRole('region', { name: 'No matching results' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no axe violations for every variant', async () => {
    const { container } = render(
      <main>
        <EmptyState variant="first-use" title="Empty" description="Nothing yet." primaryAction={{ label: 'Add', onClick: jest.fn() }} />
        <EmptyState variant="no-results" activeFilterCount={1} onClearFilters={jest.fn()} />
        <EmptyState variant="error" description="Failed." onRetry={jest.fn()} errorReference="E1" />
        <EmptyState variant="no-access" resource="Reports" requestAccessHref="/a" />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
