import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const toastStackPattern: PatternDefinition = {
  id: 'notifications.toast-stack',
  slug: 'toast-stack',
  title: 'Toast stack with severity rules',
  summary: 'Provider plus useToast hook with a capped, queued stack, severity-based timing, pause on hover or focus, and separate polite and assertive live regions.',
  category: 'notifications',
  tags: ['toast', 'notifications', 'live region', 'alerts', 'status'],
  sourceApps: ['ISW', 'CoBank'],
  problemStatement:
    'Batch jobs fire one toast per record, so a 40-row import stacks 40 toasts over the page. Every toast disappears after 3 seconds, including errors, so failures are missed. Toasts are injected as new DOM nodes with role="alert" each time, which screen readers often skip. Undo actions vanish before keyboard users can reach them.',
  beforeState: {
    summary: 'Unbounded toast stack, 3-second timeout for every severity.',
    failures: [
      {
        id: 'unbounded',
        description: 'No cap on visible toasts; they cover primary actions.',
        refs: [{ kind: 'wcag', criterion: '2.4.11' }, { kind: 'heuristic', id: 'H8' }],
        target: { label: 'Toast stack', revealedBy: 'Click Burst of 6' },
      },
      {
        id: 'error-auto-dismiss',
        description: 'Errors auto-dismiss before they are read (fails 2.2.1).',
        refs: [{ kind: 'wcag', criterion: '2.2.1' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: 'Error toast message', revealedBy: 'Click Error' },
      },
      {
        id: 'undo-vanishes',
        description: 'Undo links disappear before keyboard users can Tab to them.',
        refs: [{ kind: 'wcag', criterion: '2.2.1' }, { kind: 'wcag', criterion: '2.1.1' }, { kind: 'heuristic', id: 'H3' }],
        target: { label: 'Undo link', revealedBy: 'Click Success with Undo' },
      },
      {
        id: 'live-region-on-the-fly',
        description: 'Live regions are created on the fly, so announcements are unreliable.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }],
        target: { label: 'Each toast container', revealedBy: 'Trigger any toast' },
      },
      {
        id: 'color-only-severity',
        description: 'Severity is shown by color only.',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }],
        target: { label: 'Colored severity stripe', revealedBy: 'Trigger any toast' },
      },
    ],
  },
  designRationale:
    'Severity sets timing: success and info auto-dismiss, errors and anything with an action stay until dismissed. Errors jump to the top of the stack so they are never queued out of sight. The stack shows at most three; the rest wait behind an "N more" count with Dismiss all. Live regions exist from first render and only their text changes, which is the most reliable way to get announcements across NVDA, JAWS, and VoiceOver. Hover or focus pauses every timer, and F8 moves focus to the stack, so keyboard users can reach actions.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'ToastProvider.maxVisible', type: 'number', required: false, defaultValue: '3', description: 'Toasts shown at once. Extra toasts queue.' },
    { name: 'ToastProvider.defaultDuration', type: 'number (ms)', required: false, defaultValue: '6000', description: 'Auto-dismiss time for info, success, and warning toasts without actions.' },
    { name: 'ToastProvider.hotkey', type: 'string', required: false, defaultValue: "'F8'", description: 'KeyboardEvent.key that moves focus to the newest toast.' },
    { name: 'useToast().notify', type: '(input: ToastInput) => string', required: true, description: 'Shows a toast and returns its id. ToastInput: { tone, title, description?, action?, duration? }' },
    { name: 'useToast().dismiss', type: '(id: string) => void', required: false, description: 'Removes one toast, e.g. when the related job finishes.' },
    { name: 'useToast().dismissAll', type: '() => void', required: false, description: 'Clears the stack.' },
  ],
  usage: `// App root
<ToastProvider><App /></ToastProvider>

// Anywhere below
const { notify } = useToast();
notify({ tone: 'success', title: 'Draft saved', action: { label: 'Undo', onClick: undo } });`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.2.1', level: 'A', title: 'Timing adjustable', detail: 'Timers pause on hover and focus; errors and actionable toasts never time out.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Persistent role="status" for info, success, and warning; role="alert" for errors.' },
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Every toast shows a text tone label (Success, Error) next to the colored border.' },
    { kind: 'keyboard', keys: 'F8', action: 'Move focus to the newest toast.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Dismiss the focused toast.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Reach the action and dismiss buttons inside the stack.' },
    { kind: 'aria', attribute: 'aria-label="Notifications (F8)"', detail: 'Names the region and advertises the shortcut.' },
    { kind: 'aria', attribute: 'aria-label="Dismiss: <title>"', detail: 'Each close button says which toast it closes.' },
    { kind: 'screen-reader', title: 'New toast', detail: 'Hears "Success: Draft saved. Saved to Cedar Ridge Farms renewal." without focus moving.' },
    { kind: 'screen-reader', title: 'Error toast', detail: 'Interrupts current speech: "Error: Payment file rejected..."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-17',
  author: 'Design System Team',
};
