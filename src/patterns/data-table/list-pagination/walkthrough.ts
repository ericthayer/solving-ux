import type { CodeAnnotation } from '../../../types/walkthrough';

export const listPaginationWalkthrough: CodeAnnotation[] = [
  {
    id: 'decision-rule',
    anchor: 'export type PagedListMode =',
    topic: 'semantics',
    title: 'The mode is a decision, not a style',
    rationale:
      'The comment above this type is the rule the pattern exists to settle. Pages when position matters (queues, records, search results), load more when reading order matters (catalogs, activity), infinite scroll almost never. One component with three modes keeps counts, focus, and restore identical across them, so switching mode later is a one-prop change instead of a rebuild.',
  },
  {
    id: 'restore-state',
    anchor: 'const [saved] = useState(() => readSaved(restoreKey));',
    endAnchor: 'const pendingFocus = useRef<PendingFocus>',
    topic: 'state',
    title: 'Back returns the user to where they were',
    rationale:
      'Saved page, loaded count, and the last opened item are read once, before the first render, so the list mounts at the right place instead of flashing page 1 and jumping. The audited queue reset to page 1 on every Back, which made working through a long queue a memory exercise.',
  },
  {
    id: 'persist',
    anchor: 'const persist = (anchorId: string | null): void => {',
    endAnchor: 'useEffect(() => persist(anchorRef.current), [restoreKey, currentPage, end]);',
    topic: 'resilience',
    title: 'Storage failures never break the list',
    rationale:
      'sessionStorage throws in some private modes and when full. Restoring position is a convenience, so a failed write is swallowed rather than taking the list down with it. sessionStorage, not localStorage, so a new tab or a new day starts at the top.',
  },
  {
    id: 'focus-after-render',
    anchor: '// Focus moves after the DOM has the new items, never before.',
    endAnchor: 'persist(null);',
    topic: 'focus',
    title: 'Focus lands on what changed',
    rationale:
      'Handlers only record where focus should go; this effect moves it after React has rendered the new items. A page change focuses the list, so the screen reader starts at the top of the new page. Load more focuses the first new item, which fixes the audited button that left focus below rows the user then skipped. On return, the opened item gets focus once, and the anchor is cleared so a later visit does not steal focus.',
    wcag: ['2.4.3'],
  },
  {
    id: 'announce',
    anchor: 'const goToPage = (next: number): void => {',
    endAnchor: 'setAnnouncement(`Loaded ${added} more.',
    topic: 'announce',
    title: 'Every load says how many arrived and how many exist',
    rationale:
      'Both handlers write one sentence to the status region with the new range and the total. Automatic loads announce but do not move focus: the user did not ask for anything, so yanking their reading position would be worse than the original problem.',
    wcag: ['4.1.3'],
  },
  {
    id: 'auto-load-cap',
    anchor: 'const autoActive = mode === \'infinite\' && autoLoads < maxAutoLoads && remaining > 0;',
    endAnchor: '}, [autoActive, end]);',
    topic: 'resilience',
    title: 'Infinite scroll stops before it eats the footer',
    rationale:
      'The observer only runs while automatic loads are under the cap. After that, the Load more button takes over, so the footer and anything after the list can be reached. Without IntersectionObserver (old browsers, test runners), the button is the only path, which still works.',
    wcag: ['2.1.1'],
  },
  {
    id: 'posinset',
    anchor: 'aria-setsize={total} aria-posinset={start + i + 1}',
    topic: 'semantics',
    title: 'Items know their place in the whole set',
    rationale:
      'Only one page is rendered, but each item reports its position in all results, so a screen reader says "11 of 57" rather than "1 of 10". tabIndex -1 makes items focus targets without adding them to the Tab order.',
    wcag: ['1.3.1'],
  },
  {
    id: 'aria-current',
    anchor: "aria-current={p === currentPage ? 'page' : undefined}",
    topic: 'semantics',
    title: 'Current page is programmatic, not just colored',
    rationale:
      'Page numbers are native buttons inside a labelled nav, so they are reachable by Tab. aria-current="page" makes NVDA say "current page"; the label "Page 3" replaces a bare "3" while still containing the visible text.',
    wcag: ['1.3.1', '4.1.2'],
  },
  {
    id: 'current-style',
    file: 'styles',
    anchor: ".pageButton[aria-current='page'] {",
    endAnchor: 'text-underline-offset: 3px;',
    topic: 'styling',
    title: 'Styled from the ARIA state',
    rationale:
      'The visual state hangs off aria-current, so the look and the announced state cannot drift apart. Fill, weight, and underline each mark the current page, so it never depends on color alone.',
    wcag: ['1.4.1'],
  },
];
