import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const facetedFiltersPattern: PatternDefinition = {
  id: 'search-filters.faceted-filters',
  slug: 'faceted-filters',
  title: 'Faceted filters with applied-filter chips',
  summary: 'Grouped checkbox facets with live per-option counts, a row of removable chips for what is applied, an announced result count, shareable URL state, and focus that never jumps.',
  category: 'search-filters',
  tags: ['filters', 'facets', 'chips', 'checkbox', 'live region', 'url state'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Users narrow a list of purchase orders by status, category and team at the same time. Every checkbox change reloads the list and drops focus at the top of the page, so keyboard users tab back through every control after each click. Filter groups collapse again on reload, so nothing on screen says what is applied. The result count changes silently, and "clear all" is a small link below the results.',
  beforeState: {
    summary: 'Collapsible filter groups that post back on every change.',
    failures: [
      {
        id: 'reload-on-change',
        description: 'Checking a box reloads the list and drops focus to the top of the page.',
        refs: [{ kind: 'wcag', criterion: '3.2.2' }, { kind: 'wcag', criterion: '2.4.3' }],
        target: { label: 'Status checkboxes', revealedBy: 'Click "Status" to expand it' },
      },
      {
        id: 'no-grouping',
        description: 'Groups are clickable divs with no fieldset or legend. Checkboxes lose their group name, and keyboard users cannot expand a group.',
        refs: [{ kind: 'wcag', criterion: '1.3.1' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Status group header' },
      },
      {
        id: 'buried-applied',
        description: 'Applied filters are hidden inside groups that collapse after every reload; nothing summarizes them.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: 'Filters header' },
      },
      {
        id: 'silent-count',
        description: 'The result count changes without being announced, and there are no per-option counts to warn of a dead end.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Record count' },
      },
      {
        id: 'clear-all-far',
        description: '"clear all" is a small, unfocusable link below the results, far from the filters it resets.',
        refs: [{ kind: 'heuristic', id: 'H3' }, { kind: 'wcag', criterion: '2.5.8' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'clear all link' },
      },
    ],
  },
  designRationale:
    'Filtering is not navigation. Checkboxes apply in place, focus stays on the box the user just changed, and a polite status line reads the new count ("Showing 50 of 120 orders."). Facets use fieldset and legend, so every option is announced with its group. Per-option counts are computed as if that option were checked next (other facets apply, its own does not), so users see dead ends before they hit them; zero-count options stay operable rather than disabled. Applied filters appear as a chip row at the top of the results, each chip one large remove target, with "Clear all filters" right beside them. Removing a chip moves focus to the next chip, or to the results when none remain. State is written to the URL with replaceState, so a filtered view can be shared without filling Back with every click. Under 40rem of container width the panel becomes a drawer with an explicit "Show N orders" button.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Accessible name of the filter form, e.g. "Filter purchase orders".' },
    { name: 'resultsLabel', type: 'string', required: true, description: 'Accessible name of the results region; focus lands here after "Show N results" or clearing filters.' },
    { name: 'noun', type: '[string, string]', required: true, description: 'Singular and plural result noun used in the status line and drawer button.' },
    { name: 'state', type: 'FacetedFilterState<T>', required: true, description: 'Returned by useFacetedFilters(items, facets, urlPrefix?). Holds selection, results, counts, and setters.' },
    { name: 'children', type: 'ReactNode', required: true, description: 'Results, rendered by the caller from state.results.' },
    { name: 'useFacetedFilters(…, urlPrefix)', type: 'string', required: false, description: 'Hook argument. When set, selection is read from and written to ?<prefix><facetId>=a,b. Unknown values in the URL are ignored.' },
  ],
  usage: `const facets = useMemo<Facet<Order>[]>(() => [
  { id: 'status', label: 'Status', options: STATUSES, getValue: (o) => o.status },
  { id: 'team', label: 'Requesting team', options: TEAMS, getValue: (o) => o.team },
], []);
const state = useFacetedFilters(orders, facets, 'f-');

<FacetedFilters label="Filter purchase orders" resultsLabel="Purchase orders" noun={['order', 'orders']} state={state}>
  <OrderList orders={state.results} />
</FacetedFilters>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'Each facet is a fieldset with a legend; each checkbox has a label that includes its count.' },
    { kind: 'wcag', criterion: '3.2.2', level: 'A', title: 'On input', detail: 'Changing a checkbox filters in place. No reload, no navigation, no focus move.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'The result count is a role="status" line, announced politely after every change.' },
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'Removing a chip focuses the next chip, else the previous one, else the results region.' },
    { kind: 'wcag', criterion: '2.5.8', level: 'AA', title: 'Target size (minimum)', detail: 'The whole chip is the remove button, at least 32px tall, instead of a tiny x.' },
    { kind: 'keyboard', keys: 'Space', action: 'Toggle the focused filter option. Focus stays put.' },
    { kind: 'keyboard', keys: 'Enter / Space on a chip', action: 'Remove that filter and move focus to the neighboring chip.' },
    { kind: 'keyboard', keys: 'Escape', action: 'In the narrow layout, close the filter drawer and return focus to the Filters button.' },
    { kind: 'aria', attribute: 'aria-label on chips', detail: '"Remove filter Status: Approved" contains the visible text, so voice control users can say what they see (2.5.3).' },
    { kind: 'aria', attribute: 'aria-expanded', detail: 'On the narrow-layout Filters button, pointing at the panel with aria-controls.' },
    { kind: 'screen-reader', title: 'Checking an option', detail: '"Status, grouping, Approved 50 results, check box, not checked". Space: "checked", then "Showing 50 of 120 orders."' },
    { kind: 'screen-reader', title: 'Removing a chip', detail: 'With Status: Approved and Category: IT hardware applied, removing the first chip reads "Remove filter Category: IT hardware, button", then "Showing 24 of 120 orders."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
