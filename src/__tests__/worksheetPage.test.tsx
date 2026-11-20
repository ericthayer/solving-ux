import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { App } from '../App';
import { WORKSHEET_STORAGE_KEY } from '../hooks/useAuditWorksheet';

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

beforeAll(() => {
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  // jsdom has no <dialog> support.
  HTMLDialogElement.prototype.showModal = jest.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = jest.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  });
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.mocked(saveAs).mockClear();
});

function renderAt(path = '/worksheet') {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  );
  return { ...utils, user };
}

async function logFinding(user: ReturnType<typeof userEvent.setup>, title: string, observation: string): Promise<void> {
  await user.type(screen.getByRole('textbox', { name: /^Finding/ }), title);
  await user.type(screen.getByRole('textbox', { name: /^Observation/ }), observation);
  await user.click(screen.getByRole('button', { name: 'Add finding' }));
}

describe('Audit worksheet', () => {
  it('is reachable from the top bar and has no axe violations when empty', async () => {
    const { user, container } = renderAt('/');
    await user.click(screen.getByRole('link', { name: 'Audit worksheet' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Audit your own app.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No findings yet' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('blocks an incomplete finding, then logs it, persists it, and keeps focus in the form', async () => {
    const { user, container } = renderAt();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('button', { name: 'Add finding' }));
    const title = screen.getByRole('textbox', { name: /^Finding/ });
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(title).toHaveFocus();
    expect(title).toHaveAccessibleDescription(/Enter a short title/);

    await user.type(title, 'Focus lost after save');
    await user.type(screen.getByRole('textbox', { name: /^Observation/ }), 'Saving drops focus to the body.');
    await user.click(screen.getByRole('radio', { name: /^Critical/ }));
    await user.click(screen.getByRole('button', { name: 'Add finding' }));

    const list = screen.getByRole('heading', { name: /^Findings/ }).closest('section')!;
    expect(within(list).getByRole('heading', { level: 3, name: /Focus lost after save/ })).toBeInTheDocument();
    expect(within(list).getByText('Critical')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^Finding/ })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: /^Finding/ })).toHaveValue('');
    expect(screen.getByText(/Finding added\. 1 finding logged\./)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(WORKSHEET_STORAGE_KEY) ?? '{}').findings).toHaveLength(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('restores findings from storage and exports them as Markdown', async () => {
    localStorage.setItem(
      WORKSHEET_STORAGE_KEY,
      JSON.stringify({ appName: 'Loan portal', auditor: '', findings: [{ id: 'a', title: 'Low contrast labels', severity: 'serious', observation: 'Grey on grey.' }] }),
    );
    const { user } = renderAt();
    expect(await screen.findByRole('heading', { level: 3, name: /Low contrast labels/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'App or flow audited' })).toHaveValue('Loan portal');
    await user.click(screen.getByRole('button', { name: 'Download .md' }));
    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob, filename] = jest.mocked(saveAs).mock.calls[0] as [Blob, string];
    expect(filename).toMatch(/^ux-audit-loan-portal-\d{4}-\d{2}-\d{2}\.md$/);
    expect(blob.type).toBe('text/markdown;charset=utf-8');
    expect(screen.getByLabelText('Markdown preview')).toHaveTextContent('# UX audit: Loan portal');
  });

  it('edits a finding and returns focus to it', async () => {
    const { user } = renderAt();
    await screen.findByRole('heading', { level: 1 });
    await logFinding(user, 'Vague error', 'Says "Something went wrong".');
    await user.click(screen.getByRole('button', { name: 'Edit Vague error' }));
    expect(screen.getByRole('heading', { name: 'Edit finding 1' })).toBeInTheDocument();
    const title = screen.getByRole('textbox', { name: /^Finding/ });
    await user.clear(title);
    await user.type(title, 'Vague save error');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('heading', { level: 3, name: /Vague save error/ })).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Log a finding' })).toBeInTheDocument();
  });

  it('deletes with undo, and clears everything only after confirmation (edge case)', async () => {
    const { user } = renderAt();
    await screen.findByRole('heading', { level: 1 });
    await logFinding(user, 'One', 'First.');
    await logFinding(user, 'Two', 'Second.');
    await user.click(screen.getByRole('button', { name: 'Delete One' }));
    expect(screen.queryByRole('heading', { level: 3, name: /One/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('heading', { level: 3, name: /One/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear worksheet' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Clear the worksheet?' });
    expect(within(dialog).getByText('2 findings will be deleted.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Clear worksheet' }));
    expect(screen.getByRole('heading', { name: 'No findings yet' })).toBeInTheDocument();
  });

  it('prefills the linked pattern from ?pattern= (edge case)', async () => {
    renderAt('/worksheet?pattern=forms.wizard-validation');
    expect(await screen.findByRole('combobox', { name: /Solved by pattern/ })).toHaveDisplayValue('Multi-step form with inline validation');
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveDisplayValue('Forms');
  });
});
