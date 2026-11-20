import type { ScreenReaderTranscript } from '../../../types/transcript';

export const commandPaletteTranscript: ScreenReaderTranscript = {
  patternId: 'navigation.command-palette',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Open the command palette',
      keys: 'Ctrl+K',
      before: [{ kind: 'speech', text: 'edit, Search…' }],
      after: [
        { kind: 'speech', text: 'Command palette, dialog' },
        { kind: 'speech', text: 'Command, combo box, collapsed, autocomplete, Type to search commands and pages. Enter runs the highlighted command.' },
      ],
      failure: 'Focus lands in a field named only by its placeholder, with no hint that it is a command search inside an overlay.',
      criterion: '3.3.2',
    },
    {
      action: 'Search for a page',
      keys: 'Type "go"',
      before: [
        { kind: 'speech', text: 'g, o' },
        { kind: 'silence', note: 'Five rows appear under the field. Nothing says they exist.' },
      ],
      after: [
        { kind: 'speech', text: 'g, o' },
        { kind: 'speech', text: '5 matches.' },
      ],
    },
    {
      action: 'Move to the first result',
      keys: 'Down Arrow',
      before: [{ kind: 'speech', text: 'blank' }],
      after: [{ kind: 'speech', text: 'Go to orders, Navigation · Shortcut O, 1 of 5' }],
      failure: 'Results are clickable divs; the arrow key only moves the text cursor.',
      criterion: '2.1.1',
    },
    {
      action: 'Run the command',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'Enter does nothing. The palette stays open.' }],
      after: [
        { kind: 'speech', text: 'Orders workspace, region, PO-4410 · Cedar Ridge Supply, button' },
        { kind: 'speech', text: 'Ran Go to orders.' },
      ],
      failure: 'The only way to run a result is to click it.',
      criterion: '4.1.2',
    },
    {
      action: 'Dictate a note in a text field',
      keys: 'Say "send report"',
      before: [
        { kind: 'speech', text: 'Ran Go to suppliers. Ran Export current view. Ran New purchase order. Ran Toggle compact rows.' },
        { kind: 'speech', text: 'Ran Go to reports. Ran Export current view. Ran Go to orders. Ran Go to reports.' },
      ],
      after: [{ kind: 'speech', text: 'send report' }],
      failure: 'Every letter of the dictated text also runs a page-wide shortcut.',
      criterion: '2.1.4',
    },
    {
      action: 'Find out which shortcuts exist',
      keys: '?',
      before: [{ kind: 'silence', note: 'The list exists only as a hover tooltip on a "(?)" mark that keyboard and screen reader users never reach.' }],
      after: [
        { kind: 'speech', text: 'Keyboard shortcuts, dialog' },
        { kind: 'speech', text: 'Single-key shortcuts, check box, checked, Letter keys run commands only while focus is in Orders workspace and not in a text field.' },
      ],
      failure: 'Shortcuts cannot be discovered, turned off, or remapped.',
      criterion: '2.1.4',
    },
  ],
};
