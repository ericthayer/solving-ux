import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const sidePanelPattern: PatternDefinition = {
  id: 'modals.side-panel',
  slug: 'side-panel',
  title: 'Side panel for master-detail',
  summary:
    'Non-modal detail panel beside a list: focus moves to the record and back to its row, Escape closes, the record lives in the URL, and narrow containers get a modal full-screen sheet.',
  category: 'modals',
  tags: ['side panel', 'drawer', 'master-detail', 'split view', 'focus management', 'reflow'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Users scan a list of records and open one to check or edit it, then move to the next. The audited panel slid over the list without moving focus, so keyboard and screen reader users kept tabbing through rows hidden underneath it. It could not be closed with Escape, its close icon was a mouse-only "×", and closing it rebuilt the list, so users lost their scroll position and their place. On narrow screens the fixed-width panel ran off the edge with no way back.',
  beforeState: {
    summary: 'Fixed-width overlay that slides over the list, with an icon-only close and no keyboard support.',
    failures: [
      {
        id: 'covers-list',
        description: 'The panel overlays the list, so focused rows sit hidden underneath it.',
        refs: [{ kind: 'wcag', criterion: '2.4.11' }],
        target: { label: 'Slide-over panel', revealedBy: 'Open a work order' },
      },
      {
        id: 'focus-left-behind',
        description: 'Opening a record leaves focus on the row; nothing tells a screen reader user the panel exists.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'Work order table' },
      },
      {
        id: 'no-escape',
        description: 'Escape does nothing. Keyboard users have no way to dismiss the panel.',
        refs: [{ kind: 'heuristic', id: 'H3' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Panel title bar', revealedBy: 'Open a work order' },
      },
      {
        id: 'mouse-only-close',
        description: 'Close is a "×" in a span: not focusable, no role, no accessible name.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'Close icon', revealedBy: 'Open a work order' },
      },
      {
        id: 'place-lost',
        description: 'Closing rebuilds the list: scroll jumps to the top, focus drops to the page, and the selection is gone.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: 'Scrolling list' },
      },
      {
        id: 'fixed-width',
        description: 'The panel is a fixed 26rem wide. On a phone it runs off screen and covers the whole list.',
        refs: [{ kind: 'wcag', criterion: '1.4.10' }],
        target: { label: 'Panel content', revealedBy: 'Open a work order at 390px width' },
      },
    ],
  },
  designRationale:
    'The list is the user\'s place, so it never unmounts and never sits under the panel: on wide containers the panel takes its own column, and the focused row is always visible. Opening a record moves focus to the panel heading, which announces the region and the record name; closing returns focus to the row that opened it, or to the list if that row is gone. Escape and a visible, named Close button both close. The open record is a URL parameter, so a reload or a shared link reopens it without stealing focus on load. Below a container-width threshold the panel becomes a native modal <dialog> filling the screen, with a "Back to list" button, because a side-by-side layout no longer fits and a half-covered list is worse than none. The threshold reads the container, not the viewport, so the same component works in a narrow sidebar on a wide screen.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'master', type: 'ReactNode', required: true, description: 'The list or table. Stays mounted while the panel is open, so scroll and selection survive.' },
    { name: 'recordKey', type: 'string | null', required: true, description: 'Id of the open record; null closes the panel. A new key moves focus to the panel heading.' },
    { name: 'title', type: 'string', required: true, description: 'Record name. Becomes the panel heading and the region or dialog name.' },
    { name: 'subtitle', type: 'ReactNode', required: false, description: 'One line of context under the title, e.g. id and status.' },
    { name: 'children', type: 'ReactNode', required: true, description: 'Record details and actions.' },
    { name: 'onClose', type: '() => void', required: true, description: 'Set recordKey to null. Called by Close, Back to list, and Escape.' },
    { name: 'layout', type: "'auto' | 'inline' | 'sheet'", required: false, defaultValue: "'auto'", description: 'auto measures the container and picks inline or sheet.' },
    { name: 'sheetBelow', type: 'number', required: false, defaultValue: '640', description: 'Container width in px below which the panel becomes a modal sheet.' },
    { name: 'headingLevel', type: '2 | 3 | 4', required: false, defaultValue: '2', description: 'Match the page outline.' },
    { name: 'closeLabel', type: 'string', required: false, defaultValue: '"Close"', description: 'Close button text in inline mode.' },
    { name: 'backLabel', type: 'string', required: false, defaultValue: '"Back to list"', description: 'Close button text in sheet mode, where the list is hidden.' },
  ],
  usage: `const [recordId, setRecordId] = useRecordParam('record');
const record = orders.find((o) => o.id === recordId) ?? null;

<SidePanel
  master={<OrderList selectedId={record?.id} onOpen={setRecordId} />}
  recordKey={record?.id ?? null}
  title={record?.title ?? ''}
  subtitle={record && \`\${record.id} · \${record.status}\`}
  onClose={() => setRecordId(null)}
>
  {record && <OrderDetails order={record} />}
</SidePanel>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'Focus moves to the panel heading on open and back to the triggering row on close.' },
    { kind: 'wcag', criterion: '2.4.11', level: 'AA', title: 'Focus not obscured (minimum)', detail: 'The inline panel has its own column, so it never covers the focused row.' },
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'The panel is a region (or dialog) named by the record title; the selected row has aria-current.' },
    { kind: 'wcag', criterion: '1.4.10', level: 'AA', title: 'Reflow', detail: 'Below the container threshold the panel becomes a full-screen sheet instead of overflowing.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'On a row, open the record and move focus to its heading.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Anywhere in the panel, close it and return to the row.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Inline: move between panel and list freely. Sheet: stay inside the dialog.' },
    { kind: 'aria', attribute: 'section aria-labelledby', detail: 'Exposes the panel as a region landmark named by the record title.' },
    { kind: 'aria', attribute: 'aria-current="true"', detail: 'Marks the open record in the list, read as "current".' },
    { kind: 'aria', attribute: 'tabindex="-1" on the heading', detail: 'Lets the heading take focus without adding a tab stop.' },
    { kind: 'screen-reader', title: 'On open', detail: 'Announces "Inspect fire doors, region, Inspect fire doors, heading level 3".' },
    { kind: 'screen-reader', title: 'On close', detail: 'Focus lands back on the row and reads it with "current".' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
