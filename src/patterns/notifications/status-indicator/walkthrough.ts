import type { CodeAnnotation } from '../../../types/walkthrough';

export const statusIndicatorWalkthrough: CodeAnnotation[] = [
  {
    id: 'tone-api',
    anchor: "export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';",
    topic: 'state',
    title: 'Tone, not color',
    rationale:
      'The audited screens passed a hex value or a "red" class. Here callers choose a tone, and the tone decides color, shape, and glyph together. There is no prop for color alone, so nobody can ship a hue-only status.',
    wcag: ['1.4.1'],
  },
  {
    id: 'shapes',
    anchor: 'const SHAPES: Record<StatusTone, Shape> = {',
    endAnchor: "neutral: { outline:",
    topic: 'semantics',
    title: 'Six silhouettes, six glyphs',
    rationale:
      'Circle, triangle, octagon, square, dashed ring, hollow ring. Each tone still reads in grayscale and under red-green color blindness, where green and red become the same mustard brown. Outcomes are filled; states that are not finished are outlined.',
    wcag: ['1.4.1'],
  },
  {
    id: 'decorative-icon',
    anchor: '<svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-tone={tone}>',
    topic: 'semantics',
    title: 'The icon is decoration; the text is the name',
    rationale:
      'Because the label is always visible, the icon would only repeat it. Hiding it stops screen readers from saying "graphic" or the status twice. focusable="false" keeps old Edge from adding the SVG to the tab order.',
    wcag: ['1.1.1'],
  },
  {
    id: 'visible-label',
    anchor: '<span className={styles.label}>{label}</span>',
    topic: 'semantics',
    title: 'The status word is always on screen',
    rationale:
      'There is no icon-only mode. A visible word works for color-blind users, for people who do not know the icon set, and for screen readers, with one source of truth.',
    wcag: ['1.4.1', '1.3.1'],
  },
  {
    id: 'detail-pause',
    anchor: '<span className={styles.visuallyHidden}>, </span>',
    topic: 'announce',
    title: 'A pause before the detail',
    rationale:
      'Sighted users see a divider between "Failed" and "Timed out after 30 min". The hidden comma gives screen readers the same break, so it is not read as one run-on phrase.',
  },
  {
    id: 'legend',
    anchor: '<figure className={styles.legend} aria-labelledby={captionId}>',
    endAnchor: '</figure>',
    topic: 'semantics',
    title: 'A key everyone can reach',
    rationale:
      'The audited key was a title tooltip on "(?)", which keyboard and touch users cannot open. A captioned figure with a description list is always visible, read in order, and pairs each status with what to do about it.',
    wcag: ['1.3.1', '2.1.1'],
  },
  {
    id: 'tone-tokens',
    file: 'styles',
    anchor: "[data-tone='success'] {",
    endAnchor: '--tone: var(--sux-muted, #52525b);',
    topic: 'styling',
    title: 'Tone colors only touch icons and borders',
    rationale:
      'Each tone maps to a theme token that reaches 3:1 against the surface in light and dark themes. Text stays on the ink color, so adding or rebranding a tone cannot break text contrast.',
    wcag: ['1.4.11', '1.4.3'],
  },
  {
    id: 'dashed',
    file: 'styles',
    anchor: ".badge[data-tone='pending'],",
    endAnchor: 'border-style: dashed;',
    topic: 'styling',
    title: 'Not-yet states look unfinished',
    rationale:
      'Running and paused share the muted tone, so their border is dashed and their icons are outlines. That separates them from outcomes without adding another hue.',
    wcag: ['1.4.1'],
  },
  {
    id: 'forced-colors',
    file: 'styles',
    anchor: '@media (forced-colors: active) {',
    topic: 'resilience',
    title: 'Windows High Contrast keeps the shapes',
    rationale:
      'Forced colors remove author colors from text and borders but not from SVG fills. Mapping fills and strokes to CanvasText and Canvas keeps every shape visible in the user\'s palette.',
    wcag: ['1.4.11'],
  },
];
