import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useState } from 'react';
import { EditConflictForm } from './EditConflictForm';
import type { EditConflictFormProps, FieldDef, SaveResult, VersionedRecord } from './EditConflictForm';

expect.extend(toHaveNoViolations);

// jsdom does not implement modal dialogs yet. Minimal stand-ins that mirror browser behavior.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

const fields: FieldDef[] = [
  { name: 'terms', label: 'Payment terms' },
  { name: 'delivery', label: 'Delivery date' },
  { name: 'notes', label: 'Notes', multiline: true },
];
const record: VersionedRecord = { version: 1, values: { terms: 'Net 30', delivery: '2026-12-04', notes: '' } };

function Harness({ onSave, onNavigationResolved }: Partial<EditConflictFormProps>): JSX.Element {
  const [pending, setPending] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={() => setPending('PO-1043')}>
        Open PO-1043
      </button>
      <EditConflictForm
        title="Purchase order PO-1042"
        fields={fields}
        record={record}
        onSave={onSave ?? jest.fn()}
        pendingNavigation={pending}
        onNavigationResolved={(allow) => {
          onNavigationResolved?.(allow);
          setPending(null);
        }}
      />
    </>
  );
}

const status = (): HTMLElement => screen.getByRole('status');

describe('EditConflictForm', () => {
  it('counts real changes only; undoing an edit makes the form clean again', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const terms = screen.getByLabelText('Payment terms');
    await user.clear(terms);
    await user.type(terms, 'Net 45');
    expect(status()).toHaveTextContent('1 unsaved change.');
    expect(terms).toHaveAccessibleDescription('Unsaved change');
    await user.clear(terms);
    await user.type(terms, 'Net 30');
    expect(status()).toHaveTextContent('No unsaved changes.');
  });

  it('registers beforeunload only while there are unsaved changes', async () => {
    const user = userEvent.setup();
    const add = jest.spyOn(window, 'addEventListener');
    render(<Harness />);
    expect(add).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
    await user.type(screen.getByLabelText('Notes'), 'Call ahead');
    expect(add).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    add.mockRestore();
  });

  it('lets in-app navigation through at once when the form is clean (edge case)', async () => {
    const user = userEvent.setup();
    const resolved = jest.fn();
    render(<Harness onNavigationResolved={resolved} />);
    await user.click(screen.getByRole('button', { name: 'Open PO-1043' }));
    expect(resolved).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before navigating away from unsaved changes and defaults to keep editing', async () => {
    const user = userEvent.setup();
    const resolved = jest.fn();
    render(<Harness onNavigationResolved={resolved} />);
    await user.type(screen.getByLabelText('Notes'), 'Dock 2');
    await user.click(screen.getByRole('button', { name: 'Open PO-1043' }));
    const dialog = screen.getByRole('dialog', { name: 'Leave with unsaved changes?' });
    expect(dialog).toHaveAccessibleDescription(/You changed Notes/);
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(resolved).toHaveBeenCalledWith(false);
    expect(screen.getByLabelText('Notes')).toHaveValue('Dock 2');
  });

  it('merges non-overlapping changes and asks only about fields both people changed', async () => {
    const user = userEvent.setup();
    const latest: VersionedRecord = { version: 2, updatedBy: 'Jordan Lee', values: { terms: 'Net 60', delivery: '2026-12-09', notes: '' } };
    const onSave = jest
      .fn<Promise<SaveResult>, [Record<string, string>, number]>()
      .mockResolvedValueOnce({ status: 'conflict', latest })
      .mockImplementationOnce(async (values) => ({ status: 'saved', record: { version: 3, values } }));
    render(<Harness onSave={onSave} />);
    const terms = screen.getByLabelText('Payment terms');
    await user.clear(terms);
    await user.type(terms, 'Net 45');
    await user.type(screen.getByLabelText('Notes'), 'Dock 2');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const heading = await screen.findByRole('heading', { name: 'Jordan Lee saved changes while you were editing' });
    expect(heading).toHaveFocus();
    expect(status()).toHaveTextContent('1 field needs your decision');
    expect(screen.getByText(/Merged from Jordan Lee: Delivery date/)).toBeInTheDocument();
    expect(screen.getByLabelText('Delivery date')).toHaveValue('2026-12-09');
    expect(screen.getByLabelText('Notes')).toHaveValue('Dock 2');

    // Saving without a decision is refused with a message, not a silent overwrite.
    await user.click(screen.getByRole('button', { name: 'Save merged version' }));
    expect(status()).toHaveTextContent('Choose which version to keep');
    expect(onSave).toHaveBeenCalledTimes(1);

    const group = screen.getByRole('group', { name: 'Payment terms' });
    expect(group).toHaveTextContent('Net 45');
    expect(group).toHaveTextContent('Net 60');
    await user.click(screen.getByRole('radio', { name: /Keep Jordan Lee's/ }));
    await user.click(screen.getByRole('button', { name: 'Save merged version' }));
    await waitFor(() => expect(status()).toHaveTextContent('All changes saved.'));
    expect(onSave).toHaveBeenLastCalledWith({ terms: 'Net 60', delivery: '2026-12-09', notes: 'Dock 2' }, 2);
  });

  it('keeps the user on the form when save-and-leave hits a conflict (edge case)', async () => {
    const user = userEvent.setup();
    const resolved = jest.fn();
    const latest: VersionedRecord = { version: 2, updatedBy: 'Jordan Lee', values: { ...record.values, notes: 'Theirs' } };
    render(<Harness onSave={jest.fn().mockResolvedValue({ status: 'conflict', latest })} onNavigationResolved={resolved} />);
    await user.type(screen.getByLabelText('Notes'), 'Mine');
    await user.click(screen.getByRole('button', { name: 'Open PO-1043' }));
    await user.click(screen.getByRole('button', { name: 'Save and leave' }));
    await waitFor(() => expect(resolved).toHaveBeenCalledWith(false));
    expect(screen.getByRole('group', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toHaveValue('Mine');
  });

  it('has no axe violations while dirty and in conflict', async () => {
    const user = userEvent.setup();
    const latest: VersionedRecord = { version: 2, updatedBy: 'Jordan Lee', values: { ...record.values, terms: 'Net 60' } };
    const { container } = render(<Harness onSave={jest.fn().mockResolvedValue({ status: 'conflict', latest })} />);
    const terms = screen.getByLabelText('Payment terms');
    await user.clear(terms);
    await user.type(terms, 'Net 45');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('group', { name: 'Payment terms' });
    expect(await axe(container)).toHaveNoViolations();
  });
});
