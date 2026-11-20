import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const notificationCenterPattern: PatternDefinition = {
  id: 'notifications.notification-center',
  slug: 'notification-center',
  title: 'Notification center with unread count',
  summary:
    'Bell disclosure whose name carries the unread count, a panel grouped by day with read state in text, per-item actions, mark all as read, and a polite announcement when new items arrive.',
  category: 'notifications',
  tags: ['notifications', 'inbox', 'unread', 'disclosure', 'live region', 'status'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Transient messages vanish, so users need one place to review what happened while they were away. The audited inbox is a bell icon with a red dot: it has no name, no count, and no keyboard access. The dropdown renders at the end of the page, unread rows differ only by font weight, every row is a clickable div that navigates away, and new items arrive without a word to screen reader users.',
  beforeState: {
    summary: 'Unnamed bell with a red dot, mouse-only dropdown, read state shown by weight only.',
    failures: [
      {
        id: 'unnamed-bell',
        description: 'The bell is a div with an icon: not focusable, no role, no accessible name, and no unread count.',
        refs: [{ kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Bell icon' },
      },
      {
        id: 'dot-without-count',
        description: 'A red dot says "something is new" by color alone and never says how many.',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Red unread dot' },
      },
      {
        id: 'silent-arrival',
        description: 'New items only flip the dot; nothing is announced to assistive tech.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Bell and dot' },
      },
      {
        id: 'panel-focus-order',
        description: 'The dropdown renders at the end of the frame, far from the bell in DOM order, with no focus handling or Escape.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }],
        target: { label: 'Dropdown panel', revealedBy: 'Click the bell' },
      },
      {
        id: 'read-state-visual',
        description: 'Unread rows differ only by bold text, so read state is not exposed to screen readers.',
        refs: [{ kind: 'wcag', criterion: '1.3.1' }],
        target: { label: 'Bold unread rows', revealedBy: 'Click the bell' },
      },
      {
        id: 'no-item-actions',
        description: 'Rows are clickable divs that navigate away. No per-item action, no mark as read, no mark all as read.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'heuristic', id: 'H3' }, { kind: 'heuristic', id: 'H7' }],
        target: { label: 'Notification list', revealedBy: 'Click the bell' },
      },
    ],
  },
  designRationale:
    'The trigger is a native button with aria-expanded, and its name includes the exact unread count ("Notifications, 3 unread"), so the count is heard without opening anything; the visual badge caps at 99+ but the name does not. The panel is a non-modal disclosure placed right after the button in the DOM, so Tab moves straight into it, and Escape closes it and returns focus to the bell. Items are grouped under Today, Yesterday, and dated headings so screen reader users can jump by heading. Unread state is a dot and a bolder title on screen and the word "Unread" for assistive tech. Each row has its own action and a mark read or unread toggle, both described by the item title. A status region that exists from first render announces only items that were not there before, never the whole list.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'items', type: 'NotificationItem[]', required: true, description: '{ id, title, body?, timestamp (ISO), read, action?: { label, onClick } }. Grouped by local day, newest first.' },
    { name: 'onReadChange', type: '(id: string, read: boolean) => void', required: true, description: 'Mark one item read or unread. Also called with read=true when an item action runs.' },
    { name: 'onMarkAllRead', type: '() => void', required: true, description: 'Mark every item read. Not called when nothing is unread.' },
    { name: 'now', type: 'Date', required: false, defaultValue: 'new Date()', description: 'Reference time for the Today and Yesterday groups. Pass a fixed value in tests.' },
    { name: 'label', type: 'string', required: false, defaultValue: "'Notifications'", description: 'Names the button and the panel heading.' },
  ],
  usage: `const [items, setItems] = useState<NotificationItem[]>(fromServer);

<NotificationCenter
  items={items}
  onReadChange={(id, read) => setItems((l) => l.map((i) => (i.id === id ? { ...i, read } : i)))}
  onMarkAllRead={() => setItems((l) => l.map((i) => ({ ...i, read: true })))}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'Native button with aria-expanded and aria-controls; the name includes the unread count.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'A persistent role="status" region announces new arrivals and mark-all results without moving focus.' },
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'The panel follows the button in the DOM; Escape returns focus to the button.' },
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'Day groups are headed sections with lists; unread state is text, not only weight and color.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'Open or close the panel from the bell.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Move from the bell into Mark all as read, then each item action.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Close the panel and return focus to the bell.' },
    { kind: 'aria', attribute: 'aria-expanded / aria-controls', detail: 'On the bell, pointing at the panel.' },
    { kind: 'aria', attribute: 'aria-describedby="<item title>"', detail: 'Repeated "Mark as read" buttons say which item they act on.' },
    { kind: 'aria', attribute: 'aria-disabled="true"', detail: 'Mark all as read stays focusable when nothing is unread, so focus is never dropped.' },
    { kind: 'screen-reader', title: 'Bell', detail: 'Hears "Notifications, 3 unread, button, collapsed".' },
    { kind: 'screen-reader', title: 'New item', detail: 'Hears "New notification: Export ready: Q3 vendor spend" without focus moving.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
