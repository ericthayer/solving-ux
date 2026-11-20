import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PagedList, pageWindow } from './PagedList';
import type { PagedListProps } from './PagedList';

expect.extend(toHaveNoViolations);

type Item = { id: string; name: string };

const items: Item[] = Array.from({ length: 23 }, (_, i) => ({ id: `R-${i + 1}`, name: `Request ${i + 1}` }));

function setup(overrides: Partial<PagedListProps<Item>> = {}) {
  const user = userEvent.setup();
  const utils = render(
    <PagedList<Item>
      label="Requests"
      noun="requests"
      items={items}
      mode="pages"
      pageSize={5}
      renderItem={(item) => <button type="button">{item.name}</button>}
      {...overrides}
    />,
  );
  return { ...utils, user };
}

const list = (): HTMLElement => screen.getByRole('list', { name: 'Requests' });

beforeEach(() => sessionStorage.clear());

describe('PagedList: pages mode', () => {
  it('renders one page with positions in the full set', () => {
    setup();
    const rows = within(list()).getAllByRole('listitem');
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveAttribute('aria-posinset', '1');
    expect(rows[0]).toHaveAttribute('aria-setsize', '23');
    expect(screen.getByText('1–5 of 23')).toBeInTheDocument();
  });

  it('marks the current page with aria-current, moves focus to the list, and announces the range', async () => {
    const { user } = setup();
    const nav = screen.getByRole('navigation', { name: 'Requests pages' });
    expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await user.click(within(nav).getByRole('button', { name: 'Page 2' }));
    expect(within(nav).getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Page 1' })).not.toHaveAttribute('aria-current');
    expect(list()).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Page 2 of 5. Requests 6 to 10 of 23.');
    expect(within(list()).getAllByRole('listitem')[0]).toHaveAttribute('aria-posinset', '6');
  });

  it('disables Previous on the first page and Next on the last', async () => {
    const { user } = setup();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(within(list()).getAllByRole('listitem')).toHaveLength(3);
  });

  it('collapses long page runs (edge case: 10,000 rows)', () => {
    expect(pageWindow(0, 1000)).toEqual([0, 1, 'gap', 999]);
    expect(pageWindow(500, 1000)).toEqual([0, 'gap', 499, 500, 501, 'gap', 999]);
    expect(pageWindow(0, 1)).toEqual([0]);
  });

  it('hides navigation when everything fits on one page (edge case)', () => {
    setup({ items: items.slice(0, 3) });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('shows an empty message with no items (edge case)', () => {
    setup({ items: [] });
    expect(screen.getByText('No requests to show.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('PagedList: load more', () => {
  it('moves focus to the first new item and announces the count', async () => {
    const { user } = setup({ mode: 'load-more' });
    await user.click(screen.getByRole('button', { name: 'Load 5 more' }));
    const rows = within(list()).getAllByRole('listitem');
    expect(rows).toHaveLength(10);
    expect(rows[5]).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Loaded 5 more. Showing 10 of 23 requests.');
  });

  it('loads only what remains, then says everything is shown', async () => {
    const { user } = setup({ mode: 'load-more', pageSize: 10 });
    await user.click(screen.getByRole('button', { name: 'Load 10 more' }));
    await user.click(screen.getByRole('button', { name: 'Load 3 more' }));
    expect(screen.queryByRole('button', { name: /Load/ })).not.toBeInTheDocument();
    expect(screen.getByText('All 23 requests shown.')).toBeInTheDocument();
  });
});

describe('PagedList: infinite', () => {
  let trigger: (() => void) | null = null;
  beforeEach(() => {
    trigger = null;
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      private cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
      }
      observe(): void {
        trigger = () => this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      disconnect(): void {
        trigger = null;
      }
    };
  });
  afterEach(() => {
    delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
  });

  it('auto-loads without moving focus, then pauses so the footer is reachable', () => {
    setup({ mode: 'infinite', maxAutoLoads: 2 });
    act(() => trigger?.());
    expect(within(list()).getAllByRole('listitem')).toHaveLength(10);
    expect(document.body).toHaveFocus();
    act(() => trigger?.());
    expect(within(list()).getAllByRole('listitem')).toHaveLength(15);
    expect(trigger).toBeNull();
    expect(screen.getByText('Automatic loading paused so the footer stays reachable.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load 5 more' })).toBeInTheDocument();
  });
});

describe('PagedList: back navigation', () => {
  it('restores the page and focuses the item that was opened', async () => {
    const user = userEvent.setup();
    const props = { renderItem: (item: Item) => <button type="button">{item.name}</button>, restoreKey: 'requests' };
    const first = setup(props);
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    await user.click(screen.getByRole('button', { name: 'Request 12' }));
    first.unmount();

    setup(props);
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Request 12').closest('li')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Returned to your place. Showing 11 to 15 of 23 requests.');
  });

  it('ignores corrupt saved state (edge case)', () => {
    sessionStorage.setItem('requests', '{not json');
    setup({ restoreKey: 'requests' });
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('PagedList: accessibility', () => {
  it.each(['pages', 'load-more', 'infinite'] as const)('has no axe violations in %s mode', async (mode) => {
    const { container } = setup({ mode });
    expect(await axe(container)).toHaveNoViolations();
  });
});
