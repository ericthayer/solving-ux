import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const typeaheadPattern: PatternDefinition = {
  id: 'search-filters.typeahead',
  slug: 'typeahead',
  title: 'Typeahead for large data sets',
  summary: 'ARIA 1.2 combobox with ranked matching, highlighted results, a capped list, and a live result count that tells users when to keep typing.',
  category: 'search-filters',
  tags: ['search', 'combobox', 'autocomplete', 'typeahead', 'large data'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Supplier and account pickers use a native select with 5,000+ options, or a custom autocomplete that renders every match. Typing "supp" draws 3,000 rows and freezes the browser for a second. Matches appear in database order, so the exact name the user typed can be on row 400. The custom widget has no ARIA, so screen reader users hear nothing as results change.',
  beforeState: {
    summary: 'Unbounded custom autocomplete over the full supplier list.',
    failures: [
      {
        id: 'renders-everything',
        description: 'Renders every match; long lists cause input lag on each keystroke.',
        refs: [{ kind: 'heuristic', id: 'H7' }, { kind: 'heuristic', id: 'H8' }],
        target: { label: 'Results list', revealedBy: 'Type a letter, e.g. "r"' },
      },
      {
        id: 'id-sort',
        description: 'Results sorted by id, not relevance.',
        refs: [{ kind: 'heuristic', id: 'H2' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: 'First result', revealedBy: 'Type "cedar"' },
      },
      {
        id: 'no-combobox-roles',
        description: 'No combobox or listbox roles; arrow keys do nothing.',
        refs: [{ kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Supplier search input' },
      },
      {
        id: 'no-count',
        description: 'Result count is never announced; empty results show a blank box.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Results box', revealedBy: 'Type "zzz"' },
      },
      {
        id: 'blur-race',
        description: 'Clicking an option sometimes fails because blur closes the list first.',
        refs: [{ kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Result options', revealedBy: 'Type a letter, then press and hold on a result' },
      },
    ],
  },
  designRationale:
    'Show fewer, better results. Prefix matches rank above substring matches, and the list caps at 8 with a live message ("Showing 8 of 1,284 matches. Keep typing to narrow.") that turns an overwhelming list into a clear next step. useDeferredValue keeps typing responsive on large arrays without a debounce delay. The ARIA 1.2 combobox pattern with aria-activedescendant keeps focus in the input, so typing and arrowing work together. Options select on mousedown to beat the blur race. Highlighting uses weight and underline rather than color alone.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Visible label; also names the listbox.' },
    { name: 'options', type: 'TypeaheadOption[]', required: true, description: '{ id, label, description? }. Description is searched and shown under the label.' },
    { name: 'onSelect', type: '(option: TypeaheadOption) => void', required: true, description: 'Called on Enter or click. The input shows the selected label.' },
    { name: 'hint', type: 'string', required: false, description: 'Help text linked with aria-describedby.' },
    { name: 'maxResults', type: 'number', required: false, defaultValue: '8', description: 'Maximum rendered options.' },
    { name: 'minChars', type: 'number', required: false, defaultValue: '1', description: 'Characters required before results appear. Raise to 2 or 3 for very large lists.' },
  ],
  usage: `<Typeahead
  label="Supplier"
  hint="Search by name or account number."
  options={suppliers}
  onSelect={(b) => navigate(\`/suppliers/\${b.id}\`)}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'role="combobox" with aria-expanded, aria-controls, aria-autocomplete="list", and aria-activedescendant.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Result count and no-match messages are announced through role="status".' },
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Matched text is bold and underlined; the active option has an inset bar and background.' },
    { kind: 'keyboard', keys: 'Down / Up Arrow', action: 'Open the list and move the active option; wraps at the ends.' },
    { kind: 'keyboard', keys: 'Enter', action: 'Select the active option.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Close the list; press again to clear the input.' },
    { kind: 'aria', attribute: 'aria-selected', detail: 'Marks the active option; DOM focus stays in the input.' },
    { kind: 'screen-reader', title: 'Typing', detail: 'After a pause: "Showing 8 of 640 matches. Keep typing to narrow."' },
    { kind: 'screen-reader', title: 'Arrowing', detail: 'Reads each option with its description: "Northwind Supply ACCT 10442 · CA, 2 of 8".' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-17',
  author: 'Design System Team',
};
