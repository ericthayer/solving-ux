import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PermissionAwareAction, describeReason } from './PermissionAwareAction';
import type { ActionPermission, DeniedReason } from './PermissionAwareAction';

expect.extend(toHaveNoViolations);

const roleReason: DeniedReason = { kind: 'role', requiredRole: 'Editor', grantedBy: 'Your workspace admin' };
const denied: ActionPermission = { status: 'denied', reason: roleReason };

function setup(permission: ActionPermission, extra: { onRequestAccess?: jest.Mock } = {}) {
  const user = userEvent.setup();
  const onAction = jest.fn();
  const view = render(<PermissionAwareAction label="Edit request" permission={permission} onAction={onAction} {...extra} />);
  return { user, onAction, ...view };
}

describe('PermissionAwareAction', () => {
  it('runs an allowed action with no extra description', async () => {
    const { user, onAction } = setup({ status: 'allowed' });
    const button = screen.getByRole('button', { name: 'Edit request' });
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(button).not.toHaveAccessibleDescription();
    await user.click(button);
    expect(onAction).toHaveBeenCalledWith('run');
  });

  it('keeps a denied action focusable, marks it unavailable, and describes the reason', async () => {
    const { user } = setup(denied);
    const button = screen.getByRole('button', { name: 'Edit request' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAccessibleDescription('Requires the Editor role. Your workspace admin can grant it.');
    await user.tab();
    expect(button).toHaveFocus();
  });

  it('refuses a denied action and announces why instead (edge case: click and Enter)', async () => {
    const { user, onAction } = setup(denied);
    const button = screen.getByRole('button', { name: 'Edit request' });
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Edit request is unavailable. Requires the Editor role.');
  });

  it('offers a request control for role reasons and keeps focus after sending', async () => {
    const onRequestAccess = jest.fn();
    const { user } = setup(denied, { onRequestAccess });
    const request = screen.getByRole('button', { name: /^Request access\s?: Edit request$/ });
    await user.click(request);
    expect(onRequestAccess).toHaveBeenCalledWith(roleReason);
    expect(request).toHaveFocus();
    expect(request).toHaveAttribute('aria-disabled', 'true');
    await user.click(request);
    expect(onRequestAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Request sent for Edit request.');
  });

  it('offers no request control for record-state reasons (edge case)', () => {
    setup({ status: 'denied', reason: { kind: 'record-state', state: 'locked', resolution: 'An admin can unlock it.' } }, { onRequestAccess: jest.fn() });
    expect(screen.queryByRole('button', { name: /Request/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit request' })).toHaveAccessibleDescription('Unavailable while this record is locked. An admin can unlock it.');
  });

  it('allows needs-approval actions and says so before the click', async () => {
    const { user, onAction } = setup({ status: 'needs-approval', approver: 'an admin' });
    const button = screen.getByRole('button', { name: /Edit request/ });
    expect(button).toHaveAccessibleDescription('Sends a request to an admin instead of acting immediately.');
    await user.click(button);
    expect(onAction).toHaveBeenCalledWith('request-approval');
  });

  it('renders nothing for not-applicable actions (edge case)', () => {
    const { container } = setup({ status: 'not-applicable' });
    expect(container).toBeEmptyDOMElement();
  });

  it('describes quota reasons with usage and who can raise the limit', () => {
    expect(describeReason({ kind: 'quota', used: 5, limit: 5, unit: 'seats', grantedBy: 'Billing' })).toBe('5 of 5 seats used. Billing can raise the limit.');
  });

  it('has no axe violations in every state', async () => {
    const { container } = render(
      <div>
        <PermissionAwareAction label="Edit" permission={{ status: 'allowed' }} onAction={jest.fn()} />
        <PermissionAwareAction label="Invite" permission={denied} onAction={jest.fn()} onRequestAccess={jest.fn()} />
        <PermissionAwareAction label="Delete" tone="danger" permission={{ status: 'needs-approval', approver: 'an admin' }} onAction={jest.fn()} />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
