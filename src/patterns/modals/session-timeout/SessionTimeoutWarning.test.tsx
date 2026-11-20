import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { formatSpoken, SessionTimeoutWarning } from './SessionTimeoutWarning';
import type { SessionMessage, SessionTimeoutWarningProps } from './SessionTimeoutWarning';

expect.extend(toHaveNoViolations);

// jsdom has no modal dialogs or BroadcastChannel. Minimal stand-ins that mirror browser behavior.
class FakeChannel {
  static open: FakeChannel[] = [];
  onmessage: ((event: MessageEvent<SessionMessage>) => void) | null = null;
  constructor(readonly name: string) {
    FakeChannel.open.push(this);
  }
  postMessage(data: SessionMessage): void {
    for (const other of FakeChannel.open) {
      if (other !== this && other.name === this.name) other.onmessage?.({ data } as MessageEvent<SessionMessage>);
    }
  }
  close(): void {
    FakeChannel.open = FakeChannel.open.filter((c) => c !== this);
  }
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = FakeChannel;
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  FakeChannel.open = [];
});

const SESSION_MS = 30_000;
const WARNING_MS = 20_000;

function setup(props: Partial<SessionTimeoutWarningProps> = {}) {
  const handlers = { onExtend: jest.fn(), onSignOut: jest.fn(), onExpire: jest.fn(), onSignIn: jest.fn() };
  const utils = render(
    <>
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" />
      <SessionTimeoutWarning sessionMs={SESSION_MS} warningMs={WARNING_MS} {...handlers} {...props} />
    </>,
  );
  const field = screen.getByLabelText('Notes');
  field.focus();
  return { ...utils, ...handlers, field };
}

const advance = (ms: number): void => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

describe('SessionTimeoutWarning', () => {
  it('opens a labelled alertdialog with the time left and focuses Stay signed in', () => {
    setup();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    advance(SESSION_MS - WARNING_MS);
    const dialog = screen.getByRole('alertdialog', { name: 'Your session is about to end' });
    expect(dialog).toHaveAccessibleDescription(/Time remaining: 20 seconds/);
    expect(screen.getByRole('button', { name: 'Stay signed in' })).toHaveFocus();
  });

  it('extends the session and returns focus to where the user was', async () => {
    const { field, onExtend } = setup();
    advance(SESSION_MS - WARNING_MS);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stay signed in' }));
    });
    expect(onExtend).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(field).toHaveFocus();
    advance(SESSION_MS - WARNING_MS - 1000);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('treats key presses before the warning as activity', () => {
    const { field } = setup();
    advance(8_000);
    fireEvent.keyDown(field, { key: 'a' });
    advance(8_000);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    advance(2_000);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('announces only at thresholds, not every second (edge case)', () => {
    setup({ announceAt: [10] });
    advance(SESSION_MS - WARNING_MS);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    advance(5_000);
    expect(status).toBeEmptyDOMElement();
    advance(5_000);
    expect(status).toHaveTextContent('10 seconds remaining before you are signed out.');
    advance(1_000);
    expect(status).toHaveTextContent('10 seconds remaining');
  });

  it('on expiry calls onExpire, says so, and focuses Sign in again', () => {
    const { onExpire, onSignIn } = setup();
    advance(SESSION_MS - WARNING_MS);
    advance(WARNING_MS);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alertdialog', { name: 'You have been signed out' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('You have been signed out.');
    const signIn = screen.getByRole('button', { name: 'Sign in again' });
    expect(signIn).toHaveFocus();
    fireEvent.click(signIn);
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open with the error when extending fails (edge case)', async () => {
    setup({ onExtend: jest.fn().mockRejectedValue(new Error('Network is unavailable. Try again.')) });
    advance(SESSION_MS - WARNING_MS);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stay signed in' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Network is unavailable. Try again.');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('Escape extends instead of leaving the timer running (edge case)', async () => {
    const { onExtend } = setup();
    advance(SESSION_MS - WARNING_MS);
    const cancel = new Event('cancel', { cancelable: true });
    await act(async () => {
      fireEvent(screen.getByRole('alertdialog'), cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onExtend).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('closes the warning when another tab extends the session (edge case)', () => {
    setup();
    advance(SESSION_MS - WARNING_MS);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    const otherTab = new FakeChannel('sux-session');
    act(() => otherTab.postMessage({ type: 'extended', expiresAt: Date.now() + SESSION_MS }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('signs out every tab from Sign out now', () => {
    const { onSignOut } = setup();
    const otherTab = new FakeChannel('sux-session');
    const received: SessionMessage[] = [];
    otherTab.onmessage = (event) => received.push(event.data);
    advance(SESSION_MS - WARNING_MS);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out now' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(received).toContainEqual({ type: 'signed-out' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('expires on return when a background tab slept past the deadline (edge case)', () => {
    const { onExpire } = setup();
    act(() => {
      jest.setSystemTime(Date.now() + SESSION_MS + 60_000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alertdialog', { name: 'You have been signed out' })).toBeInTheDocument();
  });

  it('speaks durations in words', () => {
    expect(formatSpoken(120)).toBe('2 minutes');
    expect(formatSpoken(61)).toBe('1 minute 1 second');
    expect(formatSpoken(10)).toBe('10 seconds');
  });

  it('has no axe violations while warning', async () => {
    setup();
    advance(SESSION_MS - WARNING_MS);
    jest.useRealTimers();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
