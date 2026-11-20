import type { CodeAnnotation } from '../../../types/walkthrough';

export const facetedFiltersWalkthrough: CodeAnnotation[] = [
  {
    id: 'counts',
    anchor: '/** Count for each option as if it were checked next: other facets apply, its own facet does not. */',
    endAnchor: 'return counts;',
    topic: 'state',
    title: 'Counts that predict the next click',
    rationale:
      'Each option is counted with every other facet applied but not its own, so checking "Approved" never zeroes out "Rejected". Users see a dead end before they reach it, which the audited panel never showed.',
  },
  {
    id: 'url-parse',
    anchor: '/** Reads `?<prefix><facetId>=a,b` params. Unknown facets and values are dropped, so stale links cannot break the view. */',
    endAnchor: 'return selection;',
    topic: 'resilience',
    title: 'Shared links survive renamed options',
    rationale:
      'Only known values are read back. A bookmarked view whose option was retired loads with that filter dropped instead of showing an empty list nobody can explain.',
  },
  {
    id: 'replace-state',
    anchor: '// replaceState, not pushState: filtering is not navigation, so Back still leaves the page.',
    endAnchor: 'window.history.replaceState(window.history.state, \'\', url);',
    topic: 'state',
    title: 'URL state without polluting history',
    rationale:
      'The filtered view can be copied and shared. replaceState keeps Back meaning "leave this page", and passing history.state through keeps the router\'s own state intact.',
  },
  {
    id: 'focus-after-remove',
    anchor: '// Removing a chip unmounts the focused button. Move focus to its neighbor, or to the results when none remain.',
    endAnchor: 'else resultsRef.current?.focus();',
    topic: 'focus',
    title: 'Focus has somewhere to go',
    rationale:
      'The button the user pressed no longer exists, so the browser would drop focus to the body. A layout effect moves it to the next chip before paint, or to the results region after the last one.',
    wcag: ['2.4.3'],
  },
  {
    id: 'status-text',
    anchor: 'const status =',
    endAnchor: ': `Showing ${results.length.toLocaleString()} of ${count(total)}.`;',
    topic: 'announce',
    title: 'Every outcome is a sentence',
    rationale:
      'Zero results says what to do next instead of rendering an empty table. The same text is shown and announced.',
    wcag: ['4.1.3'],
  },
  {
    id: 'fieldset',
    anchor: '<fieldset key={facet.id} className={styles.group}>',
    endAnchor: '<legend className={styles.legend}>{facet.label}</legend>',
    topic: 'semantics',
    title: 'Fieldset and legend name each group',
    rationale:
      'Screen readers announce "Status, grouping" on entry, so "Approved" is never heard without context. The audited panel used clickable divs that the keyboard could not open.',
    wcag: ['1.3.1'],
  },
  {
    id: 'checkbox',
    anchor: 'onChange={(event) => setChecked(facet.id, option.value, event.target.checked)}',
    topic: 'focus',
    title: 'Changing a filter changes nothing else',
    rationale:
      'The handler updates state and nothing more: no reload, no scroll, no focus move. Filtering in place is what makes immediate-apply checkboxes acceptable under On Input.',
    wcag: ['3.2.2'],
  },
  {
    id: 'count-label',
    anchor: '<span className={styles.count}>',
    endAnchor: '<span className={styles.srOnly}> {n === 1 ? \'result\' : \'results\'}</span>',
    topic: 'announce',
    title: 'Counts are part of the label',
    rationale:
      'The count sits inside the label, so it is read with the option ("Approved 50 results") rather than as a stray number. Zero-count options stay enabled and focusable.',
  },
  {
    id: 'chip',
    anchor: 'aria-label={`Remove filter ${chip.text}`}',
    topic: 'semantics',
    title: 'One chip, one large target',
    rationale:
      'The whole chip is the remove button. Its accessible name starts with the action and contains the visible text, so voice users can say "click Status: Approved".',
    wcag: ['2.5.8', '2.5.3'],
  },
  {
    id: 'status-region',
    anchor: '<p role="status" className={styles.status}>',
    topic: 'announce',
    title: 'Always-rendered live region',
    rationale:
      'The status line exists from the first render, so the first change is announced reliably. It is polite: it waits until the checkbox state has been read.',
    wcag: ['4.1.3'],
  },
  {
    id: 'drawer',
    file: 'styles',
    anchor: '/* Narrow containers: the panel becomes a drawer opened from a toggle, closed by "Show N results". */',
    endAnchor: '.layout:not([data-drawer-open]) .panel {',
    topic: 'styling',
    title: 'A container query, not a viewport query',
    rationale:
      'The layout responds to the width it is given, so the same component works in a full page or a side panel. The drawer controls are display: none on wide layouts, which also keeps them out of the tab order.',
    wcag: ['1.4.10'],
  },
];
