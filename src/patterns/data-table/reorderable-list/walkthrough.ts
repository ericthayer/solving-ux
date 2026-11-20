import type { CodeAnnotation } from '../../../types/walkthrough';

export const reorderableListWalkthrough: CodeAnnotation[] = [
  {
    id: 'move-item',
    anchor: 'export function moveItem<T>(',
    endAnchor: 'return next;',
    topic: 'resilience',
    title: 'One pure move function for every input',
    rationale:
      'Buttons, the Position select, and drag and drop all call the same function, so a keyboard move and a mouse move can never disagree. It copies the array, clamps the target, and ignores a bad source index, which makes it easy to unit test on its own.',
  },
  {
    id: 'focus-follows',
    anchor: '// React reorders by moving DOM nodes',
    endAnchor: '}, [items]);',
    topic: 'focus',
    title: 'Focus follows the item',
    rationale:
      'When React moves a focused element to a new place in the DOM, the browser drops focus to the page body, and a keyboard user is thrown back to the top. The control that was pressed is remembered before the move and focused again once the new order renders, so pressing Move down repeatedly keeps moving the same item.',
    wcag: ['2.4.3'],
  },
  {
    id: 'repeat-announce',
    anchor: '// A live region ignores a repeat of the same text',
    endAnchor: 'const announce =',
    topic: 'announce',
    title: 'Repeated messages still speak',
    rationale:
      'Screen readers skip a live region update when the text did not change, so pressing Move up on the first item twice would be silent the second time. Toggling a trailing non-breaking space makes each press a real change.',
    wcag: ['4.1.3'],
  },
  {
    id: 'move',
    anchor: 'const move = (from: number, to: number, control: ReorderControl | null): void => {',
    endAnchor: 'announce(`Moved ${name} to position',
    topic: 'state',
    title: 'Every move says what moved and where',
    rationale:
      'The message names the item and gives its new position out of the total, which is what a sighted user reads from the screen. Pressing past either end explains why nothing happened instead of failing silently. Drag passes null for the control because focus should stay where the pointer user left it.',
    wcag: ['4.1.3'],
  },
  {
    id: 'drag-enhancement',
    anchor: 'draggable',
    endAnchor: 'onDragEnd={() => setDragId(null)}',
    topic: 'resilience',
    title: 'Drag is an extra, not the only path',
    rationale:
      'Native drag and drop stays for mouse users who expect it, and it runs through the same move function, so it is announced too. Because every item also has buttons and a select, nobody has to drag. That single-pointer alternative is what WCAG 2.2 criterion 2.5.7 requires.',
    wcag: ['2.5.7'],
  },
  {
    id: 'control-group',
    anchor: '<div className={styles.controls} role="group" aria-label={`Reorder ${name}`}>',
    topic: 'semantics',
    title: 'Controls are grouped and named after their item',
    rationale:
      'Six identical "up" buttons are useless out of context. The group name and each button name include the item, so a screen reader user hears "Move Quarterly review up" and a voice control user can say it.',
    wcag: ['1.3.1', '4.1.2'],
  },
  {
    id: 'aria-disabled',
    anchor: 'aria-disabled={first || undefined}',
    topic: 'focus',
    title: 'Ends use aria-disabled, not disabled',
    rationale:
      'A disabled button cannot hold focus. If Move up became disabled while focused, after the item reached the top, focus would vanish. aria-disabled keeps the button focusable and announced as unavailable, and the move function explains why it did nothing.',
    wcag: ['2.4.3', '4.1.2'],
  },
  {
    id: 'position-select',
    anchor: '<select',
    endAnchor: '</select>',
    topic: 'semantics',
    title: 'Send an item straight to its place',
    rationale:
      'Moving the last of 12 items to the top takes 11 presses with buttons alone. A native select with "3 of 6" options does it in one step and is announced correctly everywhere. It builds one option per item, so past about 50 items switch to a number input to keep the DOM small.',
    wcag: ['2.1.1'],
  },
  {
    id: 'status-region',
    anchor: '<p role="status" className={styles.visuallyHidden}>',
    endAnchor: '</p>',
    topic: 'announce',
    title: 'One status region, always mounted',
    rationale:
      'Live regions only announce changes to content that was already in the DOM, so the region renders empty on first paint. It is visually hidden because the moved item is already visible, and briefly tinted, on screen.',
    wcag: ['4.1.3'],
  },
  {
    id: 'reduced-motion',
    file: 'styles',
    anchor: '@media (prefers-reduced-motion: reduce) {',
    endAnchor: 'border-color: var(--sux-accent, #0b6e4f);',
    topic: 'styling',
    title: 'The moved item is marked without motion when asked',
    rationale:
      'The brief tint helps sighted users find the item that just moved. For people who ask for reduced motion it becomes a static accent border instead of an animation.',
    wcag: ['2.3.3'],
  },
];
