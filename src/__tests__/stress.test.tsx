import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { expandText } from '../patterns/stress';

expect.extend(toHaveNoViolations);

beforeAll(() => {
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function renderAt(path: string) {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App canEdit={false} />
    </MemoryRouter>,
  );
  return { ...utils, user };
}

const toolbar = (): HTMLElement => screen.getByRole('group', { name: 'Stress test' });

describe('expandText', () => {
  it('adds an unbreakable word to labels and a sentence to copy', () => {
    expect(expandText('Approve')).toMatch(/^Approve \S{40,}$/);
    expect(expandText('The servicing system did not respond.')).toMatch(/^The servicing system did not respond\. .+\.$/);
  });
});

describe('Stress-test controls', () => {
  it('constrains width, zooms, and flips direction on the demo stage', async () => {
    const { user } = renderAt('/patterns/data-table/bulk-actions');
    const stage = await screen.findByTestId('stress-stage');
    const bar = toolbar();

    await user.selectOptions(within(bar).getByRole('combobox', { name: 'Width' }), '320');
    expect(stage.parentElement).toHaveAttribute('data-width', '320');

    await user.selectOptions(within(bar).getByRole('combobox', { name: 'Zoom' }), '4');
    expect(stage).toHaveAttribute('data-zoom', '4');

    await user.click(within(bar).getByRole('button', { name: 'RTL' }));
    expect(stage).toHaveAttribute('dir', 'rtl');
    expect(within(bar).getByRole('button', { name: 'RTL' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(bar).getByRole('button', { name: 'Reset' }));
    expect(stage).not.toHaveAttribute('dir');
    expect(stage).toHaveAttribute('data-zoom', '1');
    expect(within(bar).getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  it('loads 10,000 rows and long text into a demo that supports them', async () => {
    const { user } = renderAt('/patterns/data-table/bulk-actions');
    await screen.findByTestId('stress-stage');
    const bar = toolbar();

    await user.click(within(bar).getByRole('button', { name: '10k rows' }));
    expect(screen.getByText('Page 1 of 1250')).toBeInTheDocument();

    await user.click(within(bar).getByRole('button', { name: 'Long text' }));
    const table = within(screen.getByTestId('stress-stage')).getByRole('table');
    expect(within(table).getAllByText(/Landwirtschaftsgenossenschafts/).length).toBeGreaterThan(0);
    // Data-shaping toggles survive together.
    expect(screen.getByText('Page 1 of 1250')).toBeInTheDocument();
  });

  it('marks a toggle unavailable when the demo has nothing to stretch (edge case)', async () => {
    const { user } = renderAt('/patterns/modals/confirm-dialog');
    await screen.findByTestId('stress-stage');
    const rows = within(toolbar()).getByRole('button', { name: '10k rows' });
    expect(rows).toHaveAttribute('aria-disabled', 'true');
    expect(rows).toHaveAccessibleDescription('Not available for this demo.');
    await user.click(rows);
    expect(rows).toHaveAttribute('aria-pressed', 'false');
    expect(within(toolbar()).getByRole('button', { name: 'Long text' })).not.toHaveAttribute('aria-disabled');
  });

  it('resets stress settings when moving to another pattern', async () => {
    const { user } = renderAt('/patterns/navigation/nested-nav');
    await screen.findByTestId('stress-stage');
    await user.click(within(toolbar()).getByRole('button', { name: 'RTL' }));
    await user.click(screen.getByRole('link', { name: 'Typeahead for large data sets' }));
    expect(await screen.findByTestId('stress-stage')).not.toHaveAttribute('dir');
  });

  it('has no axe violations with every stress option on', async () => {
    const { user, container } = renderAt('/patterns/search-filters/typeahead');
    await screen.findByTestId('stress-stage');
    const bar = toolbar();
    await user.click(within(bar).getByRole('button', { name: 'RTL' }));
    await user.click(within(bar).getByRole('button', { name: 'Long text' }));
    await user.click(within(bar).getByRole('button', { name: '10k rows' }));
    expect(screen.getByText(/Search 10,000 borrowers/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
