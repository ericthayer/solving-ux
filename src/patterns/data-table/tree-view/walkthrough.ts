import type { CodeAnnotation } from '../../../types/walkthrough';

export const treeViewWalkthrough: CodeAnnotation[] = [
  {
    id: 'lazy-node',
    anchor: 'export type TreeNode = {',
    endAnchor: 'hasChildren?: boolean;',
    topic: 'state',
    title: 'Lazy branches are part of the data model',
    rationale:
      'A node with hasChildren and no children is a branch the server has not sent yet. Making that explicit is what lets the tree show it as expandable, set aria-expanded, and fetch on demand, instead of guessing from an empty array.',
  },
  {
    id: 'visible-rows',
    anchor: 'export function visibleRows(nodes: TreeNode[], expanded: ReadonlySet<string>, childrenOf: ChildrenOf): Row[] {',
    endAnchor: '  return rows;',
    topic: 'focus',
    title: 'Arrow keys walk visible rows, not the DOM',
    rationale:
      'Up and Down move through a flat list of what is on screen right now, in reading order. Collapsed branches are not in it, so focus can never land on something hidden, and the logic does not depend on DOM queries.',
    wcag: ['2.1.1', '2.4.3'],
  },
  {
    id: 'derive-checks',
    anchor: 'export function deriveCheckStates(',
    endAnchor: 'return { states, checkedIds };',
    topic: 'state',
    title: 'Parent state is derived, never stored',
    rationale:
      'The audited tree stored a checkbox per parent, so "North region" could be checked while nothing inside it was. Here only leaves (and unloaded branches) hold a value; every parent is computed as true, false, or mixed from its loaded children, so the two can never disagree.',
    wcag: ['4.1.2', '1.3.1'],
  },
  {
    id: 'roving-tabindex',
    anchor: '// Roving tabindex: exactly one item is in the tab order',
    endAnchor: 'const tabStopId =',
    topic: 'focus',
    title: 'One tab stop, even after data changes',
    rationale:
      'A tree is one widget, so it takes one Tab stop. If the focused item is collapsed away or deleted by the parent, the tab stop falls back to the first visible item instead of disappearing, so keyboard users can always get back in.',
    wcag: ['2.1.1', '2.4.3'],
  },
  {
    id: 'lazy-load',
    anchor: 'const load = async (node: TreeNode): Promise<void> => {',
    endAnchor: "setAnnouncement(`Couldn't load ${node.label}. Expand it again to retry.`);",
    topic: 'announce',
    title: 'Loading, success and failure are all announced',
    rationale:
      'The Before spinner never said anything. Here loading, the result count, and failure each go to the status region once. A checked parent passes its state to children that arrive later, and a failed load collapses the branch so the next expand retries. The mounted check stops a late response from updating an unmounted tree.',
    wcag: ['4.1.3'],
  },
  {
    id: 'cascade',
    anchor: 'const toggleCheck = (node: TreeNode): void => {',
    endAnchor: 'setAnnouncement(`${value ? ',
    topic: 'announce',
    title: 'Checking a branch cascades and says how much it covered',
    rationale:
      'A mixed or unchecked branch becomes fully checked, along with every loaded descendant. The announcement states the scope ("and 3 items inside it") and the running total, which is the information the audited tree withheld.',
    wcag: ['4.1.3', '4.1.2'],
  },
  {
    id: 'typeahead',
    anchor: 'const findByPrefix = (char: string, index: number): Row | undefined => {',
    endAnchor: 'return [...rows.slice(start), ...rows.slice(0, start)]',
    topic: 'focus',
    title: 'Type-ahead that cycles',
    rationale:
      'Typing letters within half a second builds a prefix. A single repeated letter moves to the next match, so pressing H twice steps through every H item, which matches native listbox behavior users already know.',
    wcag: ['2.1.1'],
  },
  {
    id: 'keys',
    anchor: 'const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {',
    endAnchor: 'event.preventDefault();',
    topic: 'focus',
    title: 'The APG tree key map in one handler',
    rationale:
      'Right opens a branch, then steps into it; Left closes it, then climbs to the parent. Home, End, Space, Enter and * follow the WAI-ARIA tree pattern. Keys with modifiers pass through so browser and screen reader shortcuts keep working, and only handled keys call preventDefault.',
    wcag: ['2.1.1'],
  },
  {
    id: 'treeitem',
    anchor: 'data-id={node.id}',
    endAnchor: "aria-busy={status === 'loading' || undefined}",
    topic: 'semantics',
    title: 'Depth, position and state as attributes',
    rationale:
      'aria-level, aria-setsize and aria-posinset are set explicitly so "level 3, 2 of 5" is right even when siblings are not rendered. aria-labelledby points at the label only; without it the name would include every descendant\'s text.',
    wcag: ['1.3.1', '4.1.2'],
  },
  {
    id: 'decorative-controls',
    anchor: '<span aria-hidden="true" className={styles.toggle}',
    endAnchor: '{checkable && <span aria-hidden="true" className={styles.check}',
    topic: 'semantics',
    title: 'Chevron and checkbox are drawings, not controls',
    rationale:
      'A real checkbox inside a treeitem would be a second focusable control in one row and break the single tab stop. The visuals are hidden from assistive tech; the state is announced from aria-expanded and aria-checked on the item itself.',
    wcag: ['4.1.2'],
  },
  {
    id: 'focus-ring',
    file: 'styles',
    anchor: '.item:focus-visible > .row {',
    topic: 'styling',
    title: 'Focus ring on the row, not the subtree',
    rationale:
      'The treeitem element wraps its whole subtree, so outlining it would box twenty rows at once. The ring is drawn on the focused row only.',
    wcag: ['2.4.7'],
  },
  {
    id: 'check-shapes',
    file: 'styles',
    anchor: '/* Check mark and dash are shapes, not color alone',
    endAnchor: '.check[data-state=\'mixed\']::after {',
    topic: 'styling',
    title: 'Three states, three shapes',
    rationale:
      'Checked shows a tick, mixed shows a dash, unchecked is empty. The states differ by shape, so they survive forced colors and color blindness.',
    wcag: ['1.4.1', '1.4.11'],
  },
];
