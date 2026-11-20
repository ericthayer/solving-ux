import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const statusIndicatorPattern: PatternDefinition = {
  id: 'notifications.status-indicator',
  slug: 'status-indicator',
  title: 'Status indicators beyond color',
  summary: 'Status badges that pair every hue with a distinct shape, a glyph, and visible text, plus an always-visible key, so status reads in grayscale, for color-blind users, and to screen readers.',
  category: 'notifications',
  tags: ['status', 'badge', 'color blindness', 'icons', 'legend', 'non-text contrast'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Job, record, and workflow screens show status as small colored dots, pastel badges, and bare icons, and each screen names states differently. Green and red dots look the same to about 1 in 12 men, the yellow dot almost disappears on white, and screen readers announce nothing at all. The only key is a hover tooltip on a tiny icon, so keyboard, touch, and screen reader users never find it. When a job fails after a rerun, the dot changes color silently.',
  beforeState: {
    summary: '10px colored dots, a pastel badge, and a bare icon in the Status column, explained only by a hover tooltip.',
    failures: [
      {
        id: 'color-only',
        description: 'Status is a colored dot with no text, shape, or pattern. Color is the only signal.',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Status dot for Nightly ledger export' },
      },
      {
        id: 'red-green',
        description: 'Succeeded and Failed are the same circle in green and red, the pair red-green color blindness merges.',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }],
        target: { label: 'Status dot for Invoice sync' },
      },
      {
        id: 'low-contrast-dot',
        description: 'The yellow "warning" dot is about 1.1:1 against the white row, far below the 3:1 needed for meaningful graphics.',
        refs: [{ kind: 'wcag', criterion: '1.4.11' }],
        target: { label: 'Status dot for Vendor file import' },
      },
      {
        id: 'no-text-alternative',
        description: 'The dots are empty spans with no accessible name; screen readers read the Status cell as blank.',
        refs: [{ kind: 'wcag', criterion: '1.1.1' }, { kind: 'wcag', criterion: '1.3.1' }],
        target: { label: 'Status dot for Rate table refresh' },
      },
      {
        id: 'pastel-badge',
        description: 'The "Pending" badge is pale blue text on a pale blue fill, about 1.6:1, far below the 4.5:1 text minimum.',
        refs: [{ kind: 'wcag', criterion: '1.4.3' }],
        target: { label: '"Pending" badge for Statement run' },
      },
      {
        id: 'icon-only',
        description: 'Paused is a grey pause glyph with no text and no accessible name, so screen readers skip it and sighted users must guess.',
        refs: [{ kind: 'wcag', criterion: '1.1.1' }, { kind: 'wcag', criterion: '1.4.11' }],
        target: { label: 'Pause icon for Archive cleanup' },
      },
      {
        id: 'hover-only-legend',
        description: 'The color key lives in a native title tooltip on a tiny "(?)", which keyboard and touch users cannot open.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: '"(?)" key in the Status header' },
      },
      {
        id: 'silent-change',
        description: 'Rerunning a job changes its dot from red to blue to green with no announcement.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }],
        target: { label: 'Scheduled jobs table' },
      },
    ],
  },
  designRationale:
    'Color stays, because it is the fastest cue for people who see it, but it is never the only cue. Each tone has its own silhouette (circle, triangle, octagon, square, dashed ring, hollow ring) and its own glyph, so the six states stay distinct in grayscale, under red-green color blindness, and in Windows High Contrast. The status word is always visible text, which is also the accessible name, so the icon is decorative. Text stays on the ink color; tone colors are used only for the icon and border, at 3:1 or better in both themes, so a new tone can never break text contrast. Finished outcomes use filled shapes; not-yet states (running, paused) use outlined shapes and dashed borders. Compact mode drops the visible word for dense grids but keeps it as the accessible name, and leans on the distinct shape plus a visible key. Each product defines its statuses once with defineStatusVocabulary, so a state has the same word, shape, and meaning on every screen and an unknown state is a type error. The key is a visible figure, not a tooltip. Status changes are announced by name in a polite live region owned by the page.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'tone', type: "'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral'", required: true, description: 'Selects color, shape, and glyph together. There is no way to set color alone.' },
    { name: 'label', type: 'string', required: true, description: 'Visible status word, e.g. "Failed". Always rendered; it is the accessible name.' },
    { name: 'detail', type: 'string', required: false, description: 'Context after the label, e.g. "Timed out after 30 min". Read after a pause.' },
    { name: 'density', type: "'default' | 'compact'", required: false, defaultValue: "'default'", description: 'compact shows the icon only; the label stays in the accessible name. Pair with a visible StatusLegend.' },
    { name: 'defineStatusVocabulary(definitions)', type: 'Record<K, { tone, label, meaning }>', required: true, description: 'Product config. Returns a Badge that takes a status key, plus legend entries.' },
    { name: 'StatusLegend: caption, entries', type: 'string, { tone, label, meaning }[]', required: true, description: 'Always-visible key, rendered as a captioned figure with a description list.' },
  ],
  usage: `// status-config.ts: one vocabulary per product
export const recordStatus = defineStatusVocabulary({
  active: { tone: 'success', label: 'Active', meaning: 'In use.' },
  pending: { tone: 'pending', label: 'Pending', meaning: 'Waiting on approval.' },
  failed: { tone: 'error', label: 'Failed', meaning: 'Needs a fix before it can continue.' },
  overdue: { tone: 'warning', label: 'Overdue', meaning: 'Past its due date.' },
});

<recordStatus.Badge status="overdue" detail="3 days" />
<StatusLegend caption="Status key" entries={recordStatus.entries} />`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Shape, glyph, and visible text each carry the status; color is redundant.' },
    { kind: 'wcag', criterion: '1.4.11', level: 'AA', title: 'Non-text contrast', detail: 'Icon and border tones reach 3:1 against the surface in light and dark themes.' },
    { kind: 'wcag', criterion: '1.4.3', level: 'AA', title: 'Contrast (minimum)', detail: 'Status text uses the ink color, never the tone color.' },
    { kind: 'wcag', criterion: '1.1.1', level: 'A', title: 'Non-text content', detail: 'Icons are decorative (aria-hidden, focusable="false"); the text label carries the meaning.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'The page announces "Invoice sync: Succeeded" in a role="status" region when a status changes.' },
    { kind: 'keyboard', keys: 'Ctrl+Alt+Arrows', action: 'Badges add no tab stops. Screen reader table navigation reads status with its column header.' },
    { kind: 'aria', attribute: 'aria-labelledby', detail: 'The legend figure is named by its visible caption.' },
    { kind: 'screen-reader', title: 'Status cell', detail: 'Reads "Failed, Timed out after 30 min" with a pause before the detail.' },
    { kind: 'screen-reader', title: 'Forced colors', detail: 'In Windows High Contrast, shapes map to system colors and stay distinct.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
