import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const bulkActionsPattern: PatternDefinition = {
  id: 'data-table.bulk-actions',
  slug: 'bulk-actions',
  title: 'Bulk action table',
  summary: 'Sortable, paginated table with page and cross-page selection, a persistent action bar, and a frozen identifier column.',
  category: 'data-table',
  tags: ['table', 'selection', 'sorting', 'pagination', 'frozen columns'],
  sourceApps: ['Both'],
  problemStatement:
    'Loan and account grids select rows with unlabeled checkboxes, then hide bulk actions in a kebab menu above the table. Users cannot tell how many rows are selected after paging, whether "select all" means this page or every record, or which column is sorted. Wide tables scroll the identifier column off screen, so users lose track of which row they are editing.',
  beforeState: {
    summary: 'A 14-column grid with checkbox selection and a "More actions" overflow menu.',
    failures: [
      {
        id: 'select-all-scope',
        description: 'Select-all checkbox silently selects every record across all pages.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '3.3.4' }],
        target: { label: 'Select-all checkbox in the header row' },
      },
      {
        id: 'selection-count',
        description: 'Selection count is not shown; actions run against an unknown number of rows.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'wcag', criterion: '4.1.3' }],
        target: { label: '"More actions" menu button' },
      },
      {
        id: 'sort-state',
        description: 'Sort state is shown only by a 6px arrow with no programmatic aria-sort.',
        refs: [{ kind: 'wcag', criterion: '1.3.1' }, { kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Sort arrow in the Application header' },
      },
      {
        id: 'frozen-column',
        description: 'Horizontal scroll hides the account number column.',
        refs: [{ kind: 'heuristic', id: 'H6' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Horizontally scrolling grid' },
      },
      {
        id: 'checkbox-names',
        description: 'Checkboxes have no accessible name; screen readers announce "checkbox, not checked" 50 times.',
        refs: [{ kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '1.3.1' }],
        target: { label: 'Row selection checkboxes' },
      },
    ],
  },
  designRationale:
    'The action bar is always present, so selecting rows never shifts the layout, and it doubles as the selection count. Select-all is scoped to the visible page, with an explicit "Select all N rows" escalation, so scope is never ambiguous. Sorting uses a native button inside the header with aria-sort, giving screen reader users the same state sighted users get. The first column is a row header and stays frozen, so every cell keeps its context during horizontal scroll.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'caption', type: 'string', required: true, description: 'Visible table caption. Also names the scroll region and pagination landmark.' },
    { name: 'rows', type: 'T[] (T extends { id: string })', required: true, description: 'Row data. Selections for ids that disappear are dropped automatically.' },
    { name: 'columns', type: 'Column<T>[]', required: true, description: 'Column config: key, header, sortable, align, and an optional render function. The first column becomes the frozen row header.' },
    { name: 'bulkActions', type: 'BulkAction[]', required: true, description: 'Actions shown when rows are selected. Each receives the selected ids. Use tone "danger" for destructive actions.' },
    { name: 'rowLabel', type: '(row: T) => string', required: true, description: 'Builds each checkbox label, e.g. "Select APP-4100, Cedar Ridge Farms".' },
    { name: 'pageSize', type: 'number', required: false, defaultValue: '10', description: 'Rows per page.' },
  ],
  usage: `<BulkActionTable<Loan>
  caption="Loan applications"
  rows={loans}
  columns={[{ key: 'id', header: 'Loan', sortable: true }, { key: 'amount', header: 'Amount', align: 'end' }]}
  rowLabel={(loan) => loan.id}
  bulkActions={[{ id: 'approve', label: 'Approve', onSelect: approveLoans }]}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'Uses a native table with caption, column headers (scope="col"), and row headers (scope="row") for the frozen column.' },
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'The scroll container is focusable (tabindex="0") so keyboard users can scroll wide tables with arrow keys.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Sort changes, selection counts, page changes, and action results are announced through a role="status" region.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Move between selection checkboxes, sort buttons, actions, and pagination.' },
    { kind: 'keyboard', keys: 'Space', action: 'Toggle the focused checkbox.' },
    { kind: 'keyboard', keys: 'Enter or Space on a header', action: 'Sort by that column; repeat to reverse direction.' },
    { kind: 'aria', attribute: 'aria-sort', detail: 'Set to ascending, descending, or none on every sortable column header.' },
    { kind: 'aria', attribute: 'indeterminate (DOM property)', detail: 'Select-all checkbox reports "mixed" when part of the page is selected.' },
    { kind: 'screen-reader', title: 'Row checkboxes', detail: 'Announced as "Select APP-4100, Cedar Ridge Farms, checkbox, not checked" rather than an unnamed checkbox.' },
    { kind: 'screen-reader', title: 'After a bulk action', detail: 'Hears "Approve applied to 3 rows." without focus moving.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-17',
  author: 'Design System Team',
};
