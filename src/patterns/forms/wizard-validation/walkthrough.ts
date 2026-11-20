import type { CodeAnnotation } from '../../../types/walkthrough';

export const wizardValidationWalkthrough: CodeAnnotation[] = [
  {
    id: 'visible-when',
    anchor: '/** Hidden fields are skipped by validation and removed from submitted values. */',
    endAnchor: 'visibleWhen?: (values: Values) => boolean;',
    topic: 'resilience',
    title: 'Hidden fields cannot block the form',
    rationale:
      'The audited form showed cooperative-only fields to every borrower type. Here conditional fields are declared in config, and a hidden field is never validated or submitted, so it cannot fail "Continue" with an error the user cannot see.',
    wcag: ['3.3.1'],
  },
  {
    id: 'required-message',
    anchor: '// Lowercase only the first letter so acronyms survive',
    endAnchor: 'errors[field.name] = field.requiredMessage',
    topic: 'semantics',
    title: 'Error text says what to do',
    rationale:
      'Generated messages start with the action ("Enter tax ID (EIN).") instead of "This field is required". Select and radio fields say "Select". Only the first letter is lowercased so acronyms in labels stay readable.',
    wcag: ['3.3.1', '3.3.3'],
  },
  {
    id: 'focus-heading',
    anchor: '// Focus moves after the new step commits so screen readers announce its heading.',
    endAnchor: '}, [index]);',
    topic: 'focus',
    title: 'Focus follows the step change',
    rationale:
      'Without this, focus stays on a Continue button that was just replaced and screen reader users hear nothing. A ref flag means focus only moves when the user changed steps, not on the first render.',
    wcag: ['2.4.3'],
  },
  {
    id: 'validate-on-blur',
    anchor: 'const touch = (name: string): void => {',
    endAnchor: 'if (step) setErrors(validateFields(step.fields.filter((f) => nextTouched.has(f.name)), values));',
    topic: 'state',
    title: 'Errors appear after a field is left, not while typing',
    rationale:
      'A field is validated once the user leaves it, then live on every change after that. Users are not told an email is invalid after typing one letter, but they see the error clear as soon as they fix it.',
    wcag: ['3.3.1'],
  },
  {
    id: 'revalidate-all',
    anchor: '// Steps can be revisited from the progress list, so re-check everything before sending.',
    endAnchor: 'return;',
    topic: 'resilience',
    title: 'Final submit re-checks every step',
    rationale:
      'Users can jump back through the progress list and change answers, which can invalidate earlier steps. Submit finds the first broken step and sends the user there with its error summary, instead of posting bad data.',
    wcag: ['3.3.4'],
  },
  {
    id: 'progress',
    anchor: '<ol className={styles.progress} aria-label="Progress">',
    endAnchor: '</ol>',
    topic: 'semantics',
    title: 'Progress list with aria-current="step"',
    rationale:
      'An ordered list conveys "step 2 of 4" without extra text. Visited steps become buttons so users can go back; unvisited steps are plain text so nobody skips ahead past validation.',
    wcag: ['1.3.1', '2.4.8'],
  },
  {
    id: 'error-summary',
    anchor: '<div ref={summaryRef} tabIndex={-1} className={styles.errorSummary}',
    endAnchor: '{fieldLabel(name)}: {errors[name]}',
    topic: 'focus',
    title: 'Error summary that links to each field',
    rationale:
      'On a failed Continue, focus moves to a summary of every problem. Each entry focuses its field directly, which matters on long steps where the first error is off screen. preventDefault keeps the URL hash clean.',
    wcag: ['3.3.1', '2.4.3'],
  },
  {
    id: 'submit-failure',
    anchor: "{submitState === 'failed' && (",
    endAnchor: 'Nothing you entered was lost.',
    topic: 'announce',
    title: 'Server failure keeps the data',
    rationale:
      'role="alert" announces the failure immediately. The copy says the data is safe and what to do next, because the audited form cleared every field when a submit failed.',
    wcag: ['4.1.3', '3.3.3'],
  },
  {
    id: 'review-step',
    anchor: '<button type="button" className={styles.linkButton} onClick={() => goTo(i)} aria-label={`Edit ${s.title}`}>',
    topic: 'semantics',
    title: 'Review before submit, with named Edit buttons',
    rationale:
      'A review step is the error-prevention check for financial data. Every "Edit" button carries its section in the accessible name, so a screen reader list of buttons is not five identical "Edit" entries.',
    wcag: ['3.3.4', '2.4.6'],
  },
  {
    id: 'field-wiring',
    anchor: "const describedBy = [field.hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;",
    endAnchor: 'onBlur: () => touch(field.name),',
    topic: 'semantics',
    title: 'Hint and error are tied to the input',
    rationale:
      'aria-describedby joins the hint and the error, so both are read when the field gets focus. aria-invalid is only set when there is an error; "false" everywhere adds noise. Shared props keep text, select, and radio fields wired the same way.',
    wcag: ['3.3.1', '3.3.2', '1.3.1'],
  },
  {
    id: 'error-prefix',
    file: 'styles',
    anchor: '.error::before {',
    endAnchor: '}',
    topic: 'styling',
    title: 'Errors are not red text alone',
    rationale:
      'A "!" prefix and heavier weight mark errors for users who cannot tell red from body text. Some screen readers read the generated "!"; that is harmless because the message text carries the meaning.',
    wcag: ['1.4.1'],
  },
];
