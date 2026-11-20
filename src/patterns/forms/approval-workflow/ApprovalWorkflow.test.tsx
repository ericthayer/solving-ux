import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ApprovalWorkflow, applyDecision } from './ApprovalWorkflow';
import type { ApprovalRequest, Decision } from './ApprovalWorkflow';
import { sampleRequest } from './data';

expect.extend(toHaveNoViolations);

/** The list that follows a section heading. */
const listAfter = (heading: string): HTMLElement => screen.getByRole('heading', { name: heading }).nextElementSibling as HTMLElement;

function Harness({ onDecide }: { onDecide?: (d: Decision) => Promise<void> }): JSX.Element {
  const [request, setRequest] = useState<ApprovalRequest>(sampleRequest);
  return (
    <ApprovalWorkflow
      request={request}
      currentUser="Marcus Lee"
      onDecide={async (d) => {
        await onDecide?.(d);
        setRequest((r) => applyDecision(r, d, '2026-11-20T12:00:00Z'));
      }}
    />
  );
}

describe('ApprovalWorkflow', () => {
  it('shows status as text, the approver chain, changes, and history', () => {
    render(<Harness />);
    expect(screen.getByText(/Status: In review/)).toHaveTextContent('waiting on you');
    const chain = listAfter('Approvers');
    expect(within(chain).getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
    const changes = screen.getByRole('table');
    expect(within(changes).getByRole('rowheader', { name: 'Unit price' })).toBeInTheDocument();
    const history = listAfter('Status history');
    expect(within(history).getAllByRole('listitem')).toHaveLength(4);
    expect(within(history).getByText(/expired/)).toBeInTheDocument();
  });

  it('requires a decision before submitting', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Record decision' }));
    expect(screen.getByText('Choose approve, request changes, or reject.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Approve' })).toHaveFocus();
  });

  it('requires a reason to reject and focuses the field (edge case)', async () => {
    const user = userEvent.setup();
    const onDecide = jest.fn().mockResolvedValue(undefined);
    render(<Harness onDecide={onDecide} />);
    await user.click(screen.getByRole('radio', { name: 'Reject' }));
    const submit = screen.getByRole('button', { name: 'Reject request' });
    expect(submit).toHaveAccessibleDescription(/closes and cannot be resubmitted/);
    await user.click(submit);
    const reason = screen.getByRole('textbox', { name: 'Reason' });
    expect(reason).toHaveFocus();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason).toHaveAccessibleDescription(/at least 10 characters/);
    expect(onDecide).not.toHaveBeenCalled();
  });

  it('approves, appends history, announces, and moves focus to the history', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('radio', { name: 'Approve' }));
    await user.click(screen.getByRole('button', { name: 'Approve request' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Approve recorded. PR-2048 moves to Ana Ruiz (Director).');
    expect(screen.getByRole('heading', { name: 'Status history' })).toHaveFocus();
    expect(screen.queryByRole('heading', { name: 'Your decision' })).not.toBeInTheDocument();
    expect(screen.getByText(/Status: In review/)).toHaveTextContent('waiting on Ana Ruiz');
    expect(within(listAfter('Status history')).getAllByRole('listitem')).toHaveLength(5);
  });

  it('keeps the comment and shows a retry message when the save fails (edge case)', async () => {
    const user = userEvent.setup();
    render(<Harness onDecide={jest.fn().mockRejectedValue(new Error('offline'))} />);
    await user.click(screen.getByRole('radio', { name: 'Request changes' }));
    await user.type(screen.getByRole('textbox', { name: 'Reason' }), 'Split the order across two quarters.');
    await user.click(screen.getByRole('button', { name: 'Send back for changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your comment is still here');
    expect(screen.getByRole('textbox', { name: 'Reason' })).toHaveValue('Split the order across two quarters.');
  });

  it('hides the decision panel from someone who is not the current approver', () => {
    render(<ApprovalWorkflow request={sampleRequest()} currentUser="Ana Ruiz" onDecide={jest.fn()} />);
    expect(screen.queryByRole('heading', { name: 'Your decision' })).not.toBeInTheDocument();
    expect(screen.getByText(/Status: In review/)).toHaveTextContent('waiting on Marcus Lee');
  });

  it('applyDecision completes the chain, rejects, and returns for changes', () => {
    const at = '2026-11-20T12:00:00Z';
    const afterFinance = applyDecision(sampleRequest(), { kind: 'approve', comment: '' }, at);
    const done = applyDecision(afterFinance, { kind: 'approve', comment: 'OK' }, at);
    expect(done.status).toBe('approved');
    expect(done.changesSinceLastReview).toEqual([]);
    expect(applyDecision(done, { kind: 'reject', comment: 'late' }, at)).toBe(done);
    const rejected = applyDecision(sampleRequest(), { kind: 'reject', comment: 'Over budget for Q4.' }, at);
    expect(rejected.status).toBe('rejected');
    expect(rejected.history.at(-1)).toMatchObject({ kind: 'rejected', actor: 'Marcus Lee', comment: 'Over budget for Q4.' });
    const returned = applyDecision(sampleRequest(), { kind: 'request-changes', comment: 'Need a second quote.' }, at);
    expect(returned.status).toBe('changes-requested');
    expect(returned.approvers[0]!.decision).toBe('approved');
  });

  it('has no axe violations with an error showing', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.click(screen.getByRole('radio', { name: 'Reject' }));
    await user.click(screen.getByRole('button', { name: 'Reject request' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
