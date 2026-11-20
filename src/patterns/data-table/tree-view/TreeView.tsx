import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import styles from './TreeView.module.css';

export type TreeNode = {
  id: string;
  label: string;
  /** Loaded children. Leave undefined and set hasChildren to fetch them with loadChildren on first expand. */
  children?: TreeNode[];
  hasChildren?: boolean;
};

export type CheckState = boolean | 'mixed';

export type TreeViewProps = {
  /** Accessible name for the tree. */
  label: string;
  nodes: TreeNode[];
  /** Tri-state checkboxes with cascading selection. Otherwise single selection. */
  checkable?: boolean;
  defaultExpanded?: string[];
  defaultChecked?: string[];
  loadChildren?: (node: TreeNode) => Promise<TreeNode[]>;
  onCheckedChange?: (ids: string[]) => void;
  onSelect?: (node: TreeNode) => void;
};

type Row = { node: TreeNode; parentId: string | null };
type ChildrenOf = (node: TreeNode) => TreeNode[] | undefined;

const isParent = (node: TreeNode): boolean => Boolean(node.children?.length || node.hasChildren);

/** Visible rows in document order. Keyboard movement walks this list, not the DOM. */
export function visibleRows(nodes: TreeNode[], expanded: ReadonlySet<string>, childrenOf: ChildrenOf): Row[] {
  const rows: Row[] = [];
  const walk = (list: TreeNode[], parentId: string | null): void =>
    list.forEach((node) => {
      rows.push({ node, parentId });
      const kids = childrenOf(node);
      if (kids && expanded.has(node.id)) walk(kids, node.id);
    });
  walk(nodes, null);
  return rows;
}

/** A parent's state comes from its loaded children, so it can never disagree with them. */
export function deriveCheckStates(nodes: TreeNode[], checked: ReadonlySet<string>, childrenOf: ChildrenOf): { states: Map<string, CheckState>; checkedIds: string[] } {
  const states = new Map<string, CheckState>();
  const checkedIds: string[] = [];
  const visit = (node: TreeNode): CheckState => {
    const kids = childrenOf(node);
    let state: CheckState;
    if (kids && kids.length > 0) {
      const childStates = kids.map(visit);
      state = childStates.every((s) => s === true) ? true : childStates.some((s) => s !== false) ? 'mixed' : false;
    } else {
      state = checked.has(node.id);
      if (state) checkedIds.push(node.id);
    }
    states.set(node.id, state);
    return state;
  };
  nodes.forEach(visit);
  return { states, checkedIds };
}

const descendantIds = (list: TreeNode[], childrenOf: ChildrenOf): string[] =>
  list.flatMap((node) => [node.id, ...descendantIds(childrenOf(node) ?? [], childrenOf)]);

const plural = (n: number): string => `${n} ${n === 1 ? 'item' : 'items'}`;

