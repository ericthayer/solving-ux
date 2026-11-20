import type { CodeAnnotation } from '../../../types/walkthrough';

export const commandPaletteWalkthrough: CodeAnnotation[] = [
  {
    id: 'reuse-combobox',
    anchor: "import { Typeahead } from '../../search-filters/typeahead/Typeahead';",
    endAnchor: "import type { TypeaheadOption } from '../../search-filters/typeahead/Typeahead';",
    topic: 'semantics',
    title: 'One combobox, reused',
    rationale:
      'The audited palette was a second, hand-rolled search with clickable divs. Reusing the typeahead brings its ranking, capped list, live count, and ARIA 1.2 combobox, all already tested, instead of a parallel widget that drifts.',
    wcag: ['4.1.2'],
  },
  {
    id: 'typing-target',
    anchor: '/** True when the key press belongs to a text field, so a letter must type, not run a command. */',
    endAnchor: "return target instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'submit', 'reset'].includes(target.type);",
    topic: 'resilience',
    title: 'Letters in a text field always type',
    rationale:
      'Text inputs, textareas, selects, and contenteditable regions own every printable key. Checkboxes and buttons do not, so shortcuts still work when one of those has focus.',
    wcag: ['2.1.4'],
  },
  {
    id: 'validate',
    anchor: '/** Returns an error message, or null when `key` can be bound to `commandId`. */',
    endAnchor: 'return owner ? `${key.toUpperCase()} already runs ${owner.label}.` : null;',
    topic: 'state',
    title: 'Remapping catches conflicts',
    rationale:
      'A remapped key must be one letter or digit and must not already belong to another command. An empty value clears the shortcut, which turns that one command off without touching the rest.',
    wcag: ['2.1.4', '3.3.1'],
  },
  {
    id: 'modal',
    anchor: '/** Opens a native modal dialog while `open` is true and returns focus to where it was on close. */',
    endAnchor: 'returnTo.current = null;',
    topic: 'focus',
    title: 'Native dialog with focus return',
    rationale:
      'showModal() makes the rest of the page inert and gives the dialog role for free. The element that had focus is remembered and refocused on close, so users land where they were, not at the top of the page.',
    wcag: ['2.4.3'],
  },
  {
    id: 'modifier',
    anchor: '// Ctrl+K / Cmd+K uses a modifier, so it cannot be triggered by typing or dictation.',
    endAnchor: 'if (!shortcutsOpen) setPaletteOpen(true);',
    topic: 'focus',
    title: 'Modifier shortcut opens the palette',
    rationale:
      'WCAG 2.1.4 only covers shortcuts made of printable characters alone. Ctrl+K and Cmd+K are safe anywhere in the component, and the palette button advertises them with aria-keyshortcuts.',
  },
  {
    id: 'single-key',
    anchor: '// Single-key shortcuts: only inside the work area, never in a text field, and only while turned on.',
    endAnchor: 'command.run();',
    topic: 'focus',
    title: 'Single keys are scoped, skippable, and switchable',
    rationale:
      'The handler sits on the work area section, so it never hears keys pressed elsewhere. It ignores text fields and modified keys, and returns early when the user turns single-key shortcuts off. Screen reader quick keys and speech input stay safe.',
    wcag: ['2.1.4'],
  },
  {
    id: 'escape',
    anchor: 'const onPaletteKeyDownCapture = (event: KeyboardEvent<HTMLDialogElement>): void => {',
    endAnchor: 'listWasOpen.current = false;',
    topic: 'focus',
    title: 'Escape closes the list before the dialog',
    rationale:
      'The capture handler notes whether the result list was open before the typeahead handles Escape. The dialog cancel event then keeps the palette open on that first press, so one Escape never throws away both the results and the dialog.',
  },
  {
    id: 'run-after-close',
    anchor: '// Run after the dialog closes and focus is back, so the command acts on the page, not the palette.',
    endAnchor: 'command?.run();',
    topic: 'state',
    title: 'Commands run after focus returns',
    rationale:
      'Running a command while the modal is still open would announce its result behind an inert page, and a command that moves focus would fight the dialog. Closing first, restoring focus, then running keeps the order predictable.',
    wcag: ['2.4.3'],
  },
  {
    id: 'scope-region',
    anchor: '<section aria-label={scopeLabel} className={styles.scope} onKeyDown={onScopeKeyDown}>',
    topic: 'semantics',
    title: 'The shortcut area is a named region',
    rationale:
      'The work area is a labelled region, so screen reader users hear "Orders workspace, region" when they enter it and the shortcuts dialog can name it. A visible focus-within border shows sighted users when letter keys are live.',
    wcag: ['1.3.1'],
  },
  {
    id: 'toggle',
    anchor: '<input type="checkbox" checked={singleKeys}',
    topic: 'semantics',
    title: 'Turn single-key shortcuts off',
    rationale:
      'The first control in the shortcuts dialog is the off switch, with a description that names who should use it. Remap inputs below it are disabled while shortcuts are off.',
    wcag: ['2.1.4', '3.3.2'],
  },
  {
    id: 'remap-input',
    anchor: 'aria-label={`Key for ${c.label}`}',
    endAnchor: "aria-describedby={errors[c.id] ? `${id}-${c.id}-error` : undefined}",
    topic: 'announce',
    title: 'Each remap field names its command and its error',
    rationale:
      'Every key input is named after the command it controls, and a conflict sets aria-invalid and links the message with aria-describedby, so the error is read when the field has focus.',
    wcag: ['3.3.1', '4.1.2'],
  },
  {
    id: 'flow-list',
    file: 'styles',
    anchor: "/* The reused typeahead's result list flows inside the dialog instead of overlapping its edge. */",
    endAnchor: 'position: static;',
    topic: 'styling',
    title: 'Results grow the dialog instead of overflowing it',
    rationale:
      'The typeahead floats its list for inline use. Inside a modal that would be clipped by the dialog edge, so the palette lets the list flow and the dialog grows with it.',
    wcag: ['1.4.10'],
  },
];
