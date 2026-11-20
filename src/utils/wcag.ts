import type { WcagLevel } from '../types/pattern';

type Criterion = { title: string; level: WcagLevel; slug: string };

/** The success criteria the walkthroughs cite. Slugs match the W3C "Understanding" pages. */
export const WCAG_CRITERIA: Record<string, Criterion> = {
  '1.1.1': { title: 'Non-text content', level: 'A', slug: 'non-text-content' },
  '1.3.1': { title: 'Info and relationships', level: 'A', slug: 'info-and-relationships' },
  '1.3.2': { title: 'Meaningful sequence', level: 'A', slug: 'meaningful-sequence' },
  '1.4.1': { title: 'Use of color', level: 'A', slug: 'use-of-color' },
  '1.4.10': { title: 'Reflow', level: 'AA', slug: 'reflow' },
  '1.4.11': { title: 'Non-text contrast', level: 'AA', slug: 'non-text-contrast' },
  '1.4.13': { title: 'Content on hover or focus', level: 'AA', slug: 'content-on-hover-or-focus' },
  '2.1.1': { title: 'Keyboard', level: 'A', slug: 'keyboard' },
  '2.1.2': { title: 'No keyboard trap', level: 'A', slug: 'no-keyboard-trap' },
  '2.2.1': { title: 'Timing adjustable', level: 'A', slug: 'timing-adjustable' },
  '2.2.2': { title: 'Pause, stop, hide', level: 'A', slug: 'pause-stop-hide' },
  '2.3.3': { title: 'Animation from interactions', level: 'AAA', slug: 'animation-from-interactions' },
  '2.4.3': { title: 'Focus order', level: 'A', slug: 'focus-order' },
  '2.4.6': { title: 'Headings and labels', level: 'AA', slug: 'headings-and-labels' },
  '2.4.7': { title: 'Focus visible', level: 'AA', slug: 'focus-visible' },
  '2.4.8': { title: 'Location', level: 'AAA', slug: 'location' },
  '2.5.3': { title: 'Label in name', level: 'A', slug: 'label-in-name' },
  '2.5.7': { title: 'Dragging movements', level: 'AA', slug: 'dragging-movements' },
  '2.5.8': { title: 'Target size (minimum)', level: 'AA', slug: 'target-size-minimum' },
  '3.2.2': { title: 'On input', level: 'A', slug: 'on-input' },
  '3.3.1': { title: 'Error identification', level: 'A', slug: 'error-identification' },
  '3.3.2': { title: 'Labels or instructions', level: 'A', slug: 'labels-or-instructions' },
  '3.3.3': { title: 'Error suggestion', level: 'AA', slug: 'error-suggestion' },
  '3.3.4': { title: 'Error prevention (legal, financial, data)', level: 'AA', slug: 'error-prevention-legal-financial-data' },
  '4.1.2': { title: 'Name, role, value', level: 'A', slug: 'name-role-value' },
  '4.1.3': { title: 'Status messages', level: 'AA', slug: 'status-messages' },
};

export const wcagUrl = (criterion: string): string | null => {
  const entry = WCAG_CRITERIA[criterion];
  return entry ? `https://www.w3.org/WAI/WCAG22/Understanding/${entry.slug}.html` : null;
};
