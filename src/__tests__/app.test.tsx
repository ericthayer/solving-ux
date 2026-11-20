import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { App } from '../App';
import { builtInPatterns } from '../patterns/registry';

// Derived, so adding a pattern folder does not mean editing this file.
const TOTAL = builtInPatterns.length;

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));
expect.extend(toHaveNoViolations);

beforeAll(() => {
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function renderAt(path: string, canEdit = false) {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App canEdit={canEdit} />
    </MemoryRouter>,
  );
  return { ...utils, user };
}

describe('Pattern library shell', () => {
  it('lists every pattern on the home page with category, source, and WCAG badges', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hard UI problems');
    const grid = screen.getByRole('heading', { name: 'Browse patterns' }).closest('section')!;
    expect(within(grid).getAllByRole('article')).toHaveLength(TOTAL);
    expect(within(grid).getAllByText('WCAG 2.1 AA')).toHaveLength(TOTAL);
  });

  it('filters the sidebar and grid from the top bar search', async () => {
    const { user } = renderAt('/');
    await user.type(screen.getByRole('searchbox', { name: 'Search patterns' }), 'toast');
    const nav = screen.getByRole('navigation', { name: 'Patterns' });
    expect(within(nav).getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText(`1 of ${TOTAL} patterns`)).toBeInTheDocument();
  });

  it('shows the empty state and recovers when filters exclude everything (edge case)', async () => {
    const { user } = renderAt('/');
    await user.type(screen.getByRole('searchbox', { name: 'Search patterns' }), 'zzzz');
    expect(screen.getByRole('heading', { name: /No results for/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(screen.getByText(`${TOTAL} of ${TOTAL} patterns`)).toBeInTheDocument();
  });

  it('opens a pattern from a deep link with the requested tab selected', async () => {
    renderAt('/patterns/forms/wizard-validation?tab=tests');
    expect(await screen.findByRole('heading', { level: 1, name: 'Multi-step form with inline validation' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tests' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('region', { name: 'WizardForm.test.tsx source' })).toBeInTheDocument();
  });

  it('switches tabs with arrow keys and Home/End', async () => {
    const { user } = renderAt('/patterns/data-table/bulk-actions');
    await screen.findByRole('tablist');
    screen.getByRole('tab', { name: 'Preview' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{End}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Success criteria');
    await user.keyboard('{Home}');
    expect(screen.getByRole('table', { name: 'Purchase orders' })).toBeInTheDocument();
  });

  it('copies the deep link and exports a ZIP from the keyboard menu', async () => {
    const { user } = renderAt('/patterns/modals/confirm-dialog');
    await screen.findByRole('tablist');
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith('http://localhost/patterns/modals/confirm-dialog');

    const exportButton = screen.getByRole('button', { name: 'Export' });
    exportButton.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /Download ZIP/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByText('ZIP downloaded.')).toBeInTheDocument();
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'confirm-dialog.zip');
    expect(exportButton).toHaveFocus();
  });

  it('closes the export menu on Escape and returns focus', async () => {
    const { user } = renderAt('/patterns/modals/confirm-dialog');
    await screen.findByRole('tablist');
    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByRole('menu')).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toHaveFocus();
  });

  it('toggles the live demo between the broken Before and the fixed After, and deep-links it', async () => {
    const { user } = renderAt('/patterns/data-table/bulk-actions');
    await screen.findByRole('tablist');
    const toggle = screen.getByRole('group', { name: 'Demo version' });
    expect(within(toggle).getByRole('radio', { name: 'After · fixed' })).toBeChecked();
    expect(screen.getByRole('table', { name: 'Purchase orders' })).toBeInTheDocument();

    await user.click(within(toggle).getByRole('radio', { name: 'Before · broken' }));
    expect(screen.getByText('Deliberately broken')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Purchase orders' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-failure="select-all-scope"]')).not.toBeNull();

    // The demo choice survives a tab round trip.
    await user.click(screen.getByRole('tab', { name: 'Code' }));
    await user.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(screen.getByRole('radio', { name: 'Before · broken' })).toBeChecked();
  });

  it('opens the Before demo from a deep link and falls back to After for unknown values (edge case)', async () => {
    const before = renderAt('/patterns/modals/confirm-dialog?demo=before');
    await screen.findByRole('tablist');
    expect(screen.getByRole('radio', { name: 'Before · broken' })).toBeChecked();
    before.unmount();
    renderAt('/patterns/modals/confirm-dialog?demo=nonsense');
    await screen.findByRole('tablist');
    expect(screen.getByRole('radio', { name: 'After · fixed' })).toBeChecked();
  });

  it('renders a not-found page for unknown patterns (edge case)', async () => {
    renderAt('/patterns/forms/does-not-exist');
    expect(await screen.findByRole('heading', { name: 'This pattern does not exist' })).toBeInTheDocument();
  });

  it('hides editor controls and blocks /editor for read-only users', async () => {
    renderAt('/editor');
    expect(await screen.findByRole('heading', { level: 1, name: 'You do not have access to the pattern editor' })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Editor Mode' })).not.toBeInTheDocument();
  });

  it('lets editors turn on Editor Mode, see the badge, and save an edit', async () => {
    const { user } = renderAt('/patterns/search-filters/typeahead', true);
    await screen.findByRole('tablist');
    await user.click(screen.getByRole('switch', { name: 'Editor Mode' }));
    expect(screen.getByText('Editor Mode', { selector: '[role="status"]' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Edit pattern' }));
    const title = await screen.findByLabelText('Title');
    await user.clear(title);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Fix 1 field before saving.')).toHaveAttribute('role', 'alert');
    expect(title).toHaveFocus();

    await user.type(title, 'Supplier typeahead');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Supplier typeahead' })).toBeInTheDocument();
  });

  it('has no axe violations on the home and pattern pages', async () => {
    const home = renderAt('/');
    expect(await axe(home.container)).toHaveNoViolations();
    home.unmount();
    const detail = renderAt('/patterns/dashboard/widget-grid?tab=accessibility');
    await screen.findByRole('tablist');
    expect(await axe(detail.container)).toHaveNoViolations();
  });
});
