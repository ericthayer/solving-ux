import type { CodeAnnotation } from '../../../types/walkthrough';

export const bulkActionsWalkthrough: CodeAnnotation[] = [
  {
    id: 'page-scoped-select-all',
    anchor: 'const allOnPage =',
    endAnchor: 'const someOnPage',
    topic: 'state',
    title: 'Select-all is scoped to the visible page',
    rationale:
      'The header checkbox only ever selects what the user can see. In the audited grid the same checkbox silently selected every record on every page, so bulk actions ran against rows nobody had looked at. "Some but not all" is derived here so the checkbox can show a true mixed state.',
    wcag: ['3.3.4'],
  },
  {
    id: 'prune-selection',
    anchor: '// Drop selections for rows that no longer exist',
    endAnchor: '}, [rows]);',
    topic: 'resilience',
    title: 'Selections die with their rows',
    rationale:
      'When rows are deleted or filtered out upstream, their ids leave the selection. Without this, the count says "3 selected" while only 1 row is visible, and the next bulk action hits rows the user can no longer see. Returning the previous Set when nothing changed avoids a wasted render.',
    wcag: ['3.3.4'],
  },
  {
    id: 'indeterminate',
    anchor: 'if (selectAllRef.current) selectAllRef.current.indeterminate',
    topic: 'semantics',
    title: 'Mixed state set on the DOM node',
    rationale:
      'indeterminate is a DOM property with no HTML attribute, so React cannot set it declaratively. Setting it in an effect makes screen readers announce "mixed" instead of "not checked" when part of the page is selected.',
    wcag: ['4.1.2'],
  },
  {
    id: 'announce-changes',
    anchor: 'const toggleSort = (column: Column<T>): void => {',
    endAnchor: 'setAnnouncement(`${next.size} of ${rows.length} rows selected.`);',
    topic: 'announce',
    title: 'Every state change gets a sentence',
    rationale:
      'Sorting and selection change the screen without moving focus, so a screen reader user hears nothing. Each handler writes one plain sentence ("Sorted by Amount, descending.") to the status region at the bottom of the component. Sorting also resets to page 1 so the announcement matches what is on screen.',
    wcag: ['4.1.3'],
  },
  {
    id: 'run-action',
    anchor: 'const runAction = (action: BulkAction): void => {',
    endAnchor: 'setAnnouncement(`${action.label} applied to',
    topic: 'state',
    title: 'Actions confirm what they touched',
    rationale:
      'The ids are copied before the selection is cleared, then the result is announced with a count. Clearing after the action stops a second click from re-running it on the same rows.',
    wcag: ['4.1.3'],
  },
  {
    id: 'selection-bar',
    anchor: '<div className={styles.selectionBar}',
    endAnchor: 'Select all {rows.length} rows',
    topic: 'semantics',
    title: 'Actions sit above the table, in reading order',
    rationale:
      'The audited grid never showed a count, so actions ran against an unknown number of rows. This bar shows the count next to the actions and stays in document order before the table, so keyboard and screen reader users reach the actions without hunting. "Select all N rows" only appears after the whole page is selected, which makes selecting the full dataset an explicit second step.',
    wcag: ['1.3.2', '2.4.3'],
  },
  {
    id: 'scroll-region',
    anchor: 'role="region" aria-labelledby={captionId} tabIndex={0}',
    endAnchor: '</caption>',
    topic: 'focus',
    title: 'Wide tables scroll with the keyboard',
    rationale:
      'Overflowing content that only a mouse wheel can scroll fails keyboard users. tabIndex={0} makes the scroller focusable so arrow keys scroll it, and naming the region with the caption tells screen reader users what they landed on.',
    wcag: ['2.1.1', '1.3.1'],
  },
  {
    id: 'aria-sort',
    anchor: "aria-sort={column.sortable ? (active ? sort.direction : 'none') : undefined}",
    endAnchor: 'className={styles.sortIcon}',
    topic: 'semantics',
    title: 'Sort state lives on the header, not the icon',
    rationale:
      'aria-sort on the <th> is what assistive tech reads when moving through columns. The arrow is aria-hidden because it repeats that information visually. The sort control is a real <button>, so Enter and Space work without custom key handlers.',
    wcag: ['1.3.1', '4.1.2'],
  },
  {
    id: 'checkbox-names',
    anchor: 'aria-label={`Select ${rowLabel(row)}`}',
    topic: 'semantics',
    title: 'Each checkbox says which row it selects',
    rationale:
      'rowLabel is a required prop, so a consumer cannot ship 40 checkboxes that all announce "checkbox, not checked". The name matches the row header text for voice control users who say "click Select Order 1042".',
    wcag: ['4.1.2', '2.4.6'],
  },
  {
    id: 'row-headers',
    anchor: 'return index === 0 ? (',
    endAnchor: '<th key={column.key} scope="row"',
    topic: 'semantics',
    title: 'The first column names each row',
    rationale:
      'Rendering the first cell as <th scope="row"> means a screen reader announces "Order 1042" with every cell in that row, not just a bare amount. The same cell is the frozen column, so the sighted user and the screen reader user keep the same anchor while scrolling sideways.',
    wcag: ['1.3.1'],
  },
  {
    id: 'status-region',
    anchor: '<p role="status" className={styles.visuallyHidden}>',
    endAnchor: '</p>',
    topic: 'announce',
    title: 'One status region, always mounted',
    rationale:
      'Live regions only announce changes to content that was already in the DOM. Rendering the region on first paint, empty, means the first announcement is not lost. It is visually hidden because the same information is already visible in the selection bar and headers.',
    wcag: ['4.1.3'],
  },
  {
    id: 'focus-styles',
    file: 'styles',
    anchor: '.button:focus-visible,',
    endAnchor: 'outline-offset: 2px;',
    topic: 'styling',
    title: 'One focus ring for every control',
    rationale:
      'All interactive parts, including the scroll region, share a 2px outline driven by --sux-focus, so the ring passes contrast in light and dark themes. :focus-visible keeps it off mouse clicks without hiding it from keyboard users.',
    wcag: ['2.4.7', '1.4.11'],
  },
];
