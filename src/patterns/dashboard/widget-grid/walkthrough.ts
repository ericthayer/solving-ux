import type { CodeAnnotation } from '../../../types/walkthrough';

export const widgetGridWalkthrough: CodeAnnotation[] = [
  {
    id: 'widget-state',
    anchor: 'export type WidgetState =',
    endAnchor: "| { status: 'ready'; content: ReactNode };",
    topic: 'state',
    title: 'Every widget owns its own state',
    rationale:
      'A discriminated union forces each widget to be loading, error, empty, or ready. In the audited dashboard one failed request blanked the whole page behind a global spinner. Here a failure stays inside its card, and the error variant cannot exist without a retry handler.',
  },
  {
    id: 'view-all',
    anchor: '/** Escape hatch for overflow: link to the full view instead of cramming rows into the card. */',
    endAnchor: 'viewAll?: { label: string; href: string };',
    topic: 'resilience',
    title: 'Overflow links out instead of scrolling inside',
    rationale:
      'Scrolling cards inside a scrolling page trap mouse wheels and keyboard users. Long content gets a "View all" link to the full view, so cards never need their own scrollbars.',
    wcag: ['2.1.1'],
  },
  {
    id: 'section-landmark',
    anchor: 'className={styles.widget}',
    endAnchor: "aria-busy={state.status === 'loading' || undefined}",
    topic: 'semantics',
    title: 'Each card is a named section',
    rationale:
      'A <section> labelled by its heading shows up in the screen reader landmark and heading lists, so users can jump straight to "Late delivery rate". aria-busy tells assistive tech the content is still arriving.',
    wcag: ['1.3.1', '2.4.6'],
  },
  {
    id: 'skeleton',
    anchor: '<div className={styles.skeleton}>',
    endAnchor: '</div>',
    topic: 'announce',
    title: 'Skeletons with a spoken label',
    rationale:
      'The shimmer bars are aria-hidden; one visually hidden line says "Loading Committed spend". Data that has already arrived in other cards stays visible instead of hiding behind a page spinner.',
    wcag: ['1.1.1'],
  },
  {
    id: 'scoped-error',
    anchor: "{state.status === 'error' && (",
    endAnchor: 'Retry',
    topic: 'resilience',
    title: 'Errors name the widget and offer a retry',
    rationale:
      'The message starts with which widget failed, and the Retry button\'s accessible name repeats it ("Retry loading Late delivery rate") so a list of buttons is not six identical "Retry" entries. role="status" announces the failure without stealing focus.',
    wcag: ['4.1.3', '2.4.6', '2.5.3'],
  },
  {
    id: 'density',
    anchor: '<fieldset className={styles.density}>',
    endAnchor: '</fieldset>',
    topic: 'semantics',
    title: 'Density is a native radio group',
    rationale:
      'Two native radios inside a fieldset give arrow-key navigation and "Density, radio group" announcements without any ARIA. The legend is visually hidden because the visible labels already explain the control.',
    wcag: ['1.3.1', '4.1.2'],
  },
  {
    id: 'stat-text',
    anchor: "<span aria-hidden=\"true\">{change.direction === 'up' ? '▲'",
    endAnchor: "{change.direction === 'flat' ? 'No change'",
    topic: 'semantics',
    title: 'Direction is written out, not just colored',
    rationale:
      'The audited KPIs used red and green arrows only. The arrow is now decorative and the text says "Up 0.08 pts". data-good drives color separately, because "up" is bad for a delinquency rate and good for revenue.',
    wcag: ['1.4.1', '1.1.1'],
  },
  {
    id: 'auto-fill',
    file: 'styles',
    anchor: 'grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));',
    topic: 'styling',
    title: 'Columns come from available width',
    rationale:
      'auto-fill with a 16rem minimum replaces the fixed 4-column grid that broke at tablet widths. min(100%, 16rem) lets a single card shrink below 16rem on a 320px screen instead of overflowing.',
    wcag: ['1.4.10'],
  },
  {
    id: 'reduced-motion',
    file: 'styles',
    anchor: '@media (prefers-reduced-motion: reduce) {',
    endAnchor: 'animation: none;',
    topic: 'styling',
    title: 'Shimmer stops for reduced motion',
    rationale: 'Users who ask the OS for less motion get static skeleton bars. The loading label is unaffected.',
    wcag: ['2.3.3', '2.2.2'],
  },
];
