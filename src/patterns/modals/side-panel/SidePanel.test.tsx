import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useState } from 'react';
import { SidePanel } from './SidePanel';
import type { SidePanelLayout } from './SidePanel';
import { useRecordParam } from './useRecordParam';

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

afterEach(() => window.history.replaceState(null, '', '/'));

const RECORDS = ['Inspect fire doors', 'Replace air filters', 'Clear roof drains'];

type HarnessProps = { layout?: SidePanelLayout; initial?: string | null };

function Harness({ layout = 'inline', initial = null }: HarnessProps): JSX.Element {
  const [records, setRecords] = useState(RECORDS);
  const [open, setOpen] = useState<string | null>(initial);
  return (
    <>
      <button type="button">Before the list</button>
      <SidePanel
        layout={layout}
        recordKey={open}
        title={open ?? ''}
        subtitle="WO-1041 · Open"
        onClose={() => setOpen(null)}
        master={
          <ul data-testid="list">
            {records.map((r) => (
              <li key={r}>
                <button type="button" aria-current={r === open ? 'true' : undefined} onClick={() => setOpen(r)}>
                  {r}
                </button>
              </li>
            ))}
          </ul>
        }
      >
        <p>Details for {open}</p>
        <button type="button" onClick={() => setRecords((all) => all.filter((r) => r !== open))}>
          Delete record
        </button>
      </SidePanel>
    </>
  );
}

function setup(props: HarnessProps = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  return { user };
}

describe('SidePanel', () => {
  it('opens a region named by the record and moves focus to its heading', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Inspect fire doors' }));
    const region = screen.getByRole('region', { name: 'Inspect fire doors' });
    expect(screen.getByRole('heading', { name: 'Inspect fire doors' })).toHaveFocus();
    expect(region).toHaveTextContent('Details for Inspect fire doors');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the row that opened it', async () => {
    const { user } = setup();
    const row = screen.getByRole('button', { name: 'Replace air filters' });
    await user.click(row);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Replace air filters' })).not.toBeInTheDocument();
    expect(row).toHaveFocus();
  });

  it('keeps the list mounted, so its scroll position survives open and close', async () => {
    const { user } = setup();
    const list = screen.getByTestId('list');
    list.scrollTop = 120;
    await user.click(screen.getByRole('button', { name: 'Clear roof drains' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByTestId('list')).toBe(list);
    expect(list.scrollTop).toBe(120);
    expect(screen.getByRole('button', { name: 'Clear roof drains' })).toHaveFocus();
  });

  it('returns focus to the latest row after switching records while open', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Inspect fire doors' }));
    const second = screen.getByRole('button', { name: 'Replace air filters' });
    await user.click(second);
    expect(screen.getByRole('heading', { name: 'Replace air filters' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(second).toHaveFocus();
  });

  it('lands on the list when the triggering row no longer exists (edge case)', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Inspect fire doors' }));
    await user.click(screen.getByRole('button', { name: 'Delete record' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByTestId('list').parentElement).toHaveFocus();
  });

  it('does not steal focus when a deep link opens a record on load (edge case)', () => {
    setup({ initial: 'Replace air filters' });
    expect(screen.getByRole('region', { name: 'Replace air filters' })).toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });

  it('becomes a modal sheet with a Back to list button in narrow containers', async () => {
    const { user } = setup({ layout: 'sheet' });
    const row = screen.getByRole('button', { name: 'Inspect fire doors' });
    await user.click(row);
    expect(screen.getByRole('dialog', { name: 'Inspect fire doors' })).toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Inspect fire doors' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Back to list' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(row).toHaveFocus();
  });

  it('closes the sheet on the native cancel event without letting the browser close it (edge case)', async () => {
    const { user } = setup({ layout: 'sheet' });
    await user.click(screen.getByRole('button', { name: 'Inspect fire doors' }));
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(screen.getByRole('dialog'), cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no axe violations open inline and as a sheet', async () => {
    const inline = setup();
    await inline.user.click(screen.getByRole('button', { name: 'Inspect fire doors' }));
    expect(await axe(document.body)).toHaveNoViolations();
    document.body.innerHTML = '';
    const sheet = setup({ layout: 'sheet' });
    await sheet.user.click(screen.getByRole('button', { name: 'Inspect fire doors' }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('useRecordParam', () => {
  it('reads the record from the URL and writes changes back without adding history entries', () => {
    window.history.replaceState({ idx: 3 }, '', '/patterns/modals/side-panel?tab=preview&record=WO-1041');
    const before = window.history.length;
    const { result } = renderHook(() => useRecordParam('record'));
    expect(result.current[0]).toBe('WO-1041');

    act(() => result.current[1]('WO-1042'));
    expect(window.location.search).toBe('?tab=preview&record=WO-1042');
    act(() => result.current[1](null));
    expect(window.location.search).toBe('?tab=preview');
    expect(result.current[0]).toBeNull();
    expect(window.history.length).toBe(before);
    expect(window.history.state).toEqual({ idx: 3 });
  });
});
