import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const onboardingChecklistPattern: PatternDefinition = {
  id: 'empty-states.onboarding-checklist',
  slug: 'onboarding-checklist',
  title: 'Onboarding checklist instead of a product tour',
  summary: 'A persistent, collapsible list of real setup tasks with progress, each linking into the product and ticked only when the user actually does it.',
  category: 'empty-states',
  tags: ['onboarding', 'first use', 'product tour', 'coach marks', 'progress', 'consistent help'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'New users land in an empty workspace and need to learn the product and reach first value. Teams reach for a coach-mark tour: a dimmed page and a bubble that walks through the interface. Keyboard and screen reader users never reach the bubble, it advances on a timer, it points at controls that are scrolled out of view, and once closed it cannot be found again. Progress counts screens viewed, not work done, so the tour "finishes" with nothing set up.',
  beforeState: {
    summary: 'A four-step coach-mark tour over a dimmed workspace that auto-advances and disappears for good when closed.',
    failures: [
      {
        id: 'auto-advance',
        description: 'The tour advances every few seconds with no way to pause or slow it down.',
        refs: [{ kind: 'wcag', criterion: '2.2.1' }, { kind: 'heuristic', id: 'H3' }],
        target: { label: 'Tour bubble' },
      },
      {
        id: 'unreachable-controls',
        description: 'Next and Close are clickable text, not buttons, and the bubble sits at the end of the page, so Tab moves through the dimmed page and never reaches the tour.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Next control in the tour' },
      },
      {
        id: 'silent-steps',
        description: 'Step text changes without any announcement, so screen reader users do not know a tour is running.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }],
        target: { label: 'Tour step text' },
      },
      {
        id: 'off-screen-target',
        description: 'The ring highlights the Invite button, which is scrolled out of view inside its panel.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: 'Invite button below the fold' },
      },
      {
        id: 'screens-not-tasks',
        description: 'Progress counts tour screens viewed. Reaching "4 of 4" sets nothing up.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'heuristic', id: 'H2' }],
        target: { label: '"Step 1 of 4" counter' },
      },
      {
        id: 'no-way-back',
        description: 'Closing the tour removes it for good. No help entry point reopens it, in this spot or anywhere else.',
        refs: [{ kind: 'wcag', criterion: '3.2.6' }, { kind: 'heuristic', id: 'H10' }],
        target: { label: 'Close (×) control' },
      },
    ],
  },
  designRationale:
    'People learn software by doing a task, not by being shown where buttons are. The checklist lists the handful of tasks that produce first value, each one a link that takes the user to where the work happens. The product marks a task done when the work is detected, so progress means something. Nothing moves on its own: no timer, no overlay, no stolen focus. The list is a labelled complementary landmark in normal reading order, collapses to a single row instead of disappearing, and keeps the help link in the same place on every page. Completion is announced politely. Once everything is done, and only then, the user can remove it.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'tasks', type: 'OnboardingTask[]', required: true, description: '{ id, title, description, complete } plus either href (real link) or onSelect (in-app route that moves focus).' },
    { name: 'help', type: '{ label: string; href: string }', required: true, description: 'Help entry point rendered in the same spot every time the checklist appears (WCAG 3.2.6).' },
    { name: 'title', type: 'string', required: false, defaultValue: "'Getting started'", description: 'Heading text and the landmark name.' },
    { name: 'headingLevel', type: '2 | 3 | 4', required: false, defaultValue: '2', description: 'Match the surrounding document outline.' },
    { name: 'defaultExpanded', type: 'boolean', required: false, defaultValue: 'true', description: 'Restore a collapsed state the user chose earlier.' },
    { name: 'onExpandedChange', type: '(expanded: boolean) => void', required: false, description: 'Persist the collapsed or expanded choice.' },
    { name: 'onDismiss', type: '() => void', required: false, description: 'Shows "Remove checklist" only when every task is complete.' },
  ],
  usage: `<OnboardingChecklist
  tasks={[
    { id: 'import', title: 'Import your first records', description: 'Start from the sample file.', href: '/import', complete: hasRecords },
    { id: 'invite', title: 'Invite a teammate', description: 'Reviews need a second person.', href: '/team', complete: memberCount > 1 },
  ]}
  help={{ label: 'Help and support', href: '/help' }}
  onExpandedChange={saveChecklistPreference}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.2.1', level: 'A', title: 'Timing adjustable', detail: 'Nothing advances on a timer. The user moves at their own pace.' },
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'The checklist is in the normal DOM order, not a floating layer, and never takes focus on its own.' },
    { kind: 'wcag', criterion: '3.2.6', level: 'A', title: 'Consistent help', detail: 'The help link renders in the same position each time. Collapsing keeps the checklist in place instead of removing it.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'A polite status region announces "Task complete: … 2 of 5 done." when the product detects a completed task.' },
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Done tasks change mark shape (circle to check) and carry ", done" in their accessible name, not just a color.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Move through Hide, each task link, and the help link in visual order.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'Collapse or expand the list; open a task.' },
    { kind: 'aria', attribute: 'aria-expanded / aria-controls', detail: 'The Hide and Show button is a disclosure for the task list.' },
    { kind: 'aria', attribute: 'aria-describedby', detail: 'Each task link is described by its one-line explanation.' },
    { kind: 'screen-reader', title: 'Landmark', detail: 'Reached with landmark navigation as "Getting started, complementary".' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
