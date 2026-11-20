import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const listPaginationPattern: PatternDefinition = {
  id: 'data-table.list-pagination',
  slug: 'list-pagination',
  title: 'Pagination, load more and infinite scroll',
  summary: 'One list component with three loading modes, a rule for choosing between them, and correct focus, counts, and back-navigation in each.',
  category: 'data-table',
  tags: ['pagination', 'load more', 'infinite scroll', 'lists', 'focus management'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Long lists are split up by whichever mechanism the team picked first, not the one the task needs. Activity feeds scroll forever so the footer links can never be reached. "Load more" buttons append rows above the focused button, so keyboard and screen reader users skip every new item. Work queues mark the current page by color alone, the page numbers are not keyboard controls, and opening a record then pressing Back drops the user on page 1.',
  beforeState: {
    summary: 'An auto-appending activity feed, a "Load more" catalog, and a numbered work queue, each built the way it usually ships.',
    failures: [
      {
        id: 'footer-unreachable',
        description: 'The feed appends more rows whenever the reader nears the bottom, so the footer links keep moving out of reach.',
        refs: [{ kind: 'heuristic', id: 'H3' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Footer links at the end of the activity feed' },
      },
      {
        id: 'load-more-focus',
        description: 'After "Load more", focus stays on the button below the list, so the next Tab skips every new item.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: '"Load more" button in the catalog' },
      },
      {
        id: 'silent-count',
        description: 'Loading more rows announces nothing and shows no running count, so nobody knows how many arrived or how many remain.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Catalog list' },
      },
      {
        id: 'page-current',
        description: 'The current page differs only by text color and has no aria-current, so it is invisible to screen readers and to people who cannot see the color.',
        refs: [{ kind: 'wcag', criterion: '1.3.1' }, { kind: 'wcag', criterion: '1.4.1' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'Current page number in the work queue' },
      },
      {
        id: 'page-keyboard',
        description: 'Page numbers are clickable text, not links or buttons, so they cannot be reached or activated from the keyboard.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'Page 2 in the work queue' },
      },
      {
        id: 'position-lost',
        description: 'Opening a request and going back resets the queue to page 1, so the user has to find their place again.',
        refs: [{ kind: 'heuristic', id: 'H3' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: 'First request link in the work queue' },
      },
    ],
  },
  designRationale:
    'Choose the mode from the task, not from taste. Pages for tasks where people compare, cite, or come back to a position: work queues, records, search results. Load more for browsing, where reading order matters more than position. Infinite scroll almost never: only for feeds with nothing below them, and even then it pauses after two automatic loads and hands over to the Load more button so the footer stays reachable. Every mode shares one contract: a visible and announced count, list items that report their position in the full set (aria-posinset), focus that lands on what changed (the list after a page change, the first new item after Load more, nothing after an automatic load), and position restored when the user comes back.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Visible label. Names the list and the page navigation landmark.' },
    { name: 'items', type: 'T[] (T extends { id: string })', required: true, description: 'Full result set. Ids anchor focus and back-navigation restore.' },
    { name: 'renderItem', type: '(item: T) => ReactNode', required: true, description: 'Content for one list item.' },
    { name: 'mode', type: "'pages' | 'load-more' | 'infinite'", required: true, description: 'Loading mechanism. Pages for tasks, load more for browsing, infinite almost never.' },
    { name: 'pageSize', type: 'number', required: false, defaultValue: '10', description: 'Items per page or per load.' },
    { name: 'maxAutoLoads', type: 'number', required: false, defaultValue: '2', description: 'Infinite mode only. Automatic loads before the Load more button takes over.' },
    { name: 'restoreKey', type: 'string', required: false, description: 'sessionStorage key. Restores page, loaded count, and focus on the last opened item after back navigation.' },
    { name: 'noun', type: 'string', required: false, defaultValue: "'results'", description: 'Plural noun used in counts and announcements.' },
  ],
  usage: `<PagedList<Request>
  label="Service requests"
  noun="requests"
  items={requests}
  mode="pages"
  restoreKey="requests-list"
  renderItem={(request) => <a href={\`/requests/\${request.id}\`}>{request.title}</a>}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'Items sit in a labelled ordered list with aria-setsize and aria-posinset, so "item 11 of 57" is announced even when only 10 are rendered.' },
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'Page numbers, Previous, Next, and Load more are native buttons. Infinite mode always keeps a Load more button as the keyboard path.' },
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'A page change focuses the list; Load more focuses the first new item; automatic loads leave focus alone; Back restores focus to the item that was opened.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Page changes and loads are announced through a role="status" region with the new range and total.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Move between item controls and the page or load controls.' },
    { kind: 'keyboard', keys: 'Enter or Space', action: 'Go to a page, or load the next batch.' },
    { kind: 'aria', attribute: 'aria-current="page"', detail: 'Marks the current page button. Fill, weight, and underline show it visually, never color alone.' },
    { kind: 'aria', attribute: 'aria-posinset / aria-setsize', detail: 'Each item reports its position in the whole set, not just the rendered slice.' },
    { kind: 'screen-reader', title: 'After Load more', detail: 'Hears "Loaded 10 more. Showing 20 of 57 requests." and lands on item 11.' },
    { kind: 'screen-reader', title: 'After Back', detail: 'Hears "Returned to your place." with focus on the request that was opened.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
