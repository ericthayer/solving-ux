import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import styles from './WizardForm.module.css';

export type Values = Record<string, string>;

type FieldBase = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Overrides the default "Enter …" / "Select …" message for an empty required field. */
  requiredMessage?: string;
  /** Return an error message, or null when valid. Runs after the required check. */
  validate?: (value: string, values: Values) => string | null;
  /** Hidden fields are skipped by validation and removed from submitted values. */
  visibleWhen?: (values: Values) => boolean;
};

export type FieldConfig =
  | (FieldBase & { type: 'text' | 'email' | 'tel' | 'number' })
  | (FieldBase & { type: 'select' | 'radio'; options: { value: string; label: string }[] });

export type WizardStep = { id: string; title: string; fields: FieldConfig[] };

export type WizardFormProps = {
  steps: WizardStep[];
  onSubmit: (values: Values) => void | Promise<void>;
  initialValues?: Values;
  submitLabel?: string;
};

type Errors = Record<string, string>;

const isVisible = (field: FieldConfig, values: Values): boolean => field.visibleWhen?.(values) ?? true;

export function validateFields(fields: FieldConfig[], values: Values): Errors {
  const errors: Errors = {};
  for (const field of fields) {
    if (!isVisible(field, values)) continue;
    const value = (values[field.name] ?? '').trim();
    if (field.required && value === '') {
      // Lowercase only the first letter so acronyms survive: "Tax ID (EIN)" -> "Enter tax ID (EIN)."
      const noun = field.label.charAt(0).toLowerCase() + field.label.slice(1);
      const verb = field.type === 'select' || field.type === 'radio' ? 'Select' : 'Enter';
      errors[field.name] = field.requiredMessage ?? `${verb} ${noun}.`;
    }
    else if (value !== '' && field.validate) {
      const message = field.validate(value, values);
      if (message) errors[field.name] = message;
    }
  }
  return errors;
}

