import type { ScreenReaderTranscript } from '../../../types/transcript';

export const transferListTranscript: ScreenReaderTranscript = {
  patternId: 'inputs.transfer-list',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab into the available list',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'list, multi select, Patel, Avery, 1 of 45' }],
      after: [{ kind: 'speech', text: 'Available (45 people), grouping, Filter available, edit' }],
      failure: 'The list has no name, and nothing says it is the available side or how to pick several.',
      criterion: '3.3.2',
    },
    {
      action: 'Find one person',
      keys: 'Type "garcia"',
      before: [{ kind: 'silence', note: 'There is no filter. Typing jumps to whichever option starts with "g", not to Garcia.' }],
      after: [{ kind: 'speech', text: 'g, a, r, c, i, a' }, { kind: 'speech', text: 'Tab, Select all 5 people matching, checkbox, not checked' }],
      failure: 'Finding a name means arrowing through rows sorted by internal id.',
    },
    {
      action: 'Pick two people',
      keys: 'Tab, Space, Tab, Space',
      before: [{ kind: 'speech', text: 'Garcia, Riley, selected, 9 of 45' }, { kind: 'speech', text: 'Garcia, Quinn, selected, 10 of 45' }],
      after: [
        { kind: 'speech', text: 'Riley Garcia, Finance, checkbox, checked' },
        { kind: 'speech', text: 'Quinn Garcia, Procurement, checkbox, checked' },
      ],
      failure: 'Without Ctrl, arrowing to the second person silently drops the first.',
      criterion: '2.1.1',
    },
    {
      action: 'Reach the move button',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'greater than, button' }],
      after: [{ kind: 'speech', text: 'Add selected (2), button' }],
      failure: 'The button is a symbol. Its direction and effect are guesswork.',
      criterion: '4.1.2',
    },
    {
      action: 'Move them',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'The two people leave one list and join the other. Nothing is announced.' }],
      after: [{ kind: 'speech', text: 'Added 2 people. 5 people assigned.' }, { kind: 'speech', text: 'Add selected (0), button, unavailable' }],
      failure: 'The move is visible only.',
      criterion: '4.1.3',
    },
  ],
};
