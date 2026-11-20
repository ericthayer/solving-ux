import type { CodeAnnotation } from '../../../types/walkthrough';

export const onboardingChecklistWalkthrough: CodeAnnotation[] = [
  {
    id: 'task-target',
    anchor: 'type TaskTarget = { href: string; onSelect?: never } | { onSelect: () => void; href?: never };',
    topic: 'semantics',
    title: 'Each task links into the product',
    rationale:
      'A task is either a real URL, rendered as a link, or an in-app route, rendered as a button. The union forbids both at once, so the element always matches what activating it does.',
    wcag: ['4.1.2'],
  },
  {
    id: 'real-completion',
    anchor: '/** Set by the product when the user actually does the task, never by viewing a step. */',
    endAnchor: 'complete: boolean;',
    topic: 'state',
    title: 'Progress means work done, not screens viewed',
    rationale:
      'The audited tour counted "Step 4 of 4" after four bubbles, with nothing set up. Here completion is a prop the product sets from real data (records exist, a teammate joined), so the checklist cannot report progress the user has not made.',
  },
  {
    id: 'announce-completion',
    anchor: '// Announce completions detected from real use. The first render is never announced.',
    endAnchor: '}, [tasks]);',
    topic: 'announce',
    title: 'Announce what the user just achieved',
    rationale:
      'Tasks are usually finished on another screen, so the checklist compares completed ids with the previous render and announces only new ones in a polite status region. Page load stays quiet; nothing advances on a timer.',
    wcag: ['4.1.3', '2.2.1'],
  },
  {
    id: 'landmark',
    anchor: '<aside className={styles.root} aria-labelledby={headingId} data-complete={allDone || undefined}>',
    topic: 'semantics',
    title: 'A landmark in reading order, not an overlay',
    rationale:
      'Coach marks float above the page at the end of the DOM, so Tab and the virtual cursor never reach them. The checklist is a complementary landmark named by its heading, placed in the page flow. Landmark navigation finds it, and it never takes focus on its own.',
    wcag: ['1.3.1', '2.4.3'],
  },
  {
    id: 'disclosure',
    anchor: '<button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls={bodyId} onClick={toggle}>',
    endAnchor: '</button>',
    topic: 'focus',
    title: 'Collapse instead of close',
    rationale:
      'The tour disappeared for good once closed. Here Hide collapses the list to one row and the same button, still focused, becomes Show. The hidden text gives the button a name that makes sense out of context: "Hide getting started tasks".',
    wcag: ['4.1.2', '2.4.6'],
  },
  {
    id: 'progress',
    anchor: '<progress className={styles.meter} max={total || 1} value={done} aria-labelledby={headingId} aria-describedby={progressId} />',
    topic: 'resilience',
    title: 'A native progress bar with a text count',
    rationale:
      'The count "2 of 5 done" is visible text, and the progress element exposes the same value to assistive tech. max falls back to 1 so an empty task list cannot produce an invalid range.',
    wcag: ['1.3.1'],
  },
  {
    id: 'done-in-name',
    anchor: "<span className={styles.visuallyHidden}>{task.complete ? ', done' : ', not started'}</span>",
    topic: 'semantics',
    title: 'State is in the name, not only the color',
    rationale:
      'Done tasks change color and their mark changes from a circle to a check. The hidden suffix puts the same fact in the accessible name, after the visible text so voice control users can still say the visible label.',
    wcag: ['1.4.1', '2.5.3'],
  },
  {
    id: 'consistent-help',
    anchor: '{/* Outside the collapsible body: help stays in the same place whether the list is open or not. */}',
    endAnchor: '{help.label}',
    topic: 'resilience',
    title: 'Help stays in the same place',
    rationale:
      'WCAG 2.2 added Consistent help: a help mechanism repeated across pages must keep the same relative position. The help link sits outside the collapsible body, so collapsing the list never hides it.',
    wcag: ['3.2.6'],
  },
  {
    id: 'dismiss-when-done',
    anchor: '{allDone && onDismiss && (',
    endAnchor: 'Remove checklist',
    topic: 'state',
    title: 'Removal is earned',
    rationale:
      'Removing the list before setup is complete is how users lose their way back. Remove appears only when every task is done; until then, Hide is the way to get it out of sight.',
  },
];
