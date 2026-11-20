import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const confirmDialogPattern: PatternDefinition = {
  id: 'modals.confirm-dialog',
  slug: 'confirm-dialog',
  title: 'Confirmation dialog',
  summary: 'Native <dialog> confirmation with severity tiers, itemized consequences, type-to-confirm for irreversible actions, and in-place error recovery.',
  category: 'modals',
  tags: ['modal', 'dialog', 'confirmation', 'destructive action', 'focus management'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Every action, from saving a note to deleting a facility, triggers the same "Are you sure?" modal with OK and Cancel. Users click through without reading. Modals are div overlays that leave the background page tabbable, do not close on Escape, and drop focus at the top of the page when dismissed. When the action fails, the modal closes and an error appears somewhere else on the page, or not at all.',
  beforeState: {
    summary: 'Generic div-based "Are you sure? OK / Cancel" modal used for all actions.',
    failures: [
      {
        id: 'same-dialog',
        description: 'Identical dialog for trivial and irreversible actions trains users to click OK.',
        refs: [{ kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '3.3.4' }],
        target: { label: 'Archive and Delete buttons' },
      },
      {
        id: 'ok-cancel',
        description: 'Buttons say OK/Cancel instead of naming the action.',
        refs: [{ kind: 'heuristic', id: 'H2' }, { kind: 'wcag', criterion: '2.4.6' }],
        target: { label: 'OK and Cancel buttons', revealedBy: 'Click either action' },
      },
      {
        id: 'no-focus-trap',
        description: 'Focus is not trapped; Tab reaches the page behind the overlay.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'Dialog box', revealedBy: 'Click either action' },
      },
      {
        id: 'focus-not-returned',
        description: 'Focus is not returned to the trigger on close.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }],
        target: { label: 'Delete facility button' },
      },
      {
        id: 'error-after-close',
        description: 'Errors from the action are shown after the dialog closes, out of context.',
        refs: [{ kind: 'heuristic', id: 'H9' }, { kind: 'wcag', criterion: '4.1.3' }, { kind: 'wcag', criterion: '3.3.1' }],
        target: { label: 'Page-level error message', revealedBy: 'Delete the facility and click OK' },
      },
    ],
  },
  designRationale:
    'Friction should scale with consequence. Reversible actions get a plain dialog with a named button. Irreversible ones get alertdialog semantics, a red top rule, an itemized list of what will be lost, Cancel focused first, and an optional type-to-confirm field. The native <dialog> element with showModal() makes the background inert, handles Escape, and puts the dialog in the top layer, which removes a large amount of focus-trap code. If the action fails, the dialog stays open with the error inside it, so the user can retry or cancel with full context.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Controlled visibility. The component calls showModal() and close() for you.' },
    { name: 'title', type: 'string', required: true, description: 'Phrase as a question naming the object, e.g. "Delete facility FAC-2231?"' },
    { name: 'description', type: 'ReactNode', required: true, description: 'What happens and whether it can be undone. Linked with aria-describedby.' },
    { name: 'confirmLabel', type: 'string', required: true, description: 'Verb + object. Never "OK" or "Yes".' },
    { name: 'cancelLabel', type: 'string', required: false, defaultValue: '"Cancel"', description: 'Label for the dismiss button.' },
    { name: 'tone', type: "'default' | 'danger'", required: false, defaultValue: "'default'", description: 'danger switches to role="alertdialog", focuses Cancel first, and ignores backdrop clicks.' },
    { name: 'consequences', type: 'string[]', required: false, description: 'Itemized side effects shown under the description.' },
    { name: 'requireText', type: 'string', required: false, description: 'Exact text the user must type to enable confirm. Use for irreversible, high-impact actions only.' },
    { name: 'onConfirm', type: '() => void | Promise<void>', required: true, description: 'Throw or reject to keep the dialog open and show the error message inside it.' },
    { name: 'onClose', type: '() => void', required: true, description: 'Set open to false. Called on Cancel, Escape, backdrop click (default tone), and after a successful confirm.' },
  ],
  usage: `<ConfirmDialog
  open={isOpen}
  tone="danger"
  title="Delete facility FAC-2231?"
  description={<p>This cannot be undone.</p>}
  requireText="FAC-2231"
  confirmLabel="Delete facility"
  onConfirm={() => api.deleteFacility(id)}
  onClose={() => setOpen(false)}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'Focus moves into the dialog on open and back to the trigger on close.' },
    { kind: 'wcag', criterion: '2.1.2', level: 'A', title: 'No keyboard trap', detail: 'Escape always closes unless an action is in progress.' },
    { kind: 'wcag', criterion: '3.3.4', level: 'AA', title: 'Error prevention', detail: 'Irreversible actions require explicit confirmation and list consequences.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Cycle through controls inside the dialog; the page behind is inert.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Close the dialog (native cancel event).' },
    { kind: 'keyboard', keys: 'Enter', action: 'In the confirm text field, submits once the text matches.' },
    { kind: 'aria', attribute: 'role="alertdialog"', detail: 'Applied for danger tone so screen readers treat it as urgent.' },
    { kind: 'aria', attribute: 'aria-labelledby / aria-describedby', detail: 'Title and description are read when the dialog opens.' },
    { kind: 'screen-reader', title: 'On open', detail: 'Announces "Delete facility FAC-2231?, alert dialog, This cannot be undone..." then the focused control.' },
    { kind: 'screen-reader', title: 'On failure', detail: 'role="alert" reads the error while focus stays where it was.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-17',
  author: 'Design System Team',
};
