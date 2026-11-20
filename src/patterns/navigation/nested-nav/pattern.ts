import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const nestedNavPattern: PatternDefinition = {
  id: 'navigation.nested-nav',
  slug: 'nested-nav',
  title: 'Nested navigation with breadcrumbs',
  summary: 'Disclosure-based side navigation that keeps the current location open, derives breadcrumbs from the tree, and collapses into a menu on small screens.',
  category: 'navigation',
  tags: ['navigation', 'breadcrumbs', 'disclosure', 'responsive', 'deep hierarchy'],
  sourceApps: ['ISW', 'CoBank'],
  problemStatement:
    'Workspaces with four or more levels of hierarchy use hover-only flyout menus. Flyouts close when the pointer drifts, cannot be opened by keyboard, and reset on every page load, so users rebuild their path from the top each time. Breadcrumbs are maintained by hand per page and drift out of sync with the menu.',
  beforeState: {
    summary: 'Hover flyout menu, four levels deep, with hand-written breadcrumbs.',
    failures: [
      {
        id: 'hover-only',
        description: 'Submenus open on hover only; keyboard and touch users cannot reach level 3+.',
        refs: [{ kind: 'wcag', criterion: '2.1.1' }, { kind: 'wcag', criterion: '1.4.13' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'Customers menu item' },
      },
      {
        id: 'state-reset',
        description: 'Menu state resets on navigation, hiding where the user is.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'wcag', criterion: '2.4.8' }],
        target: { label: 'Top-level menu bar' },
      },
      {
        id: 'breadcrumb-mismatch',
        description: 'Breadcrumbs disagree with the menu on 1 in 5 pages because they are authored separately.',
        refs: [{ kind: 'heuristic', id: 'H4' }, { kind: 'wcag', criterion: '3.2.3' }],
        target: { label: 'Breadcrumb trail' },
      },
      {
        id: 'offscreen-flyout',
        description: 'At tablet widths the flyouts render off screen.',
        refs: [{ kind: 'wcag', criterion: '1.4.10' }],
        target: { label: 'Level 3 flyout', revealedBy: 'Hover Customers, then Relationships' },
      },
    ],
  },
  designRationale:
    'Disclosure buttons (aria-expanded) replace hover so every level is reachable by click, tap, and keyboard. The tree auto-opens ancestors of the current page, so location is visible on arrival. Breadcrumbs are computed from the same data, which removes a whole class of drift bugs. The disclosure pattern is used instead of an ARIA tree because site navigation is a list of links; tree semantics add arrow-key expectations most users do not know. Escape collapses the enclosing group and returns focus to its toggle.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Accessible name for the nav landmark, e.g. "Workspace".' },
    { name: 'items', type: 'NavItem[]', required: true, description: 'Tree of links ({ id, label, href }) and groups ({ id, label, href?, children }). A group with href is linkable in breadcrumbs.' },
    { name: 'currentId', type: 'string', required: true, description: 'id of the current page. Its ancestors open automatically and the link gets aria-current="page".' },
    { name: 'onNavigate', type: '(item: NavLink) => void', required: false, description: 'Client-side routing hook. When set, link clicks call it instead of a full page load.' },
    { name: 'showBreadcrumbs', type: 'boolean', required: false, defaultValue: 'true', description: 'Render the breadcrumb trail above the menu.' },
    { name: 'breadcrumbLabel', type: 'string', required: false, defaultValue: "'Breadcrumb'", description: 'Accessible name for the breadcrumb landmark. Change it if the page already has one named "Breadcrumb".' },
  ],
  usage: `<NestedNav
  label="Workspace"
  items={navTree}
  currentId={route.id}
  onNavigate={(item) => navigate(item.href)}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'Every level opens with Enter or Space on a native button; no hover dependency.' },
    { kind: 'wcag', criterion: '2.4.8', level: 'AAA', title: 'Location', detail: 'Breadcrumbs plus aria-current="page" show the current location in two ways.' },
    { kind: 'wcag', criterion: '1.4.10', level: 'AA', title: 'Reflow', detail: 'On viewports under 640px the tree collapses behind a Menu button instead of pushing content below the fold.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Move through visible links and group toggles.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'Expand or collapse a group.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Collapse the group containing focus and return focus to its toggle. At top level in narrow mode, closes the menu.' },
    { kind: 'aria', attribute: 'aria-expanded + aria-controls', detail: 'On every group toggle and on the narrow-mode Menu button.' },
    { kind: 'aria', attribute: 'aria-current="page"', detail: 'On the active link and the final breadcrumb.' },
    { kind: 'screen-reader', title: 'Landmarks', detail: 'Two nav landmarks: "Breadcrumb" and the label you pass, so users can jump directly to either.' },
    { kind: 'screen-reader', title: 'Nesting', detail: 'Nested lists convey depth: "list, 3 items, level 2".' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-17',
  author: 'Design System Team',
};
