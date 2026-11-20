import type { ScreenReaderTranscript } from '../../../types/transcript';

export const sidePanelTranscript: ScreenReaderTranscript = {
  patternId: 'modals.side-panel',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Open a work order from the list',
      keys: 'Enter on "Inspect fire doors"',
      before: [
        { kind: 'speech', text: 'WO-1041, button' },
        { kind: 'silence', note: 'The panel slides in over the list. Focus stays on the row, so nothing about the panel is read.' },
      ],
      after: [
        { kind: 'speech', text: 'Inspect fire doors, region' },
        { kind: 'speech', text: 'Inspect fire doors, heading, level 3' },
      ],
      failure: 'The user does not know a panel opened, or which record it shows.',
      criterion: '2.4.3',
    },
    {
      action: 'Move to the next control',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'WO-1042, button' }],
      after: [{ kind: 'speech', text: 'Close, button' }],
      failure: 'Focus moves to the next row, which is hidden under the panel. Sighted keyboard users cannot see where they are.',
      criterion: '2.4.11',
    },
    {
      action: 'Close the panel from the keyboard',
      keys: 'Escape',
      before: [{ kind: 'silence', note: 'Nothing happens. The "×" is not focusable and Escape is not handled.' }],
      after: [{ kind: 'speech', text: 'Inspect fire doors, WO-1041 · Building B · Open, button, current' }],
      failure: 'Keyboard users cannot dismiss the panel at all.',
      criterion: '2.1.1',
    },
    {
      action: 'Close with the mouse, then continue down the list',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'WO-1040, button' }],
      after: [{ kind: 'speech', text: 'Service loading dock lift, WO-1042 · Building C · Open, button' }],
      failure: 'The list was rebuilt: focus restarts at the top and the scroll position is gone.',
      criterion: '2.4.3',
    },
    {
      action: 'Open a record on a phone-width screen',
      keys: 'Enter on "Inspect fire doors"',
      before: [{ kind: 'silence', note: 'The 26rem panel runs past the right edge. The close icon is off screen.' }],
      after: [
        { kind: 'speech', text: 'Inspect fire doors, dialog' },
        { kind: 'speech', text: 'Inspect fire doors, heading, level 3' },
        { kind: 'speech', text: 'Back to list, button' },
      ],
      failure: 'Content needs horizontal scrolling and there is no visible way back to the list.',
      criterion: '1.4.10',
    },
  ],
};
