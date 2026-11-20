import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const dateRangePattern: PatternDefinition = {
  id: 'forms.date-range',
  slug: 'date-range',
  title: 'Date and date-range input',
  summary: 'Typed date entry with the format in the label and a tolerant parser, an optional APG calendar dialog, range presets, range validation, and a stated time zone.',
  category: 'forms',
  tags: ['forms', 'date picker', 'date range', 'calendar', 'validation', 'keyboard'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Report filters and order forms use a calendar popup as the only way to enter a date. The field is read-only, the format is never stated, so 03/04 could be March 4 or April 3, and the calendar is a grid of clickable divs that ignores the keyboard. An end date before the start date is accepted and the report quietly returns nothing. Results never say which time zone the dates are in, so totals disagree with other systems near midnight.',
  beforeState: {
    summary: 'Read-only date fields with a mouse-only calendar popup and no range check.',
    failures: [
      {
        id: 'calendar-only',
        description: 'The field is read-only. Typing a known date is impossible; every date takes a trip through the popup.',
        refs: [{ kind: 'heuristic', id: 'H7' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'From date field' },
      },
      {
        id: 'unlabeled-trigger',
        description: 'The calendar icon is a div with no name, role, or keyboard access.',
        refs: [{ kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Calendar icon beside From' },
      },
      {
        id: 'format-unstated',
        description: 'Dates show as 03/04/26 with no stated format, so day and month order is a guess.',
        refs: [{ kind: 'wcag', criterion: '3.3.2' }, { kind: 'heuristic', id: 'H2' }],
        target: { label: 'From and To fields' },
      },
      {
        id: 'mouse-only-grid',
        description: 'Calendar days are clickable divs. Arrow keys, Enter, and Escape do nothing, and day cells have no accessible names.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'wcag', criterion: '1.3.1' }],
        target: { label: 'Calendar popup', revealedBy: 'Click the calendar icon' },
      },
      {
        id: 'inverted-range',
        description: 'A To date before the From date is accepted, and the report silently returns 0 orders.',
        refs: [{ kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '3.3.1' }, { kind: 'wcag', criterion: '3.3.3' }],
        target: { label: 'To date field' },
      },
      {
        id: 'no-time-zone',
        description: 'Results never say which time zone the dates use, so counts disagree with other reports near midnight.',
        refs: [{ kind: 'heuristic', id: 'H2' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Report result line' },
      },
    ],
  },
  designRationale:
    'Typing is the fastest way to enter a date people already know, so the text field comes first and the calendar is an optional helper. The format sits in the visible label, and the parser accepts what people actually type (3/4/26, 2026-03-04, Mar 4 2026) without ever guessing day-first. On blur the value is rewritten in the stated format and echoed in words ("Wednesday, March 4, 2026") so a misread is caught before it is submitted. The calendar follows the APG date picker dialog: a real grid with arrow, Page Up and Page Down, Home and End keys, Escape back to the button. Presets cover the common ranges in one click. An inverted or oversize range gets a message that names the fix, and the component never emits an invalid range. Where dates become instants, the time zone is stated next to the fields.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'legend', type: 'string', required: true, description: 'Group name in range mode, field label in single mode.' },
    { name: 'onChange', type: '(range: DateRange) => void', required: true, description: 'Receives ISO dates ("YYYY-MM-DD") on blur, preset, or calendar pick. Never called with an invalid range.' },
    { name: 'mode', type: "'range' | 'single'", required: false, defaultValue: "'range'", description: 'Single mode renders one field and no presets; the value arrives as range.start.' },
    { name: 'labels', type: '{ start: string; end: string }', required: false, defaultValue: "{ start: 'Start date', end: 'End date' }", description: 'Field labels in range mode. The format "(MM/DD/YYYY)" is appended to each.' },
    { name: 'defaultValue', type: 'DateRange', required: false, description: 'Initial ISO dates. The component keeps its own text state after that.' },
    { name: 'presets', type: 'RangePreset[]', required: false, defaultValue: 'DEFAULT_PRESETS', description: 'Quick ranges computed from today. Pass [] to hide them.' },
    { name: 'min / max', type: 'IsoDate', required: false, description: 'Inclusive bounds. Out-of-bounds days are disabled in the calendar and rejected when typed.' },
    { name: 'maxDays', type: 'number', required: false, description: 'Longest allowed range, counting both ends.' },
    { name: 'required', type: 'boolean', required: false, defaultValue: 'false', description: 'Empty fields are errors when true; otherwise an empty end means "onward".' },
    { name: 'timeZoneNote', type: 'string', required: false, description: 'States how dates become instants. Associated with the group (or the field in single mode).' },
    { name: 'today', type: 'IsoDate', required: false, defaultValue: "user's local date", description: 'Anchor for presets and the calendar. Pass the server date when it matters.' },
  ],
  usage: `<DateRangeInput
  legend="Order date"
  labels={{ start: 'From', end: 'To' }}
  max={today}
  maxDays={366}
  timeZoneNote="Dates use UTC, from 00:00 on the first day to 23:59 on the last."
  onChange={(range) => setFilter({ orderedFrom: range.start, orderedTo: range.end })}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '3.3.2', level: 'A', title: 'Labels or instructions', detail: 'The expected format is part of the visible label, so it is read with the field and never disappears like a placeholder.' },
    { kind: 'wcag', criterion: '3.3.3', level: 'AA', title: 'Error suggestion', detail: 'Messages name the fix: "Enter from as MM/DD/YYYY, for example 03/04/2026." and "To must be on or after from, Sunday, March 1, 2026."' },
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'Every date can be typed, and the calendar is fully operable with the keyboard.' },
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'The calendar button is named for its field and current value ("Change from, Sunday, March 1, 2026"); day cells are named with the full date.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'The applied range and its length are announced in a polite status region.' },
    { kind: 'keyboard', keys: 'Arrow keys', action: 'In the calendar, move one day (left, right) or one week (up, down).' },
    { kind: 'keyboard', keys: 'Page Up / Page Down', action: 'Previous or next month. With Shift, previous or next year.' },
    { kind: 'keyboard', keys: 'Home / End', action: 'First or last day of the week.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'Choose the focused day, close the calendar, and return focus to its button.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Close the calendar without changing the date and return focus to its button.' },
    { kind: 'aria', attribute: 'role="grid" + roving tabindex', detail: 'Only the focused day is tabbable, so Tab moves between the month buttons, the grid, and Cancel.' },
    { kind: 'aria', attribute: 'aria-selected / aria-current="date" / aria-disabled', detail: 'Mark the chosen day, today, and out-of-bounds days without relying on color.' },
    { kind: 'aria', attribute: 'aria-pressed', detail: 'Preset buttons report which preset matches the applied range.' },
    { kind: 'screen-reader', title: 'Typed date', detail: 'After blur the field reads "From (MM/DD/YYYY), edit, 03/04/2026, Wednesday, March 4, 2026", confirming how the date was understood.' },
    { kind: 'screen-reader', title: 'Calendar', detail: 'Opening reads "Choose from, dialog" then the focused day, "Wednesday, March 4, 2026, selected". Changing month announces "April 2026".' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
