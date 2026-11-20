import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { CATEGORIES } from '../../types/pattern';
import type { Pattern } from '../../types/pattern';
import { SEVERITIES } from '../../types/worksheet';
import type { FindingDraft } from '../../types/worksheet';
import { validateDraft } from '../../utils/worksheet';
import type { DraftErrors } from '../../utils/worksheet';

export type FindingFormHandle = { focusFirstField: () => void };

type FindingFormProps = {
  /** Values to start from. Change `key` on the component to load a different finding. */
  initial: FindingDraft;
  mode: 'add' | 'edit';
  /** Shown above the fields, e.g. "Editing finding 2 of 5". */
  heading: string;
  patterns: Pick<Pattern, 'id' | 'title'>[];
  onSubmit: (draft: FindingDraft) => void;
  onCancel?: () => void;
};

const control = 'w-full rounded border border-line bg-canvas px-3 text-sm aria-[invalid=true]:border-danger';
const labelCls = 'text-sm font-medium';

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }): JSX.Element {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="m-0 text-xs text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="m-0 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, hint: boolean, error: string | undefined): string | undefined =>
  [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

export const FindingForm = forwardRef<FindingFormHandle, FindingFormProps>(function FindingForm(
  { initial, mode, heading, patterns, onSubmit, onCancel },
  ref,
): JSX.Element {
  const base = useId();
  const id = (name: keyof FindingDraft): string => `${base}-${name}`;
  const [draft, setDraft] = useState<FindingDraft>(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const observationRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({ focusFirstField: () => titleRef.current?.focus() }), []);

  const set = <K extends keyof FindingDraft>(name: K, value: FindingDraft[K]): void => {
    const next = { ...draft, [name]: value };
    setDraft(next);
    // Re-validate live only after the first submit attempt, so errors do not nag while typing.
    if (submitted) setErrors(validateDraft(next));
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    setSubmitted(true);
    if (nextErrors.title) return titleRef.current?.focus();
    if (nextErrors.observation) return observationRef.current?.focus();
    onSubmit(draft);
    if (mode === 'add') {
      // Keep severity, category, and location: consecutive findings usually share a screen.
      setDraft((d) => ({ ...d, title: '', wcag: '', observation: '', recommendation: '', patternId: '' }));
      setSubmitted(false);
      titleRef.current?.focus();
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-labelledby={`${base}-heading`} className="grid gap-4 rounded-md border border-line bg-surface p-4 lg:p-5">
      <h2 id={`${base}-heading`} className="m-0 text-lg font-semibold">
        {heading}
      </h2>
      <p className="m-0 text-xs text-muted">
        Fields marked <span aria-hidden="true">*</span>
        <span className="sr-only">required</span> are required.
      </p>

      <Field id={id('title')} label="Finding *" hint="One line a stakeholder would understand." error={errors.title}>
        <input
          ref={titleRef}
          id={id('title')}
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={describedBy(id('title'), true, errors.title)}
          className={`${control} h-9`}
        />
      </Field>

      <fieldset className="m-0 grid gap-2 border-0 p-0">
        <legend className={`${labelCls} mb-1 p-0`}>Severity</legend>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
          {SEVERITIES.map((s) => (
            <label key={s.id} className="flex cursor-pointer gap-2 rounded border border-line p-2.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-sunken">
              <input
                type="radio"
                name={`${base}-severity`}
                value={s.id}
                checked={draft.severity === s.id}
                onChange={() => set('severity', s.id)}
                aria-describedby={`${base}-sev-${s.id}`}
                className="mt-0.5 shrink-0 self-start accent-[var(--color-ink)]"
              />
              <span className="grid content-start gap-0.5">
                <span className="font-medium">{s.label}</span>
                <span id={`${base}-sev-${s.id}`} className="text-xs text-muted">
                  {s.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        <Field id={id('category')} label="Category">
          <select id={id('category')} value={draft.category} onChange={(e) => set('category', e.target.value as FindingDraft['category'])} className={`${control} h-9`}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
        </Field>
        <Field id={id('location')} label="Where" hint="Screen, URL, or flow step.">
          <input
            id={id('location')}
            value={draft.location}
            onChange={(e) => set('location', e.target.value)}
            aria-describedby={describedBy(id('location'), true, undefined)}
            className={`${control} h-9`}
          />
        </Field>
        <Field id={id('wcag')} label="WCAG criterion" hint="Optional, e.g. 1.4.3 Contrast.">
          <input
            id={id('wcag')}
            value={draft.wcag}
            onChange={(e) => set('wcag', e.target.value)}
            aria-describedby={describedBy(id('wcag'), true, undefined)}
            className={`${control} h-9 font-mono`}
          />
        </Field>
      </div>

      <Field id={id('observation')} label="Observation *" hint="What happened, who it affects, and how you reproduced it." error={errors.observation}>
        <textarea
          ref={observationRef}
          id={id('observation')}
          rows={4}
          value={draft.observation}
          onChange={(e) => set('observation', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(errors.observation)}
          aria-describedby={describedBy(id('observation'), true, errors.observation)}
          className={`${control} py-2 leading-relaxed`}
        />
      </Field>

      <Field id={id('recommendation')} label="Recommendation" hint="The fix you would ship. Markdown is kept as written.">
        <textarea
          id={id('recommendation')}
          rows={3}
          value={draft.recommendation}
          onChange={(e) => set('recommendation', e.target.value)}
          aria-describedby={describedBy(id('recommendation'), true, undefined)}
          className={`${control} py-2 leading-relaxed`}
        />
      </Field>

      <Field id={id('patternId')} label="Solved by pattern" hint="Link a library pattern that fixes this, if one fits.">
        <select
          id={id('patternId')}
          value={draft.patternId}
          onChange={(e) => set('patternId', e.target.value)}
          aria-describedby={describedBy(id('patternId'), true, undefined)}
          className={`${control} h-9`}
        >
          <option value="">None</option>
          {patterns.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
          {mode === 'add' ? 'Add finding' : 'Save changes'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-ink">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
});
