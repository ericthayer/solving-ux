import type { CodeAnnotation } from '../../../types/walkthrough';

export const stickyFocusWalkthrough: CodeAnnotation[] = [
  {
    id: 'should-pin',
    anchor: 'export function shouldPin({ top, bottom, viewport }: StickyMetrics, maxCoverage: number): boolean {',
    endAnchor: 'return viewport > 0 && (top + bottom) / viewport <= maxCoverage;',
    topic: 'resilience',
    title: 'Pin only while the bars fit',
    rationale:
      'At 400% zoom a 900px window is 225 CSS px tall. Two always-pinned bars took most of that in the audited page. Here the bars stay pinned only while together they cover 40% or less of the visible height; past that they scroll with the content.',
    wcag: ['1.4.10'],
  },
  {
    id: 'obscured-offset',
    anchor: 'export function obscuredOffset(target: Edges, visible: Edges, gap: number): number {',
    endAnchor: 'return 0;',
    topic: 'focus',
    title: 'How far to scroll, as a pure function',
    rationale:
      'The overlap math is separate from the DOM so it can be unit tested without layout. A target taller than the gap between the bars is aligned to the top, so its start is never pushed under the header.',
    wcag: ['2.4.11'],
  },
  {
    id: 'measure',
    anchor: '// Measure the bars and the visible height. Resizes, zoom, and long text all change the answer.',
    endAnchor: '}, [scroller]);',
    topic: 'resilience',
    title: 'Heights are measured, never hard-coded',
    rationale:
      'The audited page hard-coded 48px and 56px offsets. Translated labels, zoom, and a wrapped header all broke them. ResizeObserver re-measures whenever any of the three boxes changes size, and the state only updates when a number actually changes.',
    wcag: ['2.4.11', '1.4.10'],
  },
  {
    id: 'page-padding',
    anchor: "// Page mode: the document scrolls, so the scroll padding belongs on the root element.",
    endAnchor: '}, [scroller, padTop, padBottom, focusGap]);',
    topic: 'styling',
    title: 'Page mode writes scroll-padding on <html>',
    rationale:
      'When the window scrolls, scroll-padding has to sit on the scrolling element, which is the root. The previous values are restored on unmount so the layout does not leak padding into the next route.',
    wcag: ['2.4.11'],
  },
  {
    id: 'focus-guard',
    anchor: '// Safety net for engines that ignore scroll-padding when moving focus (and for programmatic focus).',
    endAnchor: 'else root.scrollTop += delta;',
    topic: 'focus',
    title: 'A focus check after the browser scrolls',
    rationale:
      'scroll-padding handles Tab in current engines, but not every engine applies it to focus scrolling, and element.focus() from script can skip it. One focus listener on the region waits a frame, measures the bars as they are now, and scrolls only by the overlap. Focus inside the bars is ignored.',
    wcag: ['2.4.11'],
  },
  {
    id: 'dom-order',
    anchor: '<header ref={headerRef} className={styles.header}>',
    endAnchor: '<footer ref={actionsRef} className={styles.actions}>',
    topic: 'semantics',
    title: 'Markup order is tab order',
    rationale:
      'Header, content, actions, in that order, with no CSS order or z-index tricks. The audited Save bar came first in the markup so it would stack on top, which made Save the first Tab stop on the page.',
    wcag: ['2.4.3', '1.3.2'],
  },
  {
    id: 'scroll-padding',
    file: 'styles',
    anchor: ".root[data-scroller='self'] {",
    endAnchor: 'scroll-padding-block-end: calc(var(--sux-sticky-bottom, 0px) + var(--sux-sticky-gap, 8px));',
    topic: 'styling',
    title: 'scroll-padding does most of the work',
    rationale:
      'scroll-padding shrinks the area the browser scrolls a focused element into, so the CSS alone keeps fields clear of the bars. The values come from measured custom properties and drop to 0 when the bars are unpinned.',
    wcag: ['2.4.11'],
  },
  {
    id: 'pinned-only',
    file: 'styles',
    anchor: ".root[data-pinned='true'] .header {",
    endAnchor: 'box-shadow: 0 -4px 8px -6px rgb(0 0 0 / 0.25);',
    topic: 'styling',
    title: 'Sticky is a state, not a default',
    rationale:
      'position: sticky applies only under data-pinned="true". When the window is too short the bars become ordinary blocks at the start and end of the content, which is what a user at 400% zoom needs.',
    wcag: ['1.4.10'],
  },
];
