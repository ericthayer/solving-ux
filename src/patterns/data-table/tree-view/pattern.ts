import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const treeViewPattern: PatternDefinition = {
  id: 'data-table.tree-view',
  slug: 'tree-view',
  title: 'Tree view for hierarchical data',
  summary:
    'An ARIA tree with roving focus, arrow keys and type-ahead, tri-state checkboxes that cascade through the hierarchy, and children that load on demand with an announced loading state.',
  category: 'data-table',
  tags: ['tree', 'hierarchy', 'tri-state checkbox', 'lazy loading', 'keyboard', 'roving tabindex'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Account hierarchies, org structures and folder trees are rendered as nested lists of clickable divs. Only the mouse can expand them, the open or closed state lives in a ▸ glyph, and checking a parent changes nothing below it, so users cannot tell whether "North region" means every account in the region or just the label. Branches that load from the server show a spinner and never say when they are done.',
  beforeState: {
    summary: 'Nested clickable divs with glyph-only expand state, independent parent checkboxes, and a silent spinner for lazy branches.',
    failures: [
      {
        id: 'div-tree',
        description: 'The hierarchy is nested divs with no tree, level, or position semantics, so screen readers hear a flat run of text with no depth.',
        refs: [{ kind: 'wcag', criterion: '1.3.1' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'North region branch' },
      },
      {
        id: 'no-keyboard',
        description: 'Rows and expand arrows are not focusable. Keyboard users can reach the checkboxes but cannot open a branch.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'South region row' },
      },
      {
        id: 'icon-only-state',
        description: 'Expanded or collapsed is shown only by a ▸ / ▾ text glyph, which is not exposed as a state.',
        refs: [{ kind: 'wcag', criterion: '4.1.2' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Expand arrow on North region' },
      },
      {
        id: 'parent-select',
        description: 'Checking a parent flags only the parent. Children stay unchecked and no partial state exists, so the scope of the selection is unknowable.',
        refs: [{ kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'Operations checkbox' },
      },
      {
        id: 'silent-loading',
        description: 'A lazy branch shows a spinner glyph that is never announced and never resolves into a result or an error.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Archived accounts spinner', revealedBy: 'Click the arrow next to Archived accounts' },
      },
    ],
  },
  designRationale:
    'This is data, not navigation, so it uses the APG tree pattern rather than the disclosure links in Nested navigation. One treeitem holds the tab stop (roving tabindex) and arrow keys move through the visible rows, which keeps a 10,000-node tree to a single Tab stop. Depth, position and expanded state are exposed with aria-level, aria-setsize, aria-posinset and aria-expanded instead of a glyph. In checkable mode a parent\'s aria-checked is derived from its loaded children, so true, false and mixed can never disagree with what is below; checking a branch cascades down, and children loaded later inherit it. Lazy branches set aria-busy, describe their loading or error state on the row, and announce the result once through a polite status region.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Accessible name for the tree, e.g. "Account hierarchy".' },
    { name: 'nodes', type: 'TreeNode[]', required: true, description: 'Root nodes: { id, label, children? , hasChildren? }. Set hasChildren and omit children to load a branch on first expand.' },
    { name: 'checkable', type: 'boolean', required: false, defaultValue: 'false', description: 'Tri-state checkboxes with cascading selection (aria-checked). Off: single selection with aria-selected.' },
    { name: 'defaultExpanded', type: 'string[]', required: false, defaultValue: '[]', description: 'Node ids open on first render.' },
    { name: 'defaultChecked', type: 'string[]', required: false, defaultValue: '[]', description: 'Leaf (or unloaded branch) ids checked on first render. Parent states are derived.' },
    { name: 'loadChildren', type: '(node: TreeNode) => Promise<TreeNode[]>', required: false, description: 'Fetches a lazy branch. A rejection shows an inline error and the next expand retries.' },
    { name: 'onCheckedChange', type: '(ids: string[]) => void', required: false, description: 'Called with every checked leaf and unloaded branch id after each change.' },
    { name: 'onSelect', type: '(node: TreeNode) => void', required: false, description: 'Single-select mode: called on Enter, Space, or click.' },
  ],
  usage: `<TreeView
  label="Account hierarchy"
  nodes={regions}
  checkable
  loadChildren={(node) => api.children(node.id)}
  onCheckedChange={setScope}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'role="tree" / "treeitem" / "group" with aria-expanded and aria-checked (true, false, or mixed) on each item.' },
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'Every action (expand, collapse, move, check, jump by letter) works from the keyboard without a pointer.' },
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'aria-level, aria-setsize and aria-posinset expose depth and position, so "level 3, 2 of 5" is announced.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Lazy-load results, load errors, and selection totals are announced through a polite status region without moving focus.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Enter or leave the tree. Only one item is a tab stop.' },
    { kind: 'keyboard', keys: '↑ / ↓', action: 'Move to the previous or next visible item.' },
    { kind: 'keyboard', keys: '→', action: 'Expand a closed branch; on an open branch, move to its first child.' },
    { kind: 'keyboard', keys: '←', action: 'Collapse an open branch; otherwise move to the parent.' },
    { kind: 'keyboard', keys: 'Home / End', action: 'First or last visible item.' },
    { kind: 'keyboard', keys: 'Space / Enter', action: 'Check or uncheck (checkable), or select (single-select).' },
    { kind: 'keyboard', keys: 'A–Z', action: 'Jump to the next item starting with the typed letters.' },
    { kind: 'keyboard', keys: '*', action: 'Expand every sibling of the focused item.' },
    { kind: 'aria', attribute: 'aria-checked="mixed"', detail: 'Derived from loaded children, so a partly selected branch is announced as "half checked".' },
    { kind: 'aria', attribute: 'aria-busy + aria-describedby', detail: 'A loading branch is busy and described as "Loading…"; a failed load is described with a retry hint.' },
    { kind: 'screen-reader', title: 'Depth', detail: 'NVDA reads "Operations, expanded, level 2, 1 of 2"; the visual indent is capped at level 5 but the level keeps counting.' },
    { kind: 'screen-reader', title: 'Browse mode', detail: 'Arrow keys go to the tree only in focus mode; NVDA switches automatically when the tree receives focus.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
