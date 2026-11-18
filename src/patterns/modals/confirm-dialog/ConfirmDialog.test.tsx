import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import type { ConfirmDialogProps } from './ConfirmDialog';

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

type HarnessProps = Partial<ConfirmDialogProps>;

function Harness(props: HarnessProps): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete facility
      </button>
      <ConfirmDialog
        open={open}
        title="Delete facility?"
        description={<p>This removes the facility from the borrower record.</p>}
        confirmLabel="Delete facility"
        tone="danger"
        onConfirm={jest.fn()}
        onClose={() => setOpen(false)}
        {...props}
      />
    </>
  );
}

async function openDialog(props: HarnessProps = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  const trigger = screen.getByRole('button', { name: 'Delete facility' });
  await user.click(trigger);
  return { user, trigger };
}

describe('ConfirmDialog', () => {
  it('opens as a labelled alertdialog for destructive actions', async () => {
    await openDialog();
    const dialog = screen.getByRole('alertdialog', { name: 'Delete facility?' });
    expect(dialog).toHaveAccessibleDescription('This removes the facility from the borrower record.');
  });

  it('focuses Cancel first and returns focus to the trigger on close', async () => {
    const { user, trigger } = await openDialog();
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape through the native cancel event', async () => {
    await openDialog();
    const dialog = screen.getByRole('alertdialog');
    const cancelEvent = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('requires the exact confirmation text before enabling the action', async () => {
    const onConfirm = jest.fn();
    const { user } = await openDialog({ requireText: 'FAC-2231', onConfirm });
    const confirm = screen.getAllByRole('button', { name: 'Delete facility' }).at(-1)!;
    expect(screen.getByLabelText(/Type FAC-2231 to confirm/)).toHaveFocus();
    expect(confirm).toBeDisabled();
    await user.keyboard('FAC-2231{Enter}');
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('stays open and announces the error when confirm fails (edge case)', async () => {
    const onConfirm = jest.fn().mockRejectedValue(new Error('Facility has an active draw.'));
    const { user } = await openDialog({ onConfirm });
    await user.click(screen.getAllByRole('button', { name: 'Delete facility' }).at(-1)!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Facility has an active draw.');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('ignores backdrop clicks for danger tone (edge case)', async () => {
    const { user } = await openDialog();
    await user.click(screen.getByRole('alertdialog'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    await openDialog({ consequences: ['2 scheduled draws will be cancelled.'] });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
