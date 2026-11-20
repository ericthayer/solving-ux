import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StickyFocusLayout, obscuredOffset, shouldPin } from './StickyFocusLayout';
import type { StickyScroller } from './StickyFocusLayout';

expect.extend(toHaveNoViolations);

/** jsdom has no layout. Give the boxes the sizes a browser would. */
function stubSize(el: HTMLElement, props: Partial<Record<'offsetHeight' | 'clientHeight', number>>): void {
  for (const [key, value] of Object.entries(props)) Object.defineProperty(el, key, { configurable: true, value });
}

function rect(top: number, bottom: number): DOMRect {
  return { top, bottom, left: 0, right: 100, width: 100, height: bottom - top, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
}

function setup(scroller: StickyScroller = 'self', onPinnedChange = jest.fn()) {
  const user = userEvent.setup();
  const utils = render(
    <StickyFocusLayout
      label="Edit project"
      scroller={scroller}
      onPinnedChange={onPinnedChange}
      header={<h2>Edit project</h2>}
      actions={<button type="submit">Save changes</button>}
    >
      <label htmlFor="first">First</label>
      <input id="first" />
      <label htmlFor="last">Last</label>
      <input id="last" />
    </StickyFocusLayout>,
  );
  const region = screen.getByRole('region', { name: 'Edit project' });
  const header = region.querySelector('header')!;
  const footer = region.querySelector('footer')!;
  /** Sizes the boxes and fires a resize so the layout re-measures. */
  const layout = (top: number, bottom: number, viewport: number): void => {
    stubSize(header, { offsetHeight: top });
    stubSize(footer, { offsetHeight: bottom });
    stubSize(region, { clientHeight: viewport });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: viewport });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
  };
  return { user, region, header, footer, layout, onPinnedChange, ...utils };
}

describe('shouldPin and obscuredOffset', () => {
  it('pins while both bars cover 40% or less of the visible height', () => {
    expect(shouldPin({ top: 48, bottom: 56, viewport: 480 }, 0.4)).toBe(true);
    expect(shouldPin({ top: 48, bottom: 56, viewport: 120 }, 0.4)).toBe(false);
    expect(shouldPin({ top: 0, bottom: 0, viewport: 0 }, 0.4)).toBe(false);
  });

  it('returns the scroll needed to clear each bar, and 0 when clear', () => {
    const visible = { top: 50, bottom: 400 };
    expect(obscuredOffset({ top: 100, bottom: 140 }, visible, 8)).toBe(0);
    expect(obscuredOffset({ top: 380, bottom: 420 }, visible, 8)).toBe(28);
    expect(obscuredOffset({ top: 20, bottom: 60 }, visible, 8)).toBe(-38);
  });

  it('aligns a target taller than the gap to the top instead of hiding its start (edge case)', () => {
    expect(obscuredOffset({ top: 100, bottom: 900 }, { top: 50, bottom: 400 }, 8)).toBe(42);
  });
});

describe('StickyFocusLayout', () => {
  it('renders header, content, then actions in DOM and tab order', async () => {
    const { user } = setup();
    await user.tab();
    expect(screen.getByLabelText('First')).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveFocus();
  });

  it('writes measured bar heights into the scroll-padding variables', () => {
    const { region, layout } = setup();
    layout(48, 56, 480);
    expect(region).toHaveAttribute('data-pinned', 'true');
    expect(region.style.getPropertyValue('--sux-sticky-top')).toBe('48px');
    expect(region.style.getPropertyValue('--sux-sticky-bottom')).toBe('56px');
  });

  it('unpins and zeroes the padding when the bars would cover too much (400% zoom)', () => {
    const { region, layout, onPinnedChange } = setup();
    layout(48, 56, 120);
    expect(region).toHaveAttribute('data-pinned', 'false');
    expect(region.style.getPropertyValue('--sux-sticky-top')).toBe('0px');
    expect(onPinnedChange).toHaveBeenLastCalledWith(false);
  });

  it('scrolls a focused field out from under the action bar', async () => {
    const { region, header, footer, layout } = setup();
    layout(48, 56, 300);
    jest.spyOn(header, 'getBoundingClientRect').mockReturnValue(rect(0, 48));
    jest.spyOn(footer, 'getBoundingClientRect').mockReturnValue(rect(244, 300));
    const last = screen.getByLabelText('Last');
    jest.spyOn(last, 'getBoundingClientRect').mockReturnValue(rect(250, 286));
    region.scrollTop = 100;
    act(() => last.focus());
    await waitFor(() => expect(region.scrollTop).toBe(150));
  });

  it('leaves the scroll alone when focus moves inside a bar', async () => {
    const { region, layout } = setup();
    layout(48, 56, 300);
    region.scrollTop = 100;
    act(() => screen.getByRole('button', { name: 'Save changes' }).focus());
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(region.scrollTop).toBe(100);
  });

  it('sets and restores scroll-padding on <html> in page mode', () => {
    const root = document.documentElement;
    root.style.scrollPaddingTop = '4px';
    const { layout, unmount } = setup('page');
    layout(48, 56, 800);
    expect(root.style.scrollPaddingTop).toBe('56px');
    expect(root.style.scrollPaddingBottom).toBe('64px');
    unmount();
    expect(root.style.scrollPaddingTop).toBe('4px');
  });

  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
