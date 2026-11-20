import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const widgetGridPattern: PatternDefinition = {
  id: 'dashboard.widget-grid',
  slug: 'widget-grid',
  title: 'Dashboard widget grid',
  summary: 'Container-responsive widget grid with explicit loading, error, empty, and ready states per widget, a density switch, and "view all" overflow.',
  category: 'dashboard',
  tags: ['dashboard', 'loading states', 'density', 'responsive grid', 'kpi'],
  sourceApps: ['Both'],
  problemStatement:
    'Portfolio dashboards render 12+ widgets that each fetch independently. While loading, the page shows one full-screen spinner; if any request fails, the whole dashboard shows "Something went wrong." Widgets stuff 50-row tables into fixed-height cards with nested scrollbars. KPI trend arrows are red and green only.',
  beforeState: {
    summary: 'Fixed 4-column dashboard with a global spinner and nested scrolling cards.',
    failures: [
      {
        id: 'global-failure',
        description: 'One failed request blanks the entire dashboard.',
        refs: [{ kind: 'heuristic', id: 'H9' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Dashboard body', revealedBy: 'Check "Covenant service times out", then click Reload' },
      },
      {
        id: 'global-spinner',
        description: 'Global spinner hides data that has already arrived.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'wcag', criterion: '4.1.3' }],
        target: { label: 'Page-level loading message', revealedBy: 'Click Reload' },
      },
      {
        id: 'scroll-trap',
        description: 'Cards with long lists create scroll traps inside a scrolling page.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'heuristic', id: 'H8' }],
        target: { label: 'Largest relationships list' },
      },
      {
        id: 'color-only-trend',
        description: 'Up/down meaning conveyed by red/green arrows only (fails 1.4.1).',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }],
        target: { label: 'Exposure trend arrow' },
      },
      {
        id: 'fixed-columns',
        description: 'Fixed 4-column layout breaks at tablet widths.',
        refs: [{ kind: 'wcag', criterion: '1.4.10' }],
        target: { label: 'Four-column widget grid' },
      },
    ],
  },
  designRationale:
    'Each widget owns its state through a discriminated union (loading, error, empty, ready), so one failure stays local and comes with its own retry. Skeletons keep layout stable while loading, and aria-busy tells assistive tech the region is updating. Cards show a bounded summary and link to the full view instead of scrolling internally. Layout responds to the container width, not the viewport, so the same grid works in a full page or a side panel. A density switch serves analysts who want more on screen without making it the default.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'DashboardGrid.title', type: 'string', required: true, description: 'Visible heading; also names the region.' },
    { name: 'DashboardGrid.defaultDensity', type: "'comfortable' | 'compact'", required: false, defaultValue: "'comfortable'", description: 'Starting density.' },
    { name: 'DashboardGrid.onDensityChange', type: '(density: Density) => void', required: false, description: 'Persist the user choice, e.g. to user preferences.' },
    { name: 'Widget.title', type: 'string', required: true, description: 'Heading that names the widget region.' },
    { name: 'Widget.state', type: 'WidgetState', required: true, description: "{ status: 'loading' } | { status: 'error', message, onRetry } | { status: 'empty', message } | { status: 'ready', content }" },
    { name: 'Widget.span', type: '1 | 2', required: false, defaultValue: '1', description: 'Columns to span when the container is at least 640px wide.' },
    { name: 'Widget.viewAll', type: '{ label: string; href: string }', required: false, description: 'Link to the full data set. Shown only in the ready state.' },
    { name: 'Stat', type: '{ label, value, change? }', required: false, description: 'KPI block. change.direction is written out as "Up 3.1%" for screen readers and color-blind users.' },
  ],
  usage: `<DashboardGrid title="Portfolio health">
  <Widget title="Exposure" state={query.isLoading ? { status: 'loading' } : { status: 'ready', content: <Stat label="Total" value="$4.2B" /> }} />
</DashboardGrid>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'KPI changes are written as "Up 0.08 pts"; arrows are decorative (aria-hidden).' },
    { kind: 'wcag', criterion: '1.4.10', level: 'AA', title: 'Reflow', detail: 'auto-fill grid collapses to one column at 320px without horizontal scroll.' },
    { kind: 'wcag', criterion: '2.3.3', level: 'AAA', title: 'Animation from interactions', detail: 'Skeleton shimmer stops under prefers-reduced-motion.' },
    { kind: 'keyboard', keys: 'Arrow keys', action: 'Switch density inside the radio group.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'Retry a failed widget.' },
    { kind: 'aria', attribute: 'aria-busy="true"', detail: 'On a widget while it loads; removed when content arrives.' },
    { kind: 'aria', attribute: 'role="region" via section + aria-labelledby', detail: 'Every widget is a named landmark, navigable with the screen reader region list.' },
    { kind: 'screen-reader', title: 'Loading', detail: 'Hidden text "Loading Covenant breaches" replaces the visual skeleton.' },
    { kind: 'screen-reader', title: 'Failure', detail: 'role="status" announces "Covenant breaches did not load. The covenant service timed out." without stealing focus.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-17',
  author: 'Design System Team',
};
