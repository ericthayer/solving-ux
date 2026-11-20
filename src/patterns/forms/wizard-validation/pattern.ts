import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const wizardValidationPattern: PatternDefinition = {
  id: 'forms.wizard-validation',
  slug: 'wizard-validation',
  title: 'Multi-step form with inline validation',
  summary: 'Config-driven wizard with blur-time validation, a focusable error summary, conditional fields, a review step, and submit failure recovery.',
  category: 'forms',
  tags: ['forms', 'wizard', 'validation', 'conditional fields', 'error recovery'],
  clients: ['client-a'],
  problemStatement:
    'Loan applications run 40+ fields on one page, validate only on final submit, and report errors in a red banner at the top that says "Please correct the errors below." Fields that do not apply to the borrower type are still shown and required. A server timeout clears the form, and users re-enter everything.',
  beforeState: {
    summary: 'Single-page application form with submit-time validation.',
    failures: [
      {
        id: 'submit-only-validation',
        description: 'Errors appear only after submit, often 30+ fields above the button.',
        refs: [{ kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '3.3.1' }],
        target: { label: 'Submit application button' },
      },
      {
        id: 'color-only-errors',
        description: 'Error text is red only and not linked to its field (fails 1.4.1 and 3.3.1).',
        refs: [{ kind: 'wcag', criterion: '1.4.1' }, { kind: 'wcag', criterion: '3.3.1' }, { kind: 'wcag', criterion: '3.3.3' }],
        target: { label: 'Error banner and red field labels', revealedBy: 'Submit the form with empty fields' },
      },
      {
        id: 'irrelevant-fields',
        description: 'Cooperative-only fields are shown to every borrower type.',
        refs: [{ kind: 'heuristic', id: 'H8' }, { kind: 'wcag', criterion: '3.3.2' }],
        target: { label: 'Number of members field' },
      },
      {
        id: 'clears-data',
        description: 'A failed submit clears all entered data.',
        refs: [{ kind: 'wcag', criterion: '3.3.7' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: 'Application form' },
      },
      {
        id: 'asterisk-only',
        description: 'Required fields are marked with an asterisk that has no text equivalent.',
        refs: [{ kind: 'wcag', criterion: '3.3.2' }, { kind: 'wcag', criterion: '1.3.1' }],
        target: { label: 'Required-field asterisks' },
      },
    ],
  },
  designRationale:
    'Splitting the form into short steps cuts what users hold in working memory at once. Validation runs when a field loses focus, then re-checks on every keystroke once the field has been touched: no scolding while typing, fast confirmation when fixing. Continue with errors shows a focused summary whose links jump to each field, the GOV.UK pattern with the best evidence base. Optional fields are labelled "(optional)" instead of marking required ones, since most fields are required. Conditional fields are driven by visibleWhen, and hidden values are removed from the payload. Failed submits keep all data and say so.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'steps', type: 'WizardStep[]', required: true, description: 'Ordered steps, each with an id, title, and field configs. A review step is appended automatically.' },
    { name: 'onSubmit', type: '(values: Values) => void | Promise<void>', required: true, description: 'Receives only visible field values. Reject the promise to show the recoverable error state.' },
    { name: 'initialValues', type: 'Record<string, string>', required: false, defaultValue: '{}', description: 'Prefill for returning users or saved drafts.' },
    { name: 'submitLabel', type: 'string', required: false, defaultValue: '"Submit"', description: 'Label for the final button. Name the outcome, e.g. "Submit application".' },
    { name: 'FieldConfig.visibleWhen', type: '(values: Values) => boolean', required: false, description: 'Show the field only when this returns true. Hidden fields skip validation.' },
    { name: 'FieldConfig.requiredMessage', type: 'string', required: false, description: 'Custom message for an empty required field. Defaults to "Enter <label>." or "Select <label>." for choices.' },
    { name: 'FieldConfig.validate', type: '(value: string, values: Values) => string | null', required: false, description: 'Return a message that says how to fix the problem, not just that one exists.' },
  ],
  usage: `<WizardForm
  steps={[{ id: 'borrower', title: 'Borrower', fields: [{ name: 'legalName', label: 'Legal name', type: 'text', required: true }] }]}
  onSubmit={(values) => api.submitApplication(values)}
  submitLabel="Submit application"
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '3.3.1', level: 'A', title: 'Error identification', detail: 'Each invalid field has aria-invalid="true" and its message linked by aria-describedby.' },
    { kind: 'wcag', criterion: '3.3.3', level: 'AA', title: 'Error suggestion', detail: 'Messages state the fix ("Enter the EIN as 2 digits, a hyphen, then 7 digits").' },
    { kind: 'wcag', criterion: '3.3.4', level: 'AA', title: 'Error prevention', detail: 'A review step with Edit links precedes the final submit.' },
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Errors use text, a "!" prefix, and a thick left border, not color alone.' },
    { kind: 'keyboard', keys: 'Enter', action: 'In any text field, continues to the next step (native form submit).' },
    { kind: 'keyboard', keys: 'Tab', action: 'Moves through fields; blur triggers validation for the field just left.' },
    { kind: 'aria', attribute: 'aria-current="step"', detail: 'Marks the current item in the progress list.' },
    { kind: 'aria', attribute: 'tabindex="-1" + focus()', detail: 'Error summary and step heading receive focus programmatically so they are announced.' },
    { kind: 'screen-reader', title: 'Step change', detail: 'Focus moves to the heading: "Step 2 of 4: Request, heading level 3".' },
    { kind: 'screen-reader', title: 'Submit failure', detail: 'role="alert" announces "We could not submit your information. Nothing you entered was lost."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-17',
  author: 'Design System Team',
};
