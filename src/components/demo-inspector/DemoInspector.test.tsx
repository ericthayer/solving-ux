import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DemoInspector } from './DemoInspector';
import { getTabStops } from './tabbable';

expect.extend(toHaveNoViolations);

function Fixture({ onClick = jest.fn() }: { onClick?: () => void }): JSX.Element {
  return (
    <DemoInspector className="frame">
      <button type="button" onClick={onClick}>
        Save
      </button>
      <a href="#docs">Docs</a>
      <button type="button" disabled>
        Disabled
      </button>
      <span tabIndex={-1}>Programmatic only</span>
      <fieldset>
        <legend>Plan</legend>
        <label>
          <input type="radio" name="plan" value="a" /> A
        </label>
        <label>
          <input type="radio" name="plan" value="b" defaultChecked /> B
        </label>
      </fieldset>
      <div hidden>
        <button type="button">Hidden</button>
      </div>
      <input aria-label="Jump ahead" tabIndex={2} />
    </DemoInspector>
  );
}

describe('getTabStops', () => {
  it('orders positive tabindex first, skips disabled/hidden/negative stops, and keeps one stop per radio group', () => {
    const { container } = render(<Fixture />);
    const root = container.querySelector<HTMLElement>('.frame')!;
    const stops = getTabStops(root);
    expect(stops.map((s) => s.label)).toEqual(['Jump ahead', 'Save', 'Docs', 'B']);
    expect(stops[0]?.positiveTabIndex).toBe(true);
    expect(stops.map((s) => s.order)).toEqual([1, 2, 3, 4]);
  });

  it('confines stops to an open modal dialog', () => {
    const { container } = render(
      <div className="frame">
        <button type="button">Behind</button>
        <dialog open>
          <button type="button">Inside</button>
        </dialog>
      </div>,
    );
    const dialog = container.querySelector('dialog')!;
    const matches = dialog.matches.bind(dialog);
    jest.spyOn(dialog, 'matches').mockImplementation((sel: string) => sel === ':modal' || matches(sel));
    expect(getTabStops(container.querySelector<HTMLElement>('.frame')!).map((s) => s.label)).toEqual(['Inside']);
  });
});

describe('DemoInspector', () => {
  it('has no axe violations with both tools on', async () => {
    const user = userEvent.setup();
    // The shared fixture uses a positive tabindex on purpose; axe rightly flags that, so audit a clean demo here.
    const { baseElement } = render(
      <main>
        <DemoInspector>
          <button type="button">Save</button>
        </DemoInspector>
      </main>,
    );
    await user.click(screen.getByRole('button', { name: 'Keyboard only' }));
    await user.click(screen.getByRole('button', { name: 'Show tab order' }));
    expect(baseElement.querySelector('[data-tab-order-overlay]')).not.toBeNull();
    expect(await axe(baseElement)).toHaveNoViolations();
  });

  it('keyboard only mode blocks pointer clicks but lets keyboard activation through', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<Fixture onClick={onClick} />);
    const toggle = screen.getByRole('button', { name: 'Keyboard only' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Pointer input is off');

    // Keyboard-synthesized clicks carry detail 0.
    fireEvent.click(screen.getByRole('button', { name: 'Save' }), { detail: 0 });
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows numbered stops, summarizes them, and tracks focus', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<Fixture />);
    await user.click(screen.getByRole('button', { name: 'Show tab order' }));

    expect(screen.getByRole('status')).toHaveTextContent('4 tab stops. 1 uses a positive tabindex.');
    const layer = baseElement.querySelector('[data-tab-order-overlay]')!;
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(Array.from(layer.querySelectorAll('span')).map((b) => b.textContent)).toEqual(['1', '2', '3', '4']);

    await act(async () => {
      screen.getByRole('button', { name: 'Save' }).focus();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    expect(screen.getByText('Focus on 2 of 4: Save.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show tab order' }));
    expect(baseElement.querySelector('[data-tab-order-overlay]')).toBeNull();
  });
});
