import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const commandPalettePattern: PatternDefinition = {
  id: 'navigation.command-palette',
  slug: 'command-palette',
  title: 'Command palette and keyboard shortcuts',
  summary: 'Ctrl+K palette built on the typeahead pattern, a shortcuts dialog, and single-key shortcuts that are scoped to a work area and can be turned off or remapped.',
  category: 'navigation',
  tags: ['command palette', 'keyboard shortcuts', 'quick search', 'power users', 'speech input'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Power users want to jump to a page or run an action without the mouse, so the app added single-letter shortcuts and a Ctrl+K search. The letters listen on the whole page: a screen reader user pressing H to move between headings, or a speech input user dictating a note, fires "New order" and "Export" instead. Nothing lists the shortcuts, so only people who found the hover tooltip know they exist. The palette is a styled div with an unlabeled input and clickable rows, so arrow keys and Enter do nothing and assistive technology hears an empty edit field.',
  beforeState: {
    summary: 'Page-wide letter shortcuts and a div-based quick search opened from an icon.',
    failures: [
      {
        id: 'char-shortcuts-unscoped',
        description: 'Single-letter shortcuts fire anywhere, even while typing in a field or dictating, and cannot be turned off or remapped.',
        refs: [{ kind: 'wcag', criterion: '2.1.4' }, { kind: 'heuristic', id: 'H5' }],
        target: { label: 'Notes field' },
      },
      {
        id: 'no-shortcut-list',
        description: 'Shortcuts are documented only in a hover tooltip on a small "(?)" mark.',
        refs: [{ kind: 'heuristic', id: 'H6' }, { kind: 'heuristic', id: 'H10' }, { kind: 'wcag', criterion: '1.4.13' }],
        target: { label: 'Help mark in the toolbar' },
      },
      {
        id: 'icon-trigger',
        description: 'The palette opens from an unlabeled magnifier glyph that is not a button and cannot be reached with Tab.',
        refs: [{ kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Magnifier icon' },
      },
      {
        id: 'div-palette',
        description: 'The search box has only a placeholder for a label, and results are clickable divs with no combobox or listbox roles; arrow keys and Enter do nothing.',
        refs: [{ kind: 'wcag', criterion: '3.3.2' }, { kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '2.1.1' }],
        target: { label: 'Palette search box', revealedBy: 'Press Ctrl+K or click the magnifier' },
      },
      {
        id: 'no-focus-return',
        description: 'Closing the palette drops focus to the top of the page instead of where the user was.',
        refs: [{ kind: 'wcag', criterion: '2.4.3' }, { kind: 'heuristic', id: 'H3' }],
        target: { label: 'Palette overlay', revealedBy: 'Open the palette, then press Escape' },
      },
    ],
  },
  designRationale:
    'Separate the two kinds of shortcut. Ctrl+K (Cmd+K) has a modifier, so it is safe everywhere and opens the palette. Single-letter shortcuts are where WCAG 2.1.4 bites, so they only fire while focus is inside the labelled work area, never in a text field, and the shortcuts dialog lets users turn them off or remap them, with conflicts caught inline. The palette reuses the typeahead combobox rather than a second search widget, so ranking, the result count, and keyboard behavior are already tested. It lives in a native modal dialog that returns focus to where the user was, and runs the chosen command only after focus is back. Every command is reachable from the palette and every shortcut is listed in one place, so nothing depends on memorizing keys.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'commands', type: 'Command[]', required: true, description: '{ id, label, description?, shortcut?, run }. shortcut is one letter or digit; users can remap or clear it.' },
    { name: 'children', type: 'ReactNode', required: true, description: 'The work area. Single-key shortcuts only fire while focus is inside it.' },
    { name: 'scopeLabel', type: 'string', required: true, description: 'Accessible name of the work area region, also used in the shortcuts dialog hint.' },
  ],
  usage: `// Reuses Typeahead from search-filters/typeahead.
<CommandPalette
  scopeLabel="Orders workspace"
  commands={[
    { id: 'new', label: 'New purchase order', shortcut: 'n', run: createOrder },
    { id: 'orders', label: 'Go to orders', description: 'Navigation', shortcut: 'o', run: () => navigate('/orders') },
    { id: 'settings', label: 'Go to settings', description: 'Navigation', run: () => navigate('/settings') },
  ]}
>
  <OrdersTable />
</CommandPalette>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.1.4', level: 'A', title: 'Character key shortcuts', detail: 'Letter shortcuts fire only when focus is in the work area and not in a text field, and can be turned off or remapped in the shortcuts dialog.' },
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'The palette search is the typeahead ARIA 1.2 combobox inside a labelled modal dialog.' },
    { kind: 'wcag', criterion: '3.3.2', level: 'A', title: 'Labels or instructions', detail: 'The combobox has a visible label and a hint; remap inputs are named per command and describe conflicts.' },
    { kind: 'wcag', criterion: '2.4.3', level: 'A', title: 'Focus order', detail: 'Dialogs return focus to the element that opened them, and the command runs after focus is back.' },
    { kind: 'keyboard', keys: 'Ctrl+K / Cmd+K', action: 'Open the command palette from anywhere in the component.' },
    { kind: 'keyboard', keys: '?', action: 'Open the shortcuts dialog (work area only, while single-key shortcuts are on).' },
    { kind: 'keyboard', keys: 'Down / Up Arrow, Enter', action: 'Move through matching commands and run the highlighted one.' },
    { kind: 'keyboard', keys: 'Escape', action: 'Close the result list, then the palette.' },
    { kind: 'aria', attribute: 'aria-keyshortcuts', detail: 'The palette button advertises Control+K and Meta+K.' },
    { kind: 'screen-reader', title: 'Opening', detail: '"Command palette, dialog. Command, combo box, collapsed, Type to search commands and pages."' },
    { kind: 'screen-reader', title: 'Arrowing', detail: 'Each command is read with its group and current key: "Go to orders, Navigation · Shortcut O, 1 of 4".' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
