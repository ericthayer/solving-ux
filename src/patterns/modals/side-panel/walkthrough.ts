import type { CodeAnnotation } from '../../../types/walkthrough';

export const sidePanelWalkthrough: CodeAnnotation[] = [
  {
    id: 'master-prop',
    anchor: '/** The list or table the user scans. It stays mounted while the panel is open, so scroll and selection survive. */',
    endAnchor: 'master: ReactNode;',
    topic: 'state',
    title: 'The list is part of the component',
    rationale:
      'The audited panel lived outside the list, and closing it rebuilt the list, so scroll and selection reset. Taking the list as a prop lets the component keep it mounted in both layouts and own where focus returns.',
    wcag: ['2.4.3'],
  },
  {
    id: 'container-mode',
    anchor: 'function useContainerMode(ref: RefObject<HTMLElement>, layout: SidePanelLayout, sheetBelow: number): Mode {',
    endAnchor: 'return layout === \'auto\' ? measured : layout;',
    topic: 'resilience',
    title: 'Layout follows the container, not the viewport',
    rationale:
      'The switch changes semantics (region versus modal dialog), so CSS alone cannot do it. A ResizeObserver on the layout container picks the mode, which keeps the component correct inside a narrow pane on a wide screen. Width 0 means not laid out yet, so it stays inline instead of opening a modal.',
    wcag: ['1.4.10'],
  },
  {
    id: 'skip-initial-focus',
    anchor: '// A record opened from the URL on page load must not pull focus away from where the user is.',
    endAnchor: 'const skipFocusRef = useRef(recordKey !== null);',
    topic: 'focus',
    title: 'Deep links do not steal focus',
    rationale:
      'The record is URL-addressable, so a reload or shared link can open the panel before the user does anything. Focus only moves when the user opens a record, never on page load.',
    wcag: ['2.4.3', '3.2.1'],
  },
  {
    id: 'focus-on-open',
    anchor: 'if (active instanceof HTMLElement && masterRef.current?.contains(active)) {',
    endAnchor: 'headingRef.current?.focus();',
    topic: 'focus',
    title: 'Remember the row, then focus the heading',
    rationale:
      'Before moving, the effect stores the row that opened the panel. Focusing the heading reads the region and record name, so screen reader users know what opened. Opening a second record from the list updates the stored row, so Close always goes back to the latest one.',
    wcag: ['2.4.3', '4.1.2'],
  },
  {
    id: 'return-focus',
    anchor: '// On close, go back to the row that opened the panel. If that row is gone, land on the list.',
    endAnchor: 'else masterRef.current?.focus();',
    topic: 'focus',
    title: 'Focus returns to the row, or to the list',
    rationale:
      'Every close path ends here, so Escape, Close, and Back to list behave the same. If the row was removed (record deleted or filtered out), focus lands on the list container instead of falling to the top of the page.',
    wcag: ['2.4.3'],
  },
  {
    id: 'escape',
    anchor: 'const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {',
    endAnchor: 'onClose();',
    topic: 'state',
    title: 'Escape closes in both layouts',
    rationale:
      'One keydown handler on the panel covers inline and sheet modes. Preventing the default also stops the native dialog cancel, so onClose runs once. Nested widgets that use Escape themselves can call preventDefault first and keep the panel open.',
    wcag: ['2.1.1'],
  },
  {
    id: 'region',
    anchor: '<section className={styles.panel} aria-labelledby={titleId} data-mode={mode} onKeyDown={handleKeyDown}>',
    topic: 'semantics',
    title: 'A named region, not a div overlay',
    rationale:
      'A section with aria-labelledby is a region landmark named by the record title, so it shows up in the landmarks list and is announced on entry. The panel stays non-modal: the list is still usable beside it.',
    wcag: ['4.1.2', '1.3.1'],
  },
  {
    id: 'close-button',
    anchor: '<button type="button" className={styles.close} onClick={onClose}>',
    endAnchor: '{mode === \'sheet\' ? backLabel : closeLabel}',
    topic: 'semantics',
    title: 'A real button with a visible name',
    rationale:
      'The audited "×" was a span with no name. This is a button with text, so it is in the tab order and its name matches what is shown. In sheet mode it says "Back to list", because the list is out of sight.',
    wcag: ['4.1.2', '2.5.3'],
  },
  {
    id: 'sheet',
    anchor: "<dialog ref={dialogRef} className={styles.sheet} aria-labelledby={titleId} onCancel={handleCancel}>",
    topic: 'resilience',
    title: 'Narrow containers get a modal sheet',
    rationale:
      'When two columns no longer fit, a panel half over the list hides focus and reflows badly. The same content goes into a native modal dialog that fills the screen, which makes the page behind inert and handles the back gesture.',
    wcag: ['1.4.10', '2.4.11'],
  },
  {
    id: 'columns',
    file: 'styles',
    anchor: '.root[data-open] {',
    endAnchor: 'grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);',
    topic: 'styling',
    title: 'Its own column, so nothing is covered',
    rationale:
      'The inline panel takes a grid column instead of floating over the list. Focused rows can never sit under it, which is what WCAG 2.2 Focus not obscured asks for.',
    wcag: ['2.4.11'],
  },
  {
    id: 'selected-row',
    file: 'styles',
    anchor: ".recordButton[aria-current='true'] {",
    endAnchor: 'background: var(--sux-accent-soft, #e6f2ed);',
    topic: 'styling',
    title: 'Selection styled from aria-current',
    rationale:
      'Styling the attribute keeps the visual and the accessible state in step. The inline-start bar marks the row by shape as well as color, and flips correctly in right-to-left layouts.',
    wcag: ['1.4.1', '4.1.2'],
  },
];
