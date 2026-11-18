import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';

export const emptyStatePattern: PatternDefinition = {
  id: 'empty-states.empty-state',
  slug: 'empty-state',
  title: 'Empty, error, and no-access states',
  summary: 'One component, four typed variants: first use, no results, load error with reference id, and no access with a path to request it.',
  category: 'empty-states',
  tags: ['empty state', 'error state', 'zero data', 'onboarding', 'permissions'],
  sourceApps: ['Both'],
  problemStatement:
    'Empty tables show "No data" whether the user is new, filtered everything out, hit a server error, or lacks permission. Users cannot tell whether to wait, change filters, call support, or ask for access, so they file tickets for all four. Error screens show stack traces or a generic "Error 500" with no way to retry.',
  beforeState: {
    summary: 'Grey "No data" text centered in an empty grid, used for every case.',
    failures: [
      'Same message for first use, zero results, errors, and permission denials.',
      'No next step offered; users leave the page or open a ticket.',
      'Filter-caused empties do not mention the active filters.',
      'Errors have no retry and no reference id for support.',
      'State changes are silent to screen reader users.',
    ],
  },
  designRationale:
    'An empty view is a decision point, so each variant names the cause and offers the one action that resolves it. A discriminated union in the props makes the variant explicit and stops teams from mixing, for example, a retry button into a no-access state. No-results counts active filters and offers to clear them, the most common fix. Errors include a copyable reference id, which shortens support tickets. Status changes announce politely; errors announce assertively.',
  component: Demo,
  props: [
    { name: 'variant', type: "'first-use' | 'no-results' | 'error' | 'no-access'", required: true, description: 'Selects the variant and which other props are allowed.' },
    { name: 'headingLevel', type: '1 | 2 | 3 | 4', required: false, defaultValue: '2', description: 'Match the surrounding document outline. Use 1 when the state fills the page.' },
    { name: 'first-use: title, description, primaryAction, learnMore?', type: 'string, string, { label, onClick }, { label, href }', required: true, description: 'Explain the value of the empty area and the first step to fill it.' },
    { name: 'no-results: query?, activeFilterCount, onClearFilters, suggestions?', type: 'string, number, () => void, string[]', required: true, description: 'Clear action appears only when filters are active.' },
    { name: 'error: description, onRetry, title?, errorReference?, supportHref?', type: 'string, () => void, string, string, string', required: true, description: 'Reference id is shown with a copy button.' },
    { name: 'no-access: resource, requestAccessHref, ownerName?', type: 'string, string, string', required: true, description: 'Say who grants access and link to the request flow.' },
  ],
  usage: `<EmptyState
  variant="no-results"
  query={search}
  activeFilterCount={filters.length}
  onClearFilters={clearFilters}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'no-results uses role="status"; error uses role="alert".' },
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'Configurable heading level keeps the page outline valid wherever the state is placed.' },
    { kind: 'wcag', criterion: '1.1.1', level: 'A', title: 'Non-text content', detail: 'Icons are decorative (aria-hidden, focusable="false"); the heading carries the meaning.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Reach the primary action, secondary link, and copy button in visual order.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'Activate the action.' },
    { kind: 'aria', attribute: 'aria-labelledby', detail: 'The section is a region named by its heading.' },
    { kind: 'screen-reader', title: 'Copy button', detail: 'Announced as "Copy error reference", then "Copied error reference" after activation.' },
    { kind: 'screen-reader', title: 'Filtering to zero', detail: 'Hears "No results for halvorsn dairy. 3 filters are narrowing these results." without moving focus.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-17',
  author: 'Design System Team',
};
