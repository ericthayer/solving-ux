import type { CodeAnnotation } from '../../../types/walkthrough';

export const transferListWalkthrough: CodeAnnotation[] = [
  {
    id: 'match',
    anchor: '/** Case-insensitive match on label or description. A blank query matches everything. */',
    endAnchor: 'return items.filter((item) =>',
    topic: 'performance',
    title: 'One plain filter function',
    rationale:
      'Filtering is a pure, exported function so it can be unit tested and moved server side for very large directories. A blank query returns the same array, so React skips work when nothing is typed.',
  },
  {
    id: 'narrow',
    anchor: '/** Tracks whether the element is narrower than `threshold` px. Off when disabled or unsupported. */',
    endAnchor: 'return narrow;',
    topic: 'resilience',
    title: 'Layout follows the container, not the viewport',
    rationale:
      'A transfer list often sits in a side panel or dialog, so viewport width says little. ResizeObserver measures the control itself. A CSS container query cannot do this alone because the narrow layout has different markup, not just different styling.',
    wcag: ['1.4.10'],
  },
  {
    id: 'fieldset',
    anchor: '<fieldset className={styles.pane}>',
    endAnchor: '</legend>',
    topic: 'semantics',
    title: 'Each list is a fieldset with a counted legend',
    rationale:
      'Screen readers announce the legend when focus enters the list, so users hear "Available (45 people)" once instead of nothing. The audited multi-selects had captions that were not associated with them.',
    wcag: ['1.3.1', '2.4.6'],
  },
  {
    id: 'select-all',
    anchor: '<label className={styles.selectAll}>',
    endAnchor: "{filtered ? ' matching' : ''}",
    topic: 'state',
    title: 'Select-all names exactly what it covers',
    rationale:
      'The label says the count and whether a filter applies ("Select all 6 people matching"), and the checkbox is indeterminate when only some are checked. Users never have to guess whether hidden rows are included.',
    wcag: ['4.1.2'],
  },
  {
    id: 'checkboxes',
    anchor: '<label className={styles.option}>',
    endAnchor: '</label>',
    topic: 'semantics',
    title: 'Checkboxes instead of Ctrl-click',
    rationale:
      'Native checkboxes make multiple selection obvious with a mouse, keyboard, or switch. The whole row is the label, so the click target is large, and the description is part of the accessible name.',
    wcag: ['2.1.1', '4.1.2'],
  },
  {
    id: 'visible-moves',
    anchor: '// Only items still in their source list and matching its filter can move: what you see is what moves.',
    endAnchor: 'const removable =',
    topic: 'state',
    title: 'Hidden items never move',
    rationale:
      'A check survives filtering, but only checked items that match the current filter count toward the button and move. The audited double-arrow buttons moved everything, including rows nobody had looked at.',
  },
  {
    id: 'announce',
    anchor: "const announce = (verb: 'Added' | 'Removed', moved: TransferItem[], nextCount: number): void => {",
    endAnchor: 'setMessage(',
    topic: 'announce',
    title: 'Every move is a sentence',
    rationale:
      'A single item is named ("Removed Casey Okafor"); several are counted. The new total follows, so users know the result without rereading either list.',
    wcag: ['4.1.3'],
  },
  {
    id: 'aria-disabled',
    anchor: '// aria-disabled keeps focus on the button after a move empties the selection.',
    endAnchor: 'onClick={() => move(direction)}',
    topic: 'focus',
    title: 'Buttons stay focusable after a move',
    rationale:
      'A move clears the checks, so the button has nothing to do. The native disabled attribute would drop focus to the page; aria-disabled keeps focus in place and is still announced as unavailable. move() ignores clicks with nothing to move.',
    wcag: ['2.4.3'],
  },
  {
    id: 'status',
    anchor: '<p role="status" className={styles.status}>',
    topic: 'announce',
    title: 'One visible status line, also a live region',
    rationale: 'Sighted and screen reader users get the same confirmation from the same element. It is always rendered so the first message is announced.',
    wcag: ['4.1.3'],
  },
  {
    id: 'reflow',
    file: 'styles',
    anchor: '@container (max-width: 35rem) {',
    endAnchor: 'flex-wrap: wrap;',
    topic: 'styling',
    title: 'A forced two-pane layout still reflows',
    rationale: 'Teams that pin layout="dual" still get stacked panes in narrow containers, so nothing scrolls sideways at 320px.',
    wcag: ['1.4.10'],
  },
];
