import type { CodeAnnotation } from '../../../types/walkthrough';

export const nestedNavWalkthrough: CodeAnnotation[] = [
  {
    id: 'typed-tree',
    anchor: 'export type NavGroup = { id: string; label: string; href?: string; children: NavItem[] };',
    endAnchor: 'export type NavItem = NavLink | NavGroup;',
    topic: 'semantics',
    title: 'Groups and links are different types',
    rationale:
      'A group toggles; a link navigates. Keeping them as separate types means a section label can never be both a link and a toggle, which is the ambiguity that pushes teams toward hover menus. Optional href on a group only feeds the breadcrumb.',
  },
  {
    id: 'find-path',
    anchor: 'export function findPath(items: NavItem[], id: string): NavItem[] | null {',
    endAnchor: 'return null;',
    topic: 'state',
    title: 'One path drives breadcrumbs and expansion',
    rationale:
      'The audited breadcrumbs were written by hand and disagreed with the menu on 1 page in 5. Here the path from root to current page is computed once from the tree. Breadcrumbs, the open groups, and aria-current all read from it, so they cannot disagree about where the user is.',
    wcag: ['2.4.8'],
  },
  {
    id: 'reopen-ancestors',
    anchor: "// Navigating elsewhere (e.g. browser back) re-opens the new page's ancestors",
    endAnchor: '}, [path]);',
    topic: 'state',
    title: 'Back button re-opens the right section',
    rationale:
      'When the current page changes, its ancestors are added to the open set without closing anything the user opened. The audited menu reset on every navigation, so users lost their place after each click.',
    wcag: ['2.4.8'],
  },
  {
    id: 'escape',
    anchor: 'const collapseOnEscape = (event: KeyboardEvent<HTMLUListElement>, groupId: string | null): void => {',
    endAnchor: 'menuButton.current?.focus();',
    topic: 'focus',
    title: 'Escape closes the nearest level and returns focus',
    rationale:
      'Escape collapses the group the focus is inside and moves focus to that group\'s toggle, so focus never lands on a removed element. stopPropagation stops one keypress from collapsing every level at once. At the top level, Escape closes the mobile menu.',
    wcag: ['2.1.1', '2.4.3'],
  },
  {
    id: 'disclosure',
    anchor: 'className={styles.groupToggle}',
    endAnchor: '<span aria-hidden="true" className={styles.chevron} />',
    topic: 'semantics',
    title: 'Native button disclosure, not hover flyouts',
    rationale:
      'Each group is a <button> with aria-expanded and aria-controls. That replaces hover-only flyouts, which keyboard and touch users could not open past level 2. The chevron is decorative; the expanded state is announced from the attribute.',
    wcag: ['2.1.1', '4.1.2', '1.4.13'],
  },
  {
    id: 'render-closed',
    anchor: '{open && renderList(item.children, level + 1, item.id)}',
    topic: 'performance',
    title: 'Closed groups are not in the DOM',
    rationale:
      'Collapsed children are not rendered at all, so Tab skips them without tabindex juggling and a 300-link tree stays cheap to render.',
    wcag: ['2.4.3'],
  },
  {
    id: 'aria-current',
    anchor: "aria-current={current ? 'page' : undefined}",
    topic: 'semantics',
    title: 'Current page is announced, not just colored',
    rationale:
      'aria-current="page" makes screen readers say "current page". The CSS styles the same attribute, so the visual and the semantic marker cannot drift apart.',
    wcag: ['1.4.1', '2.4.8'],
  },
  {
    id: 'breadcrumbs',
    anchor: '<nav aria-label={breadcrumbLabel} className={styles.breadcrumb}>',
    endAnchor: '<span aria-current="page">{item.label}</span>',
    topic: 'semantics',
    title: 'Breadcrumbs as a second location cue',
    rationale:
      'An ordered list inside a named nav landmark. Groups without an href render as text, not dead links. breadcrumbLabel is a prop because two landmarks both named "Breadcrumb" on one page are indistinguishable in a landmark list.',
    wcag: ['2.4.8', '1.3.1'],
  },
  {
    id: 'mobile-menu',
    anchor: 'aria-controls={`${baseId}-panel`}',
    endAnchor: "{menuOpen ? 'Close menu' : 'Menu'}",
    topic: 'focus',
    title: 'Small screens get a Menu button',
    rationale:
      'Under 640px the tree hides behind a disclosure button instead of pushing the page content below the fold. The visible label changes with the state, so sighted users and screen reader users get the same information.',
    wcag: ['1.4.10', '4.1.2'],
  },
  {
    id: 'viewport-query',
    file: 'styles',
    anchor: '* Viewport, not container: side navs are often 240-300px wide',
    endAnchor: '@media (max-width: 40rem) {',
    topic: 'styling',
    title: 'Why this one uses @media, not @container',
    rationale:
      'The library prefers container queries, but a side nav is always narrow, even on desktop. Collapsing it is a decision about the whole screen, so the viewport is the right input here.',
    wcag: ['1.4.10'],
  },
];
