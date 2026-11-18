import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ToastProvider, useToast } from './ToastStack';
import type { ToastInput } from './ToastStack';

expect.extend(toHaveNoViolations);

function Trigger({ input }: { input: ToastInput }): JSX.Element {
  const { notify } = useToast();
  return (
    <button type="button" onClick={() => notify(input)}>
      Notify {input.title}
    </button>
  );
}

function setup(inputs: ToastInput[], maxVisible = 3) {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(
    <ToastProvider maxVisible={maxVisible} defaultDuration={5000}>
      {inputs.map((input) => (
        <Trigger key={input.title} input={input} />
      ))}
    </ToastProvider>,
  );
  const list = () => screen.queryByRole('region', { name: /Notifications/ });
  return { user, list };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('ToastStack', () => {
  it('renders a toast in a labelled region and announces it politely', async () => {
    const { user, list } = setup([{ tone: 'success', title: 'Draft saved' }]);
    expect(list()).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Notify Draft saved' }));
    expect(within(list()!).getByText('Draft saved')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Success: Draft saved');
  });

  it('announces errors assertively and keeps them until dismissed', async () => {
    const { user } = setup([{ tone: 'error', title: 'Payment failed', description: 'Card declined.' }]);
    await user.click(screen.getByRole('button', { name: 'Notify Payment failed' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Payment failed. Card declined.');
    act(() => jest.advanceTimersByTime(60000));
    expect(screen.getByRole('button', { name: 'Dismiss: Payment failed' })).toBeInTheDocument();
  });

  it('auto-dismisses non-error toasts and pauses while hovered', async () => {
    const { user, list } = setup([{ tone: 'info', title: 'Export started' }]);
    await user.click(screen.getByRole('button', { name: 'Notify Export started' }));
    await user.hover(list()!);
    act(() => jest.advanceTimersByTime(10000));
    expect(screen.getByText('Export started')).toBeInTheDocument();
    await user.unhover(list()!);
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.queryByText('Export started')).not.toBeInTheDocument();
  });

  it('moves focus to the newest toast with F8 and dismisses it with Escape', async () => {
    const { user } = setup([{ tone: 'warning', title: 'Rate lock expires today' }]);
    await user.click(screen.getByRole('button', { name: /Rate lock/ }));
    await user.keyboard('{F8}');
    const toast = screen.getByRole('listitem', { name: 'Rate lock expires today' });
    expect(toast).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Rate lock expires today')).not.toBeInTheDocument();
  });

  it('caps visible toasts, queues the rest, and puts errors first (edge case)', async () => {
    const inputs: ToastInput[] = [
      { tone: 'info', title: 'One' },
      { tone: 'info', title: 'Two' },
      { tone: 'info', title: 'Three' },
      { tone: 'error', title: 'Sync failed' },
    ];
    const { user, list } = setup(inputs, 2);
    for (const input of inputs) await user.click(screen.getByRole('button', { name: `Notify ${input.title}` }));
    const items = within(list()!).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Sync failed');
    expect(screen.getByText('2 more')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss all' }));
    expect(list()).not.toBeInTheDocument();
  });

  it('throws a clear error when used outside the provider (edge case)', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger input={{ tone: 'info', title: 'x' }} />)).toThrow('useToast must be used inside <ToastProvider>.');
    spy.mockRestore();
  });

  it('has no axe violations with toasts showing', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    const { container } = render(
      <ToastProvider>
        <Trigger input={{ tone: 'success', title: 'Saved', action: { label: 'Undo', onClick: () => undefined } }} />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Notify Saved' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
