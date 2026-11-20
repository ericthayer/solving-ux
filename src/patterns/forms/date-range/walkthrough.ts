import type { CodeAnnotation } from '../../../types/walkthrough';

export const dateRangeWalkthrough: CodeAnnotation[] = [
  {
    id: 'real-dates-only',
    anchor: '/** Builds a date only if it exists: 02/30 is rejected, never rolled over into March. */',
    endAnchor: 'return Number.isFinite(toNum(iso)) && fromNum(toNum(iso)) === iso ? iso : null;',
    topic: 'resilience',
    title: 'Impossible dates are rejected, not rolled over',
    rationale:
      'JavaScript Date quietly turns February 30 into March 2. Round-tripping the ISO string catches that, so a typo produces an error message instead of a different, valid-looking date in the report.',
    wcag: ['3.3.1'],
  },
  {
    id: 'echo',
    anchor: '/** "Wednesday, March 4, 2026": an unambiguous echo of what the parser understood. */',
    endAnchor: 'return `${WEEKDAYS[weekday(iso)]}, ${MONTHS[m - 1]} ${d}, ${y}`;',
    topic: 'semantics',
    title: 'Echo the date in words',
    rationale:
      'Numbers alone are what made 03/04 ambiguous in the audited build. Spelling out the weekday and month under the field, and in its description, lets sighted and screen reader users catch a misread before it reaches a report.',
    wcag: ['3.3.2'],
  },
  {
    id: 'tolerant-parser',
    anchor: ' * Tolerant, not clever.',
    endAnchor: 'return null;',
    topic: 'resilience',
    title: 'A tolerant parser that never guesses day-first',
    rationale:
      'People type 3/4/26, 03-04-2026, 2026-03-04 or Mar 4 2026. All of them are accepted, but numeric input is always read in the order the label states. Accepting both orders would bring back the exact ambiguity this pattern exists to remove.',
    wcag: ['3.3.2', '3.3.3'],
  },
  {
    id: 'inverted-range',
    anchor: 'if (start && end && end < start) {',
    endAnchor: 'result.range.end = null;',
    topic: 'resilience',
    title: 'Inverted ranges are an error, never an empty result',
    rationale:
      'The audited report accepted an end date before the start and returned zero rows, which reads as "no orders". Here the end field gets a message naming the start date it must follow, and the invalid range is never emitted.',
    wcag: ['3.3.1', '3.3.3'],
  },
  {
    id: 'roving-focus',
    anchor: '// Roving tabindex: the focused day is the only tabbable cell. Month buttons page without stealing focus.',
    endAnchor: '}, [focus]);',
    topic: 'focus',
    title: 'Roving tabindex across the grid',
    rationale:
      'Only one day is in the tab order, so Tab moves between the month buttons, the grid and Cancel instead of through 31 cells. Paging with the month buttons updates the grid but leaves focus on the button, as the APG dialog example does.',
    wcag: ['2.1.1', '2.4.3'],
  },
  {
    id: 'grid-keys',
    anchor: 'const onGridKey = (event: KeyboardEvent<HTMLTableElement>): void => {',
    endAnchor: 'setFocus(clamp(move()));',
    topic: 'focus',
    title: 'The full APG key set',
    rationale:
      'Arrows move by day and week, Home and End by week edge, Page Up and Page Down by month, with Shift by year. Moves are clamped to min and max so focus never lands on a day that cannot be chosen.',
    wcag: ['2.1.1'],
  },
  {
    id: 'focus-trap',
    anchor: '// Modal: Tab cycles inside the dialog and Escape returns focus to the button that opened it.',
    endAnchor: '(event.shiftKey ? items[items.length - 1] : items[0])?.focus();',
    topic: 'focus',
    title: 'Contained focus and a way out',
    rationale:
      'The dialog is modal, so Tab wraps inside it instead of escaping into the page behind. Escape closes it and puts focus back on the button that opened it, so keyboard users never lose their place.',
    wcag: ['2.1.2', '2.4.3'],
  },
  {
    id: 'day-cells',
    anchor: '<td key={i} role="gridcell" tabIndex={iso === focus ? 0 : -1} aria-label={formatLong(iso)} aria-selected={iso === selected}',
    endAnchor: 'onClick={() => !disabled && onPick(iso)}>',
    topic: 'semantics',
    title: 'Day cells carry the whole date and their state',
    rationale:
      'A cell that only says "4" is meaningless out of context. Each cell is named with the full date, and selected, today and out-of-bounds states are exposed as ARIA states instead of color.',
    wcag: ['1.3.1', '4.1.2'],
  },
  {
    id: 'normalize-on-commit',
    anchor: '// Rewrite what was understood in the stated format, so "3-4-26" visibly becomes 03/04/2026.',
    endAnchor: 'onChange(check.range);',
    topic: 'state',
    title: 'Commit on blur, emit only valid ranges',
    rationale:
      'Typing never triggers a search on every keystroke. On blur the text is rewritten in the stated format and validated; onChange fires only when the whole range is valid and different, so consumers never receive half-typed or inverted input.',
    wcag: ['3.3.1'],
  },
  {
    id: 'presets',
    anchor: '<button key={p.label} type="button" className={styles.preset} aria-pressed={applied.start === r.start && applied.end === r.end}',
    topic: 'semantics',
    title: 'Presets report which one is active',
    rationale:
      'Presets cover the ranges people pick most in one click. aria-pressed tells screen reader users which preset matches the applied range, and it turns off on its own when the dates are edited by hand.',
    wcag: ['4.1.2'],
  },
  {
    id: 'format-in-label',
    anchor: '<label htmlFor={fieldId} className={styles.label}>',
    endAnchor: '</label>',
    topic: 'semantics',
    title: 'The format is part of the label',
    rationale:
      'A placeholder format vanishes as soon as the user types and is often not read. Putting "(MM/DD/YYYY)" in the label keeps it visible, and it becomes part of the accessible name.',
    wcag: ['3.3.2', '1.3.1'],
  },
  {
    id: 'trigger-name',
    anchor: 'aria-label={iso ? `Change ${lower(names[key])}, ${formatLong(iso)}` : `Choose ${lower(names[key])}`}',
    topic: 'semantics',
    title: 'The calendar button names its field and value',
    rationale:
      'The audited build used an unnamed icon div. This button says which field it changes and the current value, and aria-haspopup with aria-expanded tells users a dialog opens.',
    wcag: ['4.1.2'],
  },
  {
    id: 'status',
    anchor: '<p role="status" className={styles.status}>{status}</p>',
    topic: 'announce',
    title: 'Announce the applied range once',
    rationale:
      'The status region renders empty on first paint so later changes are announced. It speaks the applied range and its length after a commit, not on each keystroke.',
    wcag: ['4.1.3'],
  },
  {
    id: 'pressed-mark',
    file: 'styles',
    anchor: ".preset[aria-pressed='true']::before {",
    endAnchor: '}',
    topic: 'styling',
    title: 'Pressed presets show a check mark',
    rationale:
      'The active preset gets a filled background and a check mark, so the state does not depend on telling the accent color from the outline style.',
    wcag: ['1.4.1'],
  },
  {
    id: 'disabled-days',
    file: 'styles',
    anchor: ".grid td[aria-disabled='true'] {",
    endAnchor: '}',
    topic: 'styling',
    title: 'Unavailable days are struck through',
    rationale:
      'Styles hang off the ARIA state, so what users see and what assistive technology reports cannot drift apart. A strike-through marks disabled days for users who cannot distinguish the grey.',
    wcag: ['1.4.1'],
  },
];
