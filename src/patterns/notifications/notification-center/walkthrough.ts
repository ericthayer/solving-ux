import type { CodeAnnotation } from '../../../types/walkthrough';

export const notificationCenterWalkthrough: CodeAnnotation[] = [
  {
    id: 'group-by-day',
    anchor: 'export function groupByDay(',
    endAnchor: 'return [...groups.values()];',
    topic: 'state',
    title: 'Grouping is a pure function',
    rationale:
      'The audited dropdown was one flat list. Grouping by local calendar day, newest first, gives screen reader users Today and Yesterday headings to jump between, and keeping it pure means the date edge cases are tested without rendering.',
    wcag: ['1.3.1'],
  },
  {
    id: 'announce-fresh',
    anchor: '// Announce only items that were not there before, never the whole list on re-render.',
    endAnchor: '}, [items]);',
    topic: 'announce',
    title: 'Announce arrivals, not re-renders',
    rationale:
      'A set of seen ids is seeded from the first render, so the initial list is never announced. Only ids that were not there before produce a message, and a burst of several is summarized as a count instead of read one by one.',
    wcag: ['4.1.3'],
  },
  {
    id: 'escape',
    anchor: "if (event.key === 'Escape' && open) {",
    endAnchor: 'close();',
    topic: 'focus',
    title: 'Escape closes and returns focus',
    rationale:
      'The audited dropdown stayed open until the next click and had no keyboard way out. Escape anywhere inside the widget closes the panel and sends focus back to the bell, so the user lands where they started.',
    wcag: ['2.4.3', '2.1.1'],
  },
  {
    id: 'disclosure',
    anchor: 'aria-expanded={open}',
    endAnchor: 'aria-controls={panelId}',
    topic: 'semantics',
    title: 'A native button that reports its state',
    rationale:
      'The audited bell was a div with a click handler: not focusable, no role, no name. A real button gets keyboard activation for free, and aria-expanded tells screen reader users whether the panel is open.',
    wcag: ['4.1.2', '2.1.1'],
  },
  {
    id: 'count-in-name',
    anchor: '{/* The name carries the exact count; the badge is capped visually only. */}',
    endAnchor: '{unread > MAX_BADGE',
    topic: 'semantics',
    title: 'The unread count is part of the name',
    rationale:
      'A red dot only says something is new, and only to people who can see red. The button name reads "Notifications, 3 unread", so the count is heard on focus. The visual badge caps at 99+ to fit, but the name keeps the exact number.',
    wcag: ['4.1.2', '1.4.1'],
  },
  {
    id: 'status-region',
    anchor: '<p role="status" className={styles.visuallyHidden}>',
    endAnchor: '{announcement}',
    topic: 'announce',
    title: 'One persistent status region',
    rationale:
      'The region is mounted with the widget and only its text changes, which screen readers announce reliably. It sits outside the panel, so new arrivals are announced even when the panel is closed.',
    wcag: ['4.1.3'],
  },
  {
    id: 'panel-order',
    anchor: '<section id={panelId} className={styles.panel} aria-labelledby={headingId} hidden={!open}>',
    topic: 'focus',
    title: 'The panel follows the button in the DOM',
    rationale:
      'The audited panel rendered at the end of the page, so Tab after opening it went somewhere else entirely. Placing the panel right after its button means the next Tab lands inside it, with no focus juggling and no trap.',
    wcag: ['2.4.3'],
  },
  {
    id: 'mark-all',
    anchor: 'aria-disabled={unread === 0} onClick={markAll}',
    topic: 'focus',
    title: 'Mark all stays focusable when there is nothing to mark',
    rationale:
      'A disabled button drops focus to the page body the moment it is used. aria-disabled keeps focus on the control after marking everything read, and the status region confirms how many were marked.',
    wcag: ['4.1.2', '4.1.3'],
  },
  {
    id: 'day-sections',
    anchor: '<section key={group.key} className={styles.group}',
    endAnchor: '</h3>',
    topic: 'semantics',
    title: 'Day groups are headed regions',
    rationale:
      'Each day is a section named by its heading, holding a real list. Screen reader users can press H to jump between days and hear how many items each list holds.',
    wcag: ['1.3.1'],
  },
  {
    id: 'unread-text',
    anchor: '{!item.read && <span className={styles.visuallyHidden}>Unread: </span>}',
    topic: 'semantics',
    title: 'Read state is a word, not just weight',
    rationale:
      'The audited rows differed only by bold text. On screen, unread rows get a dot, a tint, and a bolder title; for assistive tech, the title starts with "Unread:", which also flows into every button described by it.',
    wcag: ['1.3.1', '1.4.1'],
  },
  {
    id: 'item-action',
    anchor: 'item.action?.onClick();',
    endAnchor: 'if (!item.read) onReadChange(item.id, true);',
    topic: 'state',
    title: 'Acting on an item marks it read',
    rationale:
      'Rows used to be clickable divs that navigated away. Each item now has an explicit action button, described by its title so a list of "View invoice" buttons is distinguishable, and using it marks the item read.',
    wcag: ['2.1.1'],
  },
  {
    id: 'toggle-read',
    anchor: "{item.read ? 'Mark as unread' : 'Mark as read'}",
    topic: 'state',
    title: 'Read state can be undone',
    rationale:
      'Users mark items read by mistake, or want a reminder to come back. The toggle works both ways and its label always says what pressing it will do next.',
    wcag: ['4.1.2'],
  },
  {
    id: 'badge-style',
    file: 'styles',
    anchor: '/* Numeric count, not a dot: the number is the signal, color only reinforces it. */',
    endAnchor: 'text-align: center;',
    topic: 'styling',
    title: 'A number, not a dot',
    rationale:
      'The badge shows the count in white on the danger color with a surface-colored ring, so it reads against any header background. The number carries the meaning; red only reinforces it.',
    wcag: ['1.4.1'],
  },
  {
    id: 'panel-width',
    file: 'styles',
    anchor: 'width: min(24rem, 100cqi);',
    endAnchor: 'max-height: min(28rem, 70vh);',
    topic: 'resilience',
    title: 'The panel fits its container',
    rationale:
      'Width is capped by the container, not the viewport, so the panel never overflows a narrow header or a 320px screen, and the list scrolls inside a bounded height instead of pushing the page.',
    wcag: ['1.4.10'],
  },
  {
    id: 'forced-colors',
    file: 'styles',
    anchor: '@media (forced-colors: active) {',
    endAnchor: 'background: CanvasText;',
    topic: 'styling',
    title: 'The unread dot survives high contrast mode',
    rationale:
      'Forced colors strip background colors, which would erase the dot. Switching it to the system text color keeps the visual unread cue in Windows High Contrast.',
    wcag: ['1.4.11'],
  },
];
