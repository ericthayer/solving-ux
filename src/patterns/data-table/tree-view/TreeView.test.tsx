import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TreeView, deriveCheckStates } from './TreeView';
import type { TreeNode, TreeViewProps } from './TreeView';

expect.extend(toHaveNoViolations);

const nodes: TreeNode[] = [
  {
    id: 'north',
    label: 'North region',
    children: [
      { id: 'ops', label: 'Operations', children: [{ id: 'a1', label: 'Cedar Supply' }, { id: 'a2', label: 'Harbor Logistics' }] },
      { id: 'sales', label: 'Field sales', children: [{ id: 'a3', label: 'Bluefin Packaging' }] },
    ],
  },
  { id: 'south', label: 'South region', children: [{ id: 'a4', label: 'Apex Industrial' }] },
  { id: 'archived', label: 'Archived accounts', hasChildren: true },
];

function setup(props: Partial<TreeViewProps> = {}) {
  const user = userEvent.setup();
  const utils = render(<TreeView label="Accounts" nodes={nodes} defaultExpanded={['north']} {...props} />);
  const item = (name: string): HTMLElement => screen.getByRole('treeitem', { name });
  return { ...utils, user, item };
}

describe('TreeView', () => {
  it('exposes tree semantics with level, position, and expanded state', () => {
    const { item } = setup();
    expect(screen.getByRole('tree', { name: 'Accounts' })).toBeInTheDocument();
    expect(item('North region')).toHaveAttribute('aria-expanded', 'true');
    expect(item('Operations')).toHaveAttribute('aria-level', '2');
    expect(item('Operations')).toHaveAttribute('aria-posinset', '1');
    expect(item('Operations')).toHaveAttribute('aria-setsize', '2');
    expect(item('South region')).toHaveAttribute('aria-expanded', 'false');
    // Leaves are not expandable, and collapsed children are not rendered.
    expect(screen.queryByRole('treeitem', { name: 'Cedar Supply' })).not.toBeInTheDocument();
  });

  it('keeps exactly one tab stop (roving tabindex)', async () => {
    const { user, item } = setup();
    await user.tab();
    expect(item('North region')).toHaveFocus();
    expect(screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0)).toHaveLength(1);
    await user.keyboard('{ArrowDown}');
    expect(item('Operations')).toHaveFocus();
    expect(item('Operations').tabIndex).toBe(0);
    expect(item('North region').tabIndex).toBe(-1);
  });

  it('expands, enters, collapses and climbs with arrow keys', async () => {
    const { user, item } = setup();
    act(() => item('North region').focus());
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(item('Operations')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(item('Cedar Supply')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(item('Operations')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(item('Operations')).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowLeft}');
    expect(item('North region')).toHaveFocus();
    await user.keyboard('{End}');
    expect(item('Archived accounts')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('North region')).toHaveFocus();
  });

  it('jumps by typed letters and cycles on repeat', async () => {
    const { user, item } = setup();
    act(() => item('North region').focus());
    await user.keyboard('s');
    expect(item('South region')).toHaveFocus();
    await user.keyboard('*');
    expect(item('South region')).toHaveAttribute('aria-expanded', 'true');
    expect(item('North region')).toHaveAttribute('aria-expanded', 'true');
  });

  it('cascades checks down and derives mixed state up', async () => {
    const onCheckedChange = jest.fn();
    const { user, item } = setup({ checkable: true, onCheckedChange });
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
    act(() => item('Operations').focus());
    await user.keyboard(' ');
    expect(item('Operations')).toHaveAttribute('aria-checked', 'true');
    expect(item('North region')).toHaveAttribute('aria-checked', 'mixed');
    expect(onCheckedChange).toHaveBeenLastCalledWith(['a1', 'a2']);
    expect(screen.getByRole('status')).toHaveTextContent('Selected Operations and 2 items inside it. 2 selected.');

    await user.click(within(item('Field sales')).getByText('Field sales'));
    expect(item('North region')).toHaveAttribute('aria-checked', 'true');
    act(() => item('North region').focus());
    await user.keyboard('{Enter}');
    expect(item('North region')).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenLastCalledWith([]);
  });

  it('selects a single item when not checkable', async () => {
    const onSelect = jest.fn();
    const { user, item } = setup({ onSelect });
    expect(item('South region')).toHaveAttribute('aria-selected', 'false');
    await user.click(within(item('South region')).getByText('South region'));
    expect(item('South region')).toHaveAttribute('aria-selected', 'true');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'south' }));
  });

  it('loads lazy children, announces them, and passes down a checked parent', async () => {
    let resolve: (value: TreeNode[]) => void = () => undefined;
    const loadChildren = jest.fn(() => new Promise<TreeNode[]>((r) => (resolve = r)));
    const { user, item } = setup({ checkable: true, loadChildren, defaultChecked: ['archived'] });
    act(() => item('Archived accounts').focus());
    await user.keyboard('{ArrowRight}');
    expect(item('Archived accounts')).toHaveAttribute('aria-busy', 'true');
    expect(item('Archived accounts')).toHaveAccessibleDescription('Loading…');
    expect(screen.getByRole('status')).toHaveTextContent('Loading Archived accounts.');

    await act(async () => resolve([{ id: 'z1', label: 'Lakeside Mills' }]));
    expect(item('Archived accounts')).not.toHaveAttribute('aria-busy');
    expect(item('Lakeside Mills')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Archived accounts loaded, 1 item.');
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it('shows a retryable error when loading fails (edge case)', async () => {
    const loadChildren = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([{ id: 'z1', label: 'Lakeside Mills' }]);
    const { user, item } = setup({ loadChildren });
    act(() => item('Archived accounts').focus());
    await user.keyboard('{ArrowRight}');
    expect(await screen.findByText("Couldn't load. Expand to retry.")).toBeInTheDocument();
    expect(item('Archived accounts')).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowRight}');
    expect(await screen.findByRole('treeitem', { name: 'Lakeside Mills' })).toBeInTheDocument();
  });

  it('keeps a tab stop when the focused item disappears (edge case)', async () => {
    const { user, item, rerender } = setup();
    act(() => item('Operations').focus());
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    rerender(<TreeView label="Accounts" nodes={nodes.slice(1)} />);
    expect(screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0)).toHaveLength(1);
  });

  it('renders an empty tree without crashing (edge case)', () => {
    render(<TreeView label="Accounts" nodes={[]} />);
    expect(screen.queryAllByRole('treeitem')).toHaveLength(0);
  });

  it('derives parent state from children only', () => {
    const { states, checkedIds } = deriveCheckStates(nodes, new Set(['north', 'a1']), (n) => n.children);
    expect(states.get('north')).toBe('mixed');
    expect(states.get('ops')).toBe('mixed');
    expect(states.get('archived')).toBe(false);
    expect(checkedIds).toEqual(['a1']);
  });

  it('has no axe violations', async () => {
    const { container } = setup({ checkable: true, defaultChecked: ['a1'] });
    expect(await axe(container)).toHaveNoViolations();
  });
});
