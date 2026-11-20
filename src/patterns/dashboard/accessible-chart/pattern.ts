import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const accessibleChartPattern: PatternDefinition = {
  id: 'dashboard.accessible-chart',
  slug: 'accessible-chart',
  title: 'Accessible chart with data table',
  summary: 'SVG line chart with a written takeaway, a Chart/Table switch over the same data, direct labels, dash and marker patterns as well as color, and keyboard-focusable points.',
  category: 'dashboard',
  tags: ['dashboard', 'chart', 'data visualization', 'data table', 'keyboard', 'non-text contrast'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Dashboards and reports show trends as canvas or SVG charts with no text alternative. Series are told apart by red and green alone, lines and gridlines are pale, values appear only in a hover tooltip, and the only export is a PNG. Keyboard and screen reader users get nothing, and nobody can check the numbers.',
  beforeState: {
    summary: 'Unlabeled SVG line chart with color-only series, hover-only tooltips, and a PNG export as the only way to get the data.',
    failures: [
      {
        id: 'no-text-alternative',
        description: 'The chart has no name, no summary, and no role, so screen readers skip it or say "graphic".',
        refs: [{ kind: 'wcag', criterion: '1.1.1' }, { kind: 'wcag', criterion: '1.3.1' }],
        target: { label: 'Chart graphic' },
      },
      {
        id: 'color-only-series',
        description: 'Series differ only by color, and two of them are red and green.',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }],
        target: { label: 'Color-swatch legend' },
      },
      {
        id: 'low-contrast-lines',
        description: 'The "Over $100k" line is pale blue at about 1.4:1 against white, the series that matters most.',
        refs: [{ kind: 'wcag', criterion: '1.4.11' }],
        target: { label: 'Over $100k line' },
      },
      {
        id: 'hover-only-tooltip',
        description: 'Values appear only while a mouse hovers a 4px dot. Points are not focusable and the tooltip cannot be reached by keyboard.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'wcag', criterion: '1.4.13' }],
        target: { label: 'Data points' },
      },
      {
        id: 'no-data-access',
        description: 'The only export is a PNG. There is no table, so nobody can read exact values or check the trend.',
        refs: [{ kind: 'wcag', criterion: '1.3.1' }, { kind: 'heuristic', id: 'H7' }],
        target: { label: 'Download PNG button' },
      },
    ],
  },
  designRationale:
    'The chart leads with its conclusion: a visible one-sentence summary written by whoever owns the data, so no user has to decode the lines to learn the point. A Chart/Table switch renders the same series as a real table with row and column headers, which also serves sighted users who need exact values. Every series carries three cues, color, dash pattern, and marker shape, and is labelled at the end of its line, so the legend is a backup instead of a lookup. Points sit on a single tab stop with arrow-key movement and the same tooltip a mouse user sees. Series colors are tokens that clear 3:1 in light and dark themes.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'title', type: 'string', required: true, description: 'Visible heading; also names the figure and the chart group.' },
    { name: 'summary', type: 'string', required: true, description: 'The takeaway in one sentence. Shown above the chart and read before any data.' },
    { name: 'categories', type: 'string[]', required: true, description: 'X-axis categories, e.g. months. Each series has one value per category.' },
    { name: 'categoryLabel', type: 'string', required: true, description: 'Header of the first table column, e.g. "Month".' },
    { name: 'series', type: 'ChartSeries[]', required: true, description: '{ id, label, values: (number | null)[] }. Up to four. null draws a gap and reads "No data".' },
    { name: 'valueLabel', type: 'string', required: true, description: 'What the values measure. Completes the table caption.' },
    { name: 'formatValue', type: '(value: number) => string', required: false, defaultValue: 'toLocaleString', description: 'Used in point names, tooltips, and table cells so all three match.' },
    { name: 'defaultView', type: "'chart' | 'table'", required: false, defaultValue: "'chart'", description: 'Starting view. Persist the user choice if they switch often.' },
    { name: 'headingLevel', type: '2 | 3 | 4', required: false, defaultValue: '3', description: 'Heading level for the title, to fit the page outline.' },
  ],
  usage: `<AccessibleChart
  title="Purchase order approval time"
  summary="Approvals over $100k slowed from about 6 days to 11.2 days since June."
  categories={months}
  categoryLabel="Month"
  valueLabel="Average days to approve"
  series={[{ id: 'large', label: 'Over $100k', values: [6.1, 5.8, 6.0] }]}
  formatValue={(v) => \`\${v.toFixed(1)} days\`}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '1.1.1', level: 'A', title: 'Non-text content', detail: 'A visible summary states the takeaway, and the Table view carries every value as text.' },
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Each series has its own dash pattern and marker shape and is labelled at the end of its line.' },
    { kind: 'wcag', criterion: '1.4.11', level: 'AA', title: 'Non-text contrast', detail: 'Series colors clear 3:1 against the surface in light and dark themes; markers get a surface-colored outline where lines cross.' },
    { kind: 'wcag', criterion: '1.4.13', level: 'AA', title: 'Content on hover or focus', detail: 'The tooltip stays while the pointer is over the plot, appears on focus too, and Escape hides it without moving focus.' },
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'One tab stop into the chart; arrow keys reach every point.' },
    { kind: 'keyboard', keys: 'Left / Right Arrow', action: 'Previous or next point in the series. Skips missing values.' },
    { kind: 'keyboard', keys: 'Up / Down Arrow', action: 'Same category in the previous or next series.' },
    { kind: 'keyboard', keys: 'Home / End', action: 'First or last point in the series.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Hide the tooltip. Focus stays on the point.' },
    { kind: 'aria', attribute: 'role="group" + aria-describedby', detail: 'The SVG is a named group whose description is the visible keyboard hint; each series is a named group.' },
    { kind: 'aria', attribute: 'role="img" + aria-label on each point', detail: 'Reads "Over $100k, Nov 2026: 11.2 days, 12 of 12". The tooltip is aria-hidden because the name already says it.' },
    { kind: 'screen-reader', title: 'Reaching the chart', detail: 'The figure is named by its heading, and the summary is the first text inside it, so the takeaway comes before any data.' },
    { kind: 'screen-reader', title: 'Table view', detail: 'A real table with a caption, column headers, and row headers, inside a focusable scroll region for narrow screens.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
