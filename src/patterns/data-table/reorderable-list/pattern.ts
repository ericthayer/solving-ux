import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const reorderableListPattern: PatternDefinition = {
  id: 'data-table.reorderable-list',
  slug: 'reorderable-list',
  title: 'Reorderable list without dragging',
  summary: 'Priority, column, or step order set with Move up, Move down, and Move to position controls. Drag stays as an optional extra.',
  category: 'data-table',
  tags: ['reorder', 'drag and drop', 'priority', 'sorting', 'dragging movements'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Users set the order of priorities, table columns, or steps in a process, and the only way to do it is to drag a small grip. Keyboard, switch, and voice control users cannot reorder at all, touch users fight page scrolling, and screen readers hear nothing when items move. Teams often discover this only when an audit cites WCAG 2.2 criterion 2.5.7.',
  beforeState: {
    summary: 'A list of styled rows that can only be reordered by dragging a 6px grip, with a faint "order changed" note after a drop.',
    failures: [
      {
        id: 'drag-only',
        description: 'Dragging is the only way to reorder. There is no single-pointer or keyboard alternative.',
        refs: [{ kind: 'wcag', criterion: '2.5.7' }, { kind: 'wcag', criterion: '2.1.1' }, { kind: 'heuristic', id: 'H7' }],
        target: { label: '"Drag rows to reorder" instruction' },
      },
      {
        id: 'div-rows',
        description: 'Rows are styled divs: no list semantics, no position, and nothing in them can take focus.',
        refs: [{ kind: 'wcag', criterion: '1.3.1' }, { kind: 'wcag', criterion: '2.1.1' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'The list of rows' },
      },
      {
        id: 'tiny-handle',
        description: 'The grip is about 6px wide, far below the 24px minimum target size, and has no name.',
        refs: [{ kind: 'wcag', criterion: '2.5.8' }, { kind: 'heuristic', id: 'H8' }],
        target: { label: 'Grip on the first row' },
      },
      {
        id: 'silent-move',
        description: 'A move is confirmed only by faint "order changed" text. It never says what moved or where, and nothing is announced.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: '"order changed" text in the toolbar', revealedBy: 'Drag a row to a new position' },
      },
    ],
  },
  designRationale:
    'Every item carries the same three controls, so reordering never depends on a gesture: Move up and Move down for small adjustments, and a Position select to send an item straight to its place. After each move, focus returns to the control the user pressed in the item\'s new position, so they can keep pressing without hunting for it, and a status region says "Moved Quarterly review to position 2 of 6." Buttons at the ends use aria-disabled instead of disabled, so focus never falls off the page when an item reaches the top. Drag is kept for mouse users as a pure enhancement that runs through the same move function. The list is controlled, so the same component can drive column order in the bulk action table.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Visible heading. Also names the list and its region.' },
    { name: 'items', type: 'T[] (T extends { id: string })', required: true, description: 'Items in their current order. The component is controlled.' },
    { name: 'onReorder', type: '(items: T[]) => void', required: true, description: 'Receives the whole list in its new order after any move.' },
    { name: 'itemLabel', type: '(item: T) => string', required: true, description: 'Plain-text name used in control names and announcements, e.g. "Move Quarterly review up".' },
    { name: 'renderItem', type: '(item: T) => ReactNode', required: false, defaultValue: 'itemLabel', description: 'Visible content of each item.' },
  ],
  usage: `<ReorderableList<AgendaItem>
  label="Meeting agenda"
  items={items}
  onReorder={setItems}
  itemLabel={(item) => item.title}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.5.7', level: 'AA', title: 'Dragging movements', detail: 'Every drag has a single-pointer alternative: Move up, Move down, and the Position select.' },
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'All three controls are native button and select elements, so reordering works with Tab, Enter, Space, and arrow keys.' },
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'After a move, focus returns to the same control in the item\'s new position, so the reading order and focus stay together.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Each move, and each attempt to move past an end, is announced through a role="status" region.' },
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'Items are an ordered list named by the visible heading, and each item\'s controls are grouped and named after it.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Move between Move up, Move down, and Position for each item.' },
    { kind: 'keyboard', keys: 'Enter or Space on a move button', action: 'Move the item one place. Focus stays on the button, so pressing again keeps moving it.' },
    { kind: 'keyboard', keys: 'Arrow keys or Alt+Down on Position', action: 'Choose a new position and send the item there.' },
    { kind: 'aria', attribute: 'aria-disabled', detail: 'Marks Move up on the first item and Move down on the last item without removing them from the tab order.' },
    { kind: 'aria', attribute: 'role="group" + aria-label', detail: 'Names each set of controls "Reorder Quarterly review", so the item name is announced on entry.' },
    { kind: 'screen-reader', title: 'After a move', detail: 'Hears "Moved Quarterly review to position 2 of 6." with focus still on the button just pressed.' },
    { kind: 'screen-reader', title: 'At either end', detail: 'Hears "Move Quarterly review up, button, unavailable", and pressing it says "Quarterly review is already first."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
