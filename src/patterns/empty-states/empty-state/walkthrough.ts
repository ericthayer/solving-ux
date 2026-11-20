import type { CodeAnnotation } from '../../../types/walkthrough';

export const emptyStateWalkthrough: CodeAnnotation[] = [
  {
    id: 'variants',
    anchor: "| { variant: 'first-use'; title: string; description: string; primaryAction: Action; learnMore?: LinkAction }",
    endAnchor: "| { variant: 'no-access'; resource: string; ownerName?: string; requestAccessHref: string }",
    topic: 'state',
    title: 'Four empty states, four different jobs',
    rationale:
      'The audited screens showed grey "No data" for first use, zero results, errors, and permission denials alike. Each variant requires the props its job needs: no-results needs a filter count and a way to clear filters, error needs a retry, no-access needs a request link. A bare "No data" cannot be expressed.',
  },
  {
    id: 'heading-level',
    anchor: "const Heading = `h${props.headingLevel ?? 2}` as 'h1' | 'h2' | 'h3' | 'h4';",
    topic: 'semantics',
    title: 'Heading level follows the page outline',
    rationale:
      'The same component can fill a whole page (h1) or a panel inside a card (h3). Making the level a prop keeps the heading outline valid wherever it lands, which is how screen reader users skim a page.',
    wcag: ['1.3.1', '2.4.6'],
  },
  {
    id: 'no-results-status',
    anchor: "role = 'status';",
    endAnchor: "title = props.query ? `No results for “${props.query}”` : 'No matching results';",
    topic: 'announce',
    title: 'Zero results is announced politely',
    rationale:
      'Filtering to zero changes the page without moving focus. role="status" makes screen readers read the new state at the next pause. The title repeats the query so users can spot a typo.',
    wcag: ['4.1.3'],
  },
  {
    id: 'filter-blame',
    anchor: "? `${props.activeFilterCount} ${props.activeFilterCount === 1 ? 'filter is'",
    endAnchor: "Clear {props.activeFilterCount === 1",
    topic: 'resilience',
    title: 'Say when filters caused the empty result',
    rationale:
      'Most "no results" in the audit were caused by forgotten filters. When filters are active, the copy says how many, and a Clear button sits right under it. Without filters, the advice changes to spelling and broader terms.',
    wcag: ['3.3.3'],
  },
  {
    id: 'error-alert',
    anchor: "role = 'alert';",
    endAnchor: "title = props.title ?? 'This data could not be loaded';",
    topic: 'announce',
    title: 'Errors interrupt; empties do not',
    rationale:
      'A load failure is urgent, so it uses role="alert" and is read immediately. The default title says what failed instead of a code.',
    wcag: ['4.1.3'],
  },
  {
    id: 'error-reference',
    anchor: '{reference && (',
    endAnchor: '<span className={styles.visuallyHidden}> error reference</span>',
    topic: 'resilience',
    title: 'A copyable reference for support',
    rationale:
      'Support tickets in the audit had no way to find the failing request. The reference id is shown in code style with a Copy button. The hidden text makes the button "Copy error reference" for screen readers, while sighted users see "Copy" next to the id.',
    wcag: ['2.4.6', '2.5.3'],
  },
  {
    id: 'no-access',
    anchor: "title = `You do not have access to ${props.resource}`;",
    endAnchor: 'Request access',
    topic: 'resilience',
    title: 'Permission denials name a next step',
    rationale:
      'Instead of an empty table, users learn which area they cannot see, who manages it, and get a Request access link. That replaces a support ticket with a self-serve path.',
  },
  {
    id: 'icon',
    anchor: '<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
    topic: 'semantics',
    title: 'Icons are decoration only',
    rationale:
      'The heading carries the meaning, so the icon is hidden from assistive tech. focusable="false" stops older Internet Explorer and Edge builds from adding the SVG to the tab order.',
    wcag: ['1.1.1'],
  },
  {
    id: 'live-content',
    anchor: '<div className={styles.content} role={role}>',
    endAnchor: '{body}',
    topic: 'announce',
    title: 'The live region wraps heading and body',
    rationale:
      'The role sits on the content block, not the section, so the announcement is the heading plus the guidance, without the icon. First-use and no-access states get no role because they are present on page load, not a change.',
    wcag: ['4.1.3'],
  },
];