export function WizardForm({ steps, onSubmit, initialValues = {}, submitLabel = 'Submit' }: WizardFormProps): JSX.Element {
  const baseId = useId();
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState(0);
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [summary, setSummary] = useState<string[] | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'pending' | 'failed' | 'done'>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const focusHeadingOnStep = useRef(false);
  const isReview = index === steps.length;
  const step = steps[index];
  const fieldId = (name: string): string => `${baseId}-${name}`;

  useEffect(() => {
    if (summary) summaryRef.current?.focus();
  }, [summary]);

  // Focus moves after the new step commits so screen readers announce its heading.
  useEffect(() => {
    if (!focusHeadingOnStep.current) return;
    focusHeadingOnStep.current = false;
    headingRef.current?.focus();
  }, [index]);

  const goTo = (next: number): void => {
    setIndex(next);
    setVisited((v) => Math.max(v, next));
    setSummary(null);
    focusHeadingOnStep.current = true;
  };

  const setValue = (name: string, value: string): void => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (touched.has(name) && step) setErrors(validateFields(step.fields.filter((f) => touched.has(f.name)), next));
  };

  const touch = (name: string): void => {
    const nextTouched = new Set(touched).add(name);
    setTouched(nextTouched);
    if (step) setErrors(validateFields(step.fields.filter((f) => nextTouched.has(f.name)), values));
  };

  const next = (): void => {
    if (!step) return;
    const stepErrors = validateFields(step.fields, values);
    setErrors(stepErrors);
    setTouched(new Set([...touched, ...step.fields.map((f) => f.name)]));
    const names = Object.keys(stepErrors);
    if (names.length > 0) setSummary(names);
    else goTo(index + 1);
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!isReview) return next();
    // Steps can be revisited from the progress list, so re-check everything before sending.
    const invalidStep = steps.findIndex((s) => Object.keys(validateFields(s.fields, values)).length > 0);
    if (invalidStep !== -1) {
      const stepErrors = validateFields(steps[invalidStep]?.fields ?? [], values);
      setIndex(invalidStep);
      setErrors(stepErrors);
      setSummary(Object.keys(stepErrors));
      return;
    }
    const visibleValues: Values = {};
    steps.flatMap((s) => s.fields).forEach((f) => {
      if (isVisible(f, values) && values[f.name] !== undefined) visibleValues[f.name] = values[f.name] ?? '';
    });
    setSubmitState('pending');
    try {
      await onSubmit(visibleValues);
      setSubmitState('done');
    } catch {
      setSubmitState('failed');
    }
  };

  if (submitState === 'done') {
    return (
      <div className={styles.root} role="status">
        <h3 className={styles.heading}>Submitted</h3>
        <p className={styles.hint}>Your information was sent. You can close this page.</p>
      </div>
    );
  }

  const fieldLabel = (name: string): string =>
    steps.flatMap((s) => s.fields).find((f) => f.name === name)?.label ?? name;

  return (
    <form className={styles.root} onSubmit={submit} noValidate aria-labelledby={`${baseId}-heading`}>
      <ol className={styles.progress} aria-label="Progress">
        {[...steps.map((s) => s.title), 'Review'].map((title, i) => (
          <li key={title} aria-current={i === index ? 'step' : undefined} data-complete={i < visited || undefined}>
            {i <= visited && i !== index ? (
              <button type="button" className={styles.stepButton} onClick={() => goTo(i)}>
                {title}
              </button>
            ) : (
              <span>{title}</span>
            )}
          </li>
        ))}
      </ol>

      <h3 id={`${baseId}-heading`} ref={headingRef} tabIndex={-1} className={styles.heading}>
        Step {index + 1} of {steps.length + 1}: {isReview ? 'Review' : step?.title}
      </h3>

      {summary && (
        <div ref={summaryRef} tabIndex={-1} className={styles.errorSummary} aria-labelledby={`${baseId}-summary`}>
          <h4 id={`${baseId}-summary`}>Fix {summary.length === 1 ? '1 problem' : `${summary.length} problems`} to continue</h4>
          <ul>
            {summary.map((name) => (
              <li key={name}>
                <a href={`#${fieldId(name)}`} onClick={(e) => { e.preventDefault(); document.getElementById(fieldId(name))?.focus(); }}>
                  {fieldLabel(name)}: {errors[name]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {submitState === 'failed' && (
        <div role="alert" className={styles.errorSummary}>
          <h4>We could not submit your information</h4>
          <p>Nothing you entered was lost. Check your connection and select {submitLabel} again.</p>
        </div>
      )}

      {isReview ? (
        <div className={styles.review}>
          {steps.map((s, i) => (
            <section key={s.id} aria-labelledby={`${baseId}-review-${s.id}`}>
              <div className={styles.reviewHeader}>
                <h4 id={`${baseId}-review-${s.id}`}>{s.title}</h4>
                <button type="button" className={styles.linkButton} onClick={() => goTo(i)} aria-label={`Edit ${s.title}`}>
                  Edit
                </button>
              </div>
              <dl>
                {s.fields.filter((f) => isVisible(f, values)).map((f) => (
                  <div key={f.name}>
                    <dt>{f.label}</dt>
                    <dd>{(f.type === 'select' || f.type === 'radio' ? f.options.find((o) => o.value === values[f.name])?.label : values[f.name]) || 'Not provided'}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      ) : (
        step?.fields.filter((f) => isVisible(f, values)).map((field) => {
          const id = fieldId(field.name);
          const error = errors[field.name];
          const describedBy = [field.hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
          const common = {
            id,
            name: field.name,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
            onBlur: () => touch(field.name),
          };
          return field.type === 'radio' ? (
            <fieldset key={field.name} className={styles.field} aria-describedby={describedBy}>
              <legend className={styles.label}>{field.label}{field.required ? '' : ' (optional)'}</legend>
              {field.hint && <p id={`${id}-hint`} className={styles.hint}>{field.hint}</p>}
              {error && <p id={`${id}-error`} className={styles.error}>{error}</p>}
              {field.options.map((option, i) => (
                <label key={option.value} className={styles.radio}>
                  <input type="radio" {...common} aria-invalid={undefined} aria-describedby={undefined} id={i === 0 ? id : `${id}-${option.value}`} value={option.value} checked={values[field.name] === option.value} onChange={() => setValue(field.name, option.value)} />
                  {option.label}
                </label>
              ))}
            </fieldset>
          ) : (
            <div key={field.name} className={styles.field}>
              <label htmlFor={id} className={styles.label}>{field.label}{field.required ? '' : ' (optional)'}</label>
              {field.hint && <p id={`${id}-hint`} className={styles.hint}>{field.hint}</p>}
              {error && <p id={`${id}-error`} className={styles.error}>{error}</p>}
              {field.type === 'select' ? (
                <select {...common} className={styles.input} value={values[field.name] ?? ''} onChange={(e) => setValue(field.name, e.target.value)}>
                  <option value="">Choose one</option>
                  {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input {...common} type={field.type} inputMode={field.type === 'number' ? 'numeric' : undefined} className={styles.input} value={values[field.name] ?? ''} onChange={(e) => setValue(field.name, e.target.value)} />
              )}
            </div>
          );
        })
      )}

      <div className={styles.footer}>
        {index > 0 && (
          <button type="button" className={styles.secondary} onClick={() => goTo(index - 1)}>
            Back
          </button>
        )}
        <button type="submit" className={styles.primary} disabled={submitState === 'pending'}>
          {isReview ? (submitState === 'pending' ? 'Submitting…' : submitLabel) : 'Continue'}
        </button>
      </div>
    </form>
  );
}