export function TreeView({ label, nodes, checkable = false, defaultExpanded = [], defaultChecked = [], loadChildren, onCheckedChange, onSelect }: TreeViewProps): JSX.Element {
  const baseId = useId();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded));
  const [checked, setChecked] = useState<Set<string>>(() => new Set(defaultChecked));
  const [loaded, setLoaded] = useState<Map<string, TreeNode[]>>(() => new Map());
  const [loadState, setLoadState] = useState<Map<string, 'loading' | 'error'>>(() => new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const typeahead = useRef({ buffer: '', timer: 0 });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const state = typeahead.current;
    return () => {
      mounted.current = false;
      window.clearTimeout(state.timer);
    };
  }, []);

  const childrenOf: ChildrenOf = (node) => node.children ?? loaded.get(node.id);
  const rows = visibleRows(nodes, expanded, childrenOf);
  const { states } = useMemo(() => deriveCheckStates(nodes, checked, (n) => n.children ?? loaded.get(n.id)), [nodes, checked, loaded]);
  // Roving tabindex: exactly one item is in the tab order, and it survives collapses and data changes.
  const tabStopId = rows.some((r) => r.node.id === focusedId) ? focusedId : (rows[0]?.node.id ?? null);

  const setFlag = <T,>(update: (fn: (prev: Map<string, T>) => Map<string, T>) => void, id: string, value: T | null): void =>
    update((prev) => {
      const next = new Map(prev);
      if (value === null) next.delete(id);
      else next.set(id, value);
      return next;
    });

  const load = async (node: TreeNode): Promise<void> => {
    if (!loadChildren || loadState.get(node.id) === 'loading') return;
    setFlag(setLoadState, node.id, 'loading');
    setAnnouncement(`Loading ${node.label}.`);
    try {
      const kids = await loadChildren(node);
      if (!mounted.current) return;
      setFlag(setLoaded, node.id, kids);
      setFlag(setLoadState, node.id, null);
      // Children inherit a checked parent, so "select all of West" still means all of it after loading.
      setChecked((prev) => (prev.has(node.id) ? new Set([...prev, ...descendantIds(kids, (n) => n.children)]) : prev));
      setAnnouncement(`${node.label} loaded, ${plural(kids.length)}.`);
    } catch {
      if (!mounted.current) return;
      setFlag(setLoadState, node.id, 'error');
      setExpanded((prev) => new Set([...prev].filter((id) => id !== node.id)));
      setAnnouncement(`Couldn't load ${node.label}. Expand it again to retry.`);
    }
  };

  const setOpen = (node: TreeNode, open: boolean): void => {
    if (!isParent(node) || expanded.has(node.id) === open) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(node.id);
      else next.delete(node.id);
      return next;
    });
    if (open && !childrenOf(node)) void load(node);
  };

  const focusItem = (id: string | undefined): void => {
    if (!id) return;
    setFocusedId(id);
    itemRefs.current.get(id)?.focus();
  };

  const toggleCheck = (node: TreeNode): void => {
    const value = states.get(node.id) !== true;
    const ids = [node.id, ...descendantIds(childrenOf(node) ?? [], childrenOf)];
    const next = new Set(checked);
    ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
    setChecked(next);
    const { checkedIds } = deriveCheckStates(nodes, next, childrenOf);
    onCheckedChange?.(checkedIds);
    const inside = ids.length > 1 ? ` and ${plural(ids.length - 1)} inside it` : '';
    setAnnouncement(`${value ? 'Selected' : 'Cleared'} ${node.label}${inside}. ${checkedIds.length} selected.`);
  };

  const activate = (node: TreeNode): void => {
    if (checkable) return toggleCheck(node);
    setSelectedId(node.id);
    onSelect?.(node);
  };

  const findByPrefix = (char: string, index: number): Row | undefined => {
    const t = typeahead.current;
    window.clearTimeout(t.timer);
    t.buffer += char.toLowerCase();
    t.timer = window.setTimeout(() => (t.buffer = ''), 500);
    // A single key cycles past the current item; a typed word refines from it.
    const start = t.buffer.length === 1 ? index + 1 : index;
    return [...rows.slice(start), ...rows.slice(0, start)].find((r) => r.node.label.toLowerCase().startsWith(t.buffer));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
    const index = rows.findIndex((r) => r.node.id === tabStopId);
    const row = rows[index];
    if (!row || event.altKey || event.ctrlKey || event.metaKey) return;
    const { node } = row;
    const open = expanded.has(node.id);
    const key = event.key;
    if (key === 'ArrowDown') focusItem(rows[index + 1]?.node.id);
    else if (key === 'ArrowUp') focusItem(rows[index - 1]?.node.id);
    else if (key === 'Home') focusItem(rows[0]?.node.id);
    else if (key === 'End') focusItem(rows.at(-1)?.node.id);
    else if (key === 'ArrowRight') {
      if (!open) setOpen(node, true);
      else if (rows[index + 1]?.parentId === node.id) focusItem(rows[index + 1]?.node.id);
    } else if (key === 'ArrowLeft') {
      if (open) setOpen(node, false);
      else focusItem(row.parentId ?? undefined);
    } else if (key === 'Enter' || key === ' ') activate(node);
    else if (key === '*') rows.filter((r) => r.parentId === row.parentId).forEach((r) => setOpen(r.node, true));
    else if (key.length === 1) focusItem(findByPrefix(key, index)?.node.id);
    else return;
    event.preventDefault();
  };

  const handleFocus = (event: FocusEvent<HTMLUListElement>): void => {
    const id = (event.target as HTMLElement).closest('[role="treeitem"]')?.getAttribute('data-id');
    if (id) setFocusedId(id);
  };

  const handleRowClick = (event: MouseEvent<HTMLDivElement>, node: TreeNode): void => {
    const part = (event.target as HTMLElement).closest('[data-part]')?.getAttribute('data-part');
    if (part === 'toggle') setOpen(node, !expanded.has(node.id));
    else activate(node);
  };

  const renderLevel = (list: TreeNode[], level: number): JSX.Element[] =>
    list.map((node, index) => {
      const parent = isParent(node);
      const open = parent && expanded.has(node.id);
      const kids = childrenOf(node);
      const status = loadState.get(node.id);
      const labelId = `${baseId}-${node.id}`;
      return (
        <li
          key={node.id}
          ref={(el) => {
            if (el) itemRefs.current.set(node.id, el);
            else itemRefs.current.delete(node.id);
          }}
          role="treeitem"
          data-id={node.id}
          className={styles.item}
          tabIndex={node.id === tabStopId ? 0 : -1}
          aria-labelledby={labelId}
          aria-describedby={status ? `${labelId}-status` : undefined}
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={index + 1}
          aria-expanded={parent ? open : undefined}
          aria-checked={checkable ? (states.get(node.id) ?? false) : undefined}
          aria-selected={checkable ? undefined : node.id === selectedId}
          aria-busy={status === 'loading' || undefined}
        >
          <div className={styles.row} onClick={(event) => handleRowClick(event, node)}>
            <span aria-hidden="true" className={styles.toggle} data-part={parent ? 'toggle' : undefined} data-parent={parent || undefined} />
            {checkable && <span aria-hidden="true" className={styles.check} data-state={String(states.get(node.id) ?? false)} />}
            <span id={labelId} className={styles.label}>
              {node.label}
            </span>
            {status && (
              <span id={`${labelId}-status`} className={styles.status} data-state={status}>
                {status === 'loading' ? 'Loading…' : "Couldn't load. Expand to retry."}
              </span>
            )}
          </div>
          {open && kids && kids.length > 0 && (
            <ul role="group" className={styles.group}>
              {renderLevel(kids, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <div className={styles.root}>
      <ul role="tree" aria-label={label} aria-multiselectable={checkable || undefined} className={styles.tree} onKeyDown={handleKeyDown} onFocus={handleFocus}>
        {renderLevel(nodes, 1)}
      </ul>
      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
    </div>
  );
}
