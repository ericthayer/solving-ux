import type { ScreenReaderTranscript } from '../../../types/transcript';

export const wizardValidationTranscript: ScreenReaderTranscript = {
  patternId: 'forms.wizard-validation',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab to the first field',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'Legal entity name star, edit, blank' }],
      after: [{ kind: 'speech', text: 'Legal entity name, edit, required, As it appears on your tax filings., blank' }],
      failure: 'Required is conveyed by a literal asterisk read as "star", and the hint is not associated.',
      criterion: '3.3.2',
    },
    {
      action: 'Enter an invalid EIN and leave the field',
      keys: 'Type "123456", Tab',
      before: [{ kind: 'silence', note: 'Validation waits for submit, 30 fields later.' }],
      after: [
        { kind: 'speech', text: 'Tax ID (EIN), edit, invalid entry, required, Enter the EIN as 2 digits, a hyphen, then 7 digits.' },
      ],
    },
    {
      action: 'Submit the form with errors',
      keys: 'Enter',
      before: [
        { kind: 'silence', note: 'The page reloads at the top. Red text appears beside fields far below, linked to nothing.' },
      ],
      after: [
        { kind: 'speech', text: 'Fix 2 problems to continue, heading level 4' },
        { kind: 'speech', text: 'list, 2 items, Tax ID (EIN), link' },
      ],
      failure: 'The user is not told submission failed, how many errors exist, or where they are.',
      criterion: '3.3.1',
    },
    {
      action: 'Fix errors and continue to the next step',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'Single page form. No steps, so no sense of progress.' }],
      after: [{ kind: 'speech', text: 'Step 2 of 4: Request, heading level 3' }],
    },
    {
      action: 'Final submit fails on the server',
      keys: 'Enter on "Submit application"',
      before: [
        { kind: 'speech', text: 'Legal entity name star, edit, blank' },
        { kind: 'silence', note: 'All entered data is cleared and no error is read.' },
      ],
      after: [
        { kind: 'speech', text: 'alert, We could not submit your information. Nothing you entered was lost.' },
      ],
      failure: 'Silent data loss. The user only discovers it by re-reading empty fields.',
      criterion: '3.3.4',
    },
  ],
};
