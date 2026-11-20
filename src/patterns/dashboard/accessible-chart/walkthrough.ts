import type { CodeAnnotation } from '../../../types/walkthrough';

export const accessibleChartWalkthrough: CodeAnnotation[] = [
  {
    id: 'summary-prop',
    anchor: '/** The one-sentence takeaway. Required: a chart without one makes every user decode it alone. */',
    endAnchor: 'summary: string;',
    topic: 'semantics',
    title: 'The takeaway is a required prop',
    rationale:
      'The audited charts shipped without any text. Making summary required puts the conclusion in the API, so whoever owns the data writes it once and every user, sighted or not, reads it before the lines.',
    wcag: ['1.1.1'],
  },
  {
    id: 'series-styles',
    anchor: '/** Color alone never identifies a series: each one also differs in dash and marker. */',
    endAnchor: "{ dash: '12 4 2 4', shape: 'diamond' },",
    topic: 'styling',
    title: 'Three cues per series',
    rationale:
      'The audited legend used red and green swatches only. Each series now differs in color, dash pattern, and marker shape, so it reads in grayscale, in print, and for color-blind users.',
    wcag: ['1.4.1'],
  },
  {
    id: 'roving-focus',
    anchor: 'const onKeyDown = (e: KeyboardEvent<SVGSVGElement>): void => {',
    endAnchor: '  };',
    topic: 'focus',
    title: 'One tab stop, arrow keys inside',
    rationale:
      'Twelve months times three series would be 36 tab stops. A roving tabindex keeps the chart to one stop: Left and Right walk the series, Up and Down jump to the same month in another series, and missing values are skipped instead of trapping focus on an empty spot.',
    wcag: ['2.1.1', '2.4.3'],
  },
  {
    id: 'end-labels',
    anchor: "// Direct end labels, nudged apart so close lines don't print on top of each other.",
    endAnchor: 'if (prev) l.y = Math.max(l.y, prev.y + 14);',
    topic: 'resilience',
    title: 'Direct labels that do not collide',
    rationale:
      'Labelling each line at its end removes the trip to the legend. Close values would print labels on top of each other, so labels are sorted and pushed at least 14px apart. Below 480px the gutter is dropped and the legend carries the names.',
  },
  {
    id: 'figure',
    anchor: '<figure className={styles.root} aria-labelledby={`${id}-title`}>',
    endAnchor: '</figcaption>',
    topic: 'semantics',
    title: 'A named figure that leads with its conclusion',
    rationale:
      'The figure is named by the visible heading, and the summary is the first text inside it. A screen reader user hears what the chart means before any individual value.',
    wcag: ['1.1.1', '1.3.1'],
  },
  {
    id: 'view-switch',
    anchor: '<fieldset className={styles.views}>',
    endAnchor: '</fieldset>',
    topic: 'semantics',
    title: 'Chart and Table are two views of one data set',
    rationale:
      'A native radio group switches views with arrow keys and announces "Table, radio button, checked". Both views read from the same series prop, so the table can never drift from the chart.',
    wcag: ['1.3.1', '4.1.2'],
  },
  {
    id: 'decorative-layer',
    anchor: '<g aria-hidden="true">',
    topic: 'semantics',
    title: 'Axes and lines are decoration; points carry the data',
    rationale:
      'Gridlines, tick text, paths, and end labels are hidden from assistive tech because each point already says its series, category, and value. Exposing both would read every number twice.',
  },
  {
    id: 'point',
    anchor: 'role="img"',
    endAnchor: "tabIndex={active.s === si && active.i === i ? 0 : -1}",
    topic: 'semantics',
    title: 'Each point names itself fully',
    rationale:
      '"Over $100k, Nov 2026: 11.2 days, 12 of 12" gives series, category, formatted value, and position in one announcement. The same formatValue feeds the tooltip and the table, so all three views match.',
    wcag: ['1.1.1', '4.1.2'],
  },
  {
    id: 'hit-area',
    anchor: '<circle className={styles.hit} cx={x(i)} cy={y(v)} r={12} />',
    topic: 'resilience',
    title: '24px hit area behind a small marker',
    rationale:
      'The audited dots were 4px wide and only answered to mouse movement. An invisible 24px circle makes each point an easy pointer target without making the chart heavy.',
  },
  {
    id: 'tooltip',
    anchor: '{tip && tipValue !== null && (',
    endAnchor: 'aria-hidden="true"',
    topic: 'announce',
    title: 'Tooltip on hover and focus, dismissible with Escape',
    rationale:
      'The tooltip appears for focus as well as hover, stays while the pointer is anywhere over the plot so it can be hovered, and Escape hides it without moving focus. It is aria-hidden because the focused point already says the same thing.',
    wcag: ['1.4.13'],
  },
  {
    id: 'table',
    anchor: '<div className={styles.tableWrap} role="region" aria-labelledby={`${id}-caption`} tabIndex={0}>',
    endAnchor: '</caption>',
    topic: 'semantics',
    title: 'A real table in a scrollable region',
    rationale:
      'The table has a caption, column headers, and row headers, so screen readers announce "Nov 2026, Over $100k, 11.2 days" for each cell. The wrapper is a named, focusable region so keyboard users can scroll it on narrow screens.',
    wcag: ['1.3.1', '1.4.10', '2.1.1'],
  },
  {
    id: 'series-tokens',
    file: 'styles',
    anchor: '/* Series colors: each clears 3:1 against the surface (WCAG 1.4.11) in both themes. */',
    endAnchor: '--chart-4: var(--sux-chart-4, #7e22ce);',
    topic: 'styling',
    title: 'Series colors are tokens that pass 3:1',
    rationale:
      'The audited "Over $100k" line was pale blue at about 1.4:1. Each series color is a --sux-chart-* token with a fallback that clears 3:1 on the surface, with a separate set for dark mode.',
    wcag: ['1.4.11'],
  },
];
