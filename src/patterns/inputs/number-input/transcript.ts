import type { ScreenReaderTranscript } from '../../../types/transcript';

export const numberInputTranscript: ScreenReaderTranscript = {
  patternId: 'inputs.number-input',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab to the amount field',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'Amount, edit, dollar underscore underscore underscore comma underscore underscore underscore dot underscore underscore' }],
      after: [{ kind: 'speech', text: 'Amount requested (USD), edit, required, From $1,000.00 to $500,000.00., blank' }],
      failure: 'The currency and range exist only in a placeholder mask, read aloud as a string of underscores.',
      criterion: '3.3.2',
    },
    {
      action: 'Type an amount',
      keys: 'Type "1250"',
      before: [
        { kind: 'speech', text: '1, 2, 5, 0' },
        { kind: 'silence', note: 'The mask has turned the entry into $12.50. Nothing says the digits were read as cents.' },
      ],
      after: [{ kind: 'speech', text: '1, 2, 5, 0' }],
      failure: 'The value the user hears typed is not the value in the field.',
      criterion: '4.1.2',
    },
    {
      action: 'Paste a copied cost center ID',
      keys: 'Ctrl+V',
      before: [{ kind: 'silence', note: 'Paste is cancelled. The field stays empty and nothing explains why.' }],
      after: [{ kind: 'speech', text: '4410-2087' }],
    },
    {
      action: 'Enter a quantity over the limit and leave the field',
      keys: 'Type "25000", Tab',
      before: [{ kind: 'silence', note: 'The value is replaced with 10000. The user is never told a limit exists.' }],
      after: [{ kind: 'speech', text: 'Volume discount (%), edit, Optional. Up to 2 decimal places, from 0% to 100%., blank' }],
      failure: 'An entered value is changed without notice.',
      criterion: '3.3.1',
    },
    {
      action: 'Return to the quantity field',
      keys: 'Shift+Tab',
      before: [{ kind: 'speech', text: 'Quantity, spin button, 10000' }],
      after: [
        { kind: 'speech', text: 'Quantity (units), edit, invalid entry, required, Whole numbers. From 1 to 10,000 units. Enter no more than 10,000 units., 25000' },
      ],
      failure: 'The field reports a value the user did not enter, with no error.',
      criterion: '3.3.1',
    },
  ],
};
