import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const stickyFocusPattern: PatternDefinition = {
  id: 'navigation.sticky-focus',
  slug: 'sticky-focus',
  title: 'Sticky header and action bar that never hide focus',
  summary:
    'A pinned header and save bar sized into scroll-padding so Tab never parks a field underneath them, and that let go and scroll with the page when the screen is too short to hold them.',
  category: 'navigation',
  tags: ['sticky', 'focus', 'scroll-padding', 'zoom', 'action bar', 'WCAG 2.2'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Long edit pages keep a title bar and a Save bar pinned while the form scrolls. Tabbing down the form moves focus to fields that sit behind the Save bar, and Shift+Tab back up hides them behind the header, so keyboard users type into fields they cannot see. At 400% zoom the two bars cover most of the window, leaving a strip a line or two tall for the actual form. The Save bar markup was also placed before the form so it would layer on top, which puts Save first in the tab order.',
  beforeState: {
    summary: 'Always-pinned header and Save bar with fixed pixel heights, no scroll padding, and Save first in the DOM.',
    failures: [
      {
        id: 'hidden-under-save-bar',
        description: 'Tabbing down the form scrolls each field only to the bottom edge of the scroll area, which is behind the pinned Save bar. The focused field is fully hidden.',
        refs: [{ kind: 'wcag', criterion: '2.4.11' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Pinned Save bar' },
      },
      {
        id: 'hidden-under-header',
        description: 'Shift+Tab back up the form leaves the focused field behind the pinned header.',
        refs: [{ kind: 'wcag', criterion: '2.4.11' }],
        target: { label: 'Pinned page header' },
      },
      {
        id: 'pinned-at-zoom',
        description: 'At 400% zoom the header and Save bar stay pinned and cover most of the window, so the form scrolls through a strip one or two lines tall.',
        refs: [{ kind: 'wcag', criterion: '1.4.10' }, { kind: 'heuristic', id: 'H8' }],
        target: { label: 'Scrolling form area' },
      },
      {
        id: 'save-first',
        description: 'The Save bar comes before the form in the markup, so Tab reaches Save and Cancel before the first field.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }, { kind: 'wcag', criterion: '1.3.2' }],
        target: { label: 'Save button' },
      },
    ],
  },
  designRationale:
    'The layout measures its header and action bar with ResizeObserver and writes their heights into scroll-padding, which is the area the browser avoids when it scrolls a focused element into view. That fixes the common case with CSS alone. A focus listener then checks the focused element against the bars after the browser has scrolled and corrects any overlap, which covers engines that ignore scroll-padding and focus moved by script. When the two bars together would cover more than 40% of the visible height (short windows, landscape phones, high zoom), both drop their sticky positioning and scroll with the content, so the form keeps the whole screen. The markup order is header, content, actions, which is also the tab order. It works on a scrolling panel or on the whole page.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Accessible name for the region that holds the header, content, and action bar.' },
    { name: 'header', type: 'ReactNode', required: true, description: 'Pinned to the top while it fits. Title, status, page-level controls.' },
    { name: 'actions', type: 'ReactNode', required: true, description: 'Pinned to the bottom while it fits. Save, Cancel, and other commit actions.' },
    { name: 'children', type: 'ReactNode', required: true, description: 'The scrolling content, usually a form.' },
    { name: 'scroller', type: "'self' | 'page'", required: false, defaultValue: "'self'", description: "'self' makes the layout its own scroll area (panels, drawers). 'page' pins to the window and writes scroll-padding on the html element." },
    { name: 'maxCoverage', type: 'number', required: false, defaultValue: '0.4', description: 'Largest share of the visible height the two bars may cover together before they stop pinning.' },
    { name: 'focusGap', type: 'number', required: false, defaultValue: '8', description: 'Space kept between a focused element and a pinned bar, in CSS px.' },
    { name: 'onPinnedChange', type: '(pinned: boolean) => void', required: false, description: 'Called when the bars switch between pinned and in-flow.' },
  ],
  usage: `<StickyFocusLayout
  label="Edit project"
  scroller="page"
  header={<h1>Edit project</h1>}
  actions={<><button type="button">Cancel</button><button form="edit">Save changes</button></>}
>
  <form id="edit">…</form>
</StickyFocusLayout>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.4.11', level: 'AA', title: 'Focus Not Obscured (Minimum)', detail: 'scroll-padding plus a focus check keep the focused element clear of both bars, which also meets 2.4.12 (AAA, not obscured at all).' },
    { kind: 'wcag', criterion: '1.4.10', level: 'AA', title: 'Reflow', detail: 'When the bars would cover more than 40% of the visible height they stop pinning, so content keeps the screen at 400% zoom.' },
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus Order', detail: 'Markup order is header, content, actions; nothing is reordered with CSS.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Moves through the header, the content, then the actions. Each focused field stops at least 8px clear of the bars.' },
    { kind: 'aria', attribute: 'aria-label on <section>', detail: 'Names the region so it shows in the landmark list. The inner header and footer are not page banners.' },
    { kind: 'screen-reader', title: 'No change in output', detail: 'Pinning is visual only. Screen readers read the same order whether the bars are pinned or not.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
