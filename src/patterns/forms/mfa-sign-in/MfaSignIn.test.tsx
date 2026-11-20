import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MfaSignIn, formatWait, normalizeCode, validateCode } from './MfaSignIn';
import type { MfaAuthAdapter } from './MfaSignIn';

expect.extend(toHaveNoViolations);

const fakeAuth = (overrides: Partial<MfaAuthAdapter> = {}): MfaAuthAdapter => ({
  verifyPassword: jest.fn(async (_email: string, password: string) =>
    password === 'right' ? { status: 'code-required' as const, destination: 'your phone ending in 0142' } : { status: 'invalid' as const, message: 'The email or password is incorrect.' },
  ),
  verifyCode: jest.fn(async (code: string) =>
    code === '246810' ? { status: 'signed-in' as const } : { status: 'invalid' as const, message: 'This code has expired. Select Send a new code.' },
  ),
  resendCode: jest.fn(async () => undefined),
  signInWithPasskey: jest.fn(async () => ({ status: 'signed-in' as const })),
  sendEmailLink: jest.fn(async () => undefined),
  ...overrides,
});

function setup(auth = fakeAuth(), onSignedIn = jest.fn()) {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(<MfaSignIn auth={auth} onSignedIn={onSignedIn} />);
  return { user, auth, onSignedIn };
}

async function reachCode(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('Email address'), 'sam@example.com');
  await user.type(screen.getByLabelText('Password'), 'right{Enter}');
  await screen.findByRole('heading', { name: 'Enter your verification code' });
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('MfaSignIn', () => {
  it('uses the autocomplete tokens password managers look for and never blocks paste', async () => {
    const { user } = setup();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('autocomplete', 'username');
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    await user.click(password);
    await user.paste('correct horse battery');
    expect(password).toHaveValue('correct horse battery');
  });

  it('toggles password visibility with a stable button name', async () => {
    const { user } = setup();
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });

  it('focuses the first empty field and links its error', async () => {
    const { user, auth } = setup();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const email = screen.getByLabelText('Email address');
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Enter your email address.');
    expect(auth.verifyPassword).not.toHaveBeenCalled();
  });

  it('keeps both values and announces an alert when credentials are wrong', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Email address'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong{Enter}');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The email or password is incorrect.'));
    expect(screen.getByLabelText('Email address')).toHaveValue('sam@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('wrong');
  });

  it('moves focus to the code step and accepts a pasted code with spaces', async () => {
    const { user, onSignedIn } = setup();
    await reachCode(user);
    expect(screen.getByRole('heading', { name: 'Enter your verification code' })).toHaveFocus();
    const code = screen.getByLabelText('Verification code');
    expect(code).toHaveAttribute('autocomplete', 'one-time-code');
    expect(code).toHaveAttribute('inputmode', 'numeric');
    expect(code).toHaveAccessibleDescription(/We sent a 6-digit code to your phone ending in 0142/);
    await user.click(code);
    await user.paste('246 810');
    await user.keyboard('{Enter}');
    await act(async () => undefined);
    expect(onSignedIn).toHaveBeenCalledWith('sam@example.com');
  });

  it('keeps a rejected code on screen with a fixable error (edge case: expired code)', async () => {
    const { user } = setup();
    await reachCode(user);
    await user.type(screen.getByLabelText('Verification code'), '000000{Enter}');
    const code = screen.getByLabelText('Verification code');
    expect(await screen.findByText('This code has expired. Select Send a new code.')).toBeInTheDocument();
    expect(code).toHaveValue('000000');
    expect(code).toHaveFocus();
  });

  it('shows the resend wait, keeps the button focusable, and confirms a new code', async () => {
    const { user, auth } = setup();
    await reachCode(user);
    const resend = screen.getByRole('button', { name: 'Send a new code' });
    expect(resend).toHaveAttribute('aria-disabled', 'true');
    expect(resend).toHaveAccessibleDescription('Available in 0:30');
    await user.click(resend);
    expect(auth.resendCode).not.toHaveBeenCalled();
    // One tick per second, so React re-arms the timer between ticks.
    for (let i = 0; i < 30; i += 1) act(() => jest.advanceTimersByTime(1000));
    expect(resend).not.toHaveAttribute('aria-disabled');
    await user.click(resend);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('We sent a new code to your phone ending in 0142.'));
  });

  it('offers a passkey that signs in without a password', async () => {
    const { user, onSignedIn } = setup();
    await user.click(screen.getByRole('button', { name: 'Sign in with a passkey' }));
    expect(onSignedIn).toHaveBeenCalled();
  });

  it('asks for an email before sending a sign-in link (edge case)', async () => {
    const { user, auth } = setup();
    await user.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    expect(screen.getByLabelText('Email address')).toHaveAccessibleDescription('Enter your email address to get a sign-in link.');
    expect(auth.sendEmailLink).not.toHaveBeenCalled();
  });

  it('hides passwordless options the adapter does not support (edge case)', () => {
    setup(fakeAuth({ signInWithPasskey: undefined, sendEmailLink: undefined }));
    expect(screen.queryByRole('heading', { name: 'Or sign in without a password' })).not.toBeInTheDocument();
  });

  it('keeps data and says so when the network fails (edge case)', async () => {
    const { user } = setup(fakeAuth({ verifyPassword: jest.fn().mockRejectedValue(new Error('offline')) }));
    await user.type(screen.getByLabelText('Email address'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'right{Enter}');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Nothing you entered was lost'));
    expect(screen.getByLabelText('Password')).toHaveValue('right');
  });

  it('normalizes and validates codes', () => {
    expect(normalizeCode(' 246-810 ')).toBe('246810');
    expect(validateCode('', 6)).toBe('Enter the 6-digit code.');
    expect(validateCode('24681O', 6)).toMatch(/letters or symbols/);
    expect(validateCode('2468', 6)).toBe('The code is 6 digits. You entered 4.');
    expect(validateCode('246810', 6)).toBeNull();
    expect(formatWait(75)).toBe('1:15');
  });

  it('has no axe violations on either step with errors showing', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    const { container } = render(<MfaSignIn auth={fakeAuth()} onSignedIn={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await axe(container)).toHaveNoViolations();
    await reachCode(user);
    await user.type(screen.getByLabelText('Verification code'), '12{Enter}');
    expect(await axe(container)).toHaveNoViolations();
  });
});
