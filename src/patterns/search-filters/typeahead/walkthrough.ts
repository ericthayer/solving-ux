import type { CodeAnnotation } from '../../../types/walkthrough';

export const typeaheadWalkthrough: CodeAnnotation[] = [
  {
    id: 'rank',
    anchor: '/** Prefix matches rank above substring matches; within each, original order is kept. */',
    endAnchor: 'return [...prefix, ...contains];',
    topic: 'performance',
    title: 'Rank by relevance in one pass',
    rationale:
      'The audited autocomplete sorted by id. Prefix matches come first, then substring and description matches, in one linear pass with no sort. It is exported so it can be unit tested and reused server side.',
  },
  {
    id: 'highlight',
    anchor: 'function highlight(text: string, query: string): ReactNode {',
    endAnchor: '<mark>{text.slice(index, end)}</mark>',
    topic: 'semantics',
    title: 'Matched text uses <mark>',
    rationale:
      '<mark> carries meaning and is styled bold and underlined, not just tinted, so the match is visible without color. Text nodes are sliced, never injected as HTML, so labels cannot inject markup.',
    wcag: ['1.4.1'],
  },
  {
    id: 'deferred',
    anchor: 'const deferredQuery = useDeferredValue(query);',
    endAnchor: 'const results = matches.slice(0, maxResults);',
    topic: 'performance',
    title: 'Typing never waits for filtering',
    rationale:
      'useDeferredValue lets the input update on every keystroke while ranking runs at lower priority. Capping rendered results keeps the DOM small; the audited list rendered every match and lagged on each key.',
  },
  {
    id: 'status-text',
    anchor: 'const status = !enoughChars',
    endAnchor: ": `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}.`;",
    topic: 'announce',
    title: 'Counts and empty results are sentences',
    rationale:
      'Users hear "Showing 8 of 1,204 matches. Keep typing to narrow." or "No matches for \'acme\'." instead of a silent blank box. The truncated case tells users why the list stops.',
    wcag: ['4.1.3'],
  },
  {
    id: 'keys',
    anchor: 'const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {',
    endAnchor: 'setActive(-1);',
    topic: 'focus',
    title: 'Arrow keys, Enter, and Escape',
    rationale:
      'Focus never leaves the input; arrows move a virtual cursor through the list. Enter only selects when an option is active, so pressing Enter on free text still submits the surrounding form. Escape closes the list first, then clears the text on a second press.',
    wcag: ['2.1.1'],
  },
  {
    id: 'combobox',
    anchor: 'role="combobox"',
    endAnchor: "aria-describedby={hint ? `${id}-hint` : undefined}",
    topic: 'semantics',
    title: 'ARIA 1.2 combobox on the input',
    rationale:
      'The input owns the combobox role and points at the listbox. aria-activedescendant tells screen readers which option is active while DOM focus stays in the input. Autocomplete and spellcheck are off so browser suggestions do not cover the list.',
    wcag: ['4.1.2', '1.3.1'],
  },
  {
    id: 'mousedown',
    anchor: '// mousedown fires before input blur, so the click is not lost when the list closes.',
    endAnchor: 'select(option);',
    topic: 'resilience',
    title: 'Clicks land before blur closes the list',
    rationale:
      'The audited control sometimes ignored clicks because the input blur closed the list before the click registered. Selecting on mousedown, with preventDefault keeping focus in the input, removes the race.',
  },
  {
    id: 'status-region',
    anchor: '{/* Lives in the popup so the count stays visible under the results;',
    endAnchor: '{open ? status : \'\'}',
    topic: 'announce',
    title: 'Visible status that is also a live region',
    rationale:
      'The count is shown under the results and announced from the same element, so sighted and screen reader users get the same message. It is always rendered so the first update is announced.',
    wcag: ['4.1.3'],
  },
  {
    id: 'forced-colors',
    file: 'styles',
    anchor: '@media (forced-colors: active) {',
    endAnchor: 'outline: 2px solid Highlight;',
    topic: 'styling',
    title: 'Active option survives Windows High Contrast',
    rationale:
      'Forced colors strip backgrounds, which would erase the active option. A system Highlight outline keeps it visible.',
    wcag: ['1.4.11'],
  },
];
