import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatterns } from '../context/PatternContext';
import { useToast } from '../patterns/notifications/toast-stack/ToastStack';
import { CATEGORIES } from '../types/pattern';
import { CLIENT_IDS, CLIENT_LABELS } from '../types/client';
import type { CategoryId, EditablePatternFields, WcagLevel } from '../types/pattern';
import { failuresFromText } from '../utils/failures';
import { patternPath } from '../utils/slug';
import { RequireEditor } from './EditorPage';
import { NotFoundPage } from './NotFoundPage';

type Draft = EditablePatternFields & { tagsText: string; failuresText: string; componentName: string; code: string; testCode: string; styles: string };
type Errors = Partial<Record<keyof Draft, string>>;

const inputClass = 'w-full rounded border border-line bg-surface px-3 py-2 text-sm aria-[invalid=true]:border-danger';

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }): JSX.Element {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {hint && <p id={`${id}-hint`} className="m-0 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="m-0 text-sm font-medium text-danger">{error}</p>}
      {children}
    </div>
  );
}

export function validateDraft(draft: Draft, isNew: boolean): Errors {
  const errors: Errors = {};
  if (!draft.title.trim()) errors.title = 'Enter a title.';
  if (!draft.summary.trim()) errors.summary = 'Enter a one-sentence summary.';
  if (!draft.problemStatement.trim()) errors.problemStatement = 'Describe the problem you observed.';
  if (!draft.designRationale.trim()) errors.designRationale = 'Explain why the solution works.';
  if (draft.clients.length === 0) errors.clients = 'Choose at least one client.';
  if (isNew && !/^[A-Z][A-Za-z0-9]*$/.test(draft.componentName)) errors.componentName = 'Use PascalCase, e.g. FilterChips.';
  if (isNew && !draft.code.trim()) errors.code = 'Paste the component source.';
  if (isNew && !draft.testCode.trim()) errors.testCode = 'Paste the test source.';
  return errors;
}

export function PatternEditorPage(): JSX.Element {
  const { id: rawId } = useParams();
  const id = rawId ? decodeURIComponent(rawId) : undefined;
  const isNew = !id;
  const { getPatternById, updatePattern, createPattern } = usePatterns();
  const { notify } = useToast();
  const navigate = useNavigate();
  const formId = useId();
  const existing = id ? getPatternById(id) : undefined;

  const [draft, setDraft] = useState<Draft>(() => ({
    title: existing?.title ?? '',
    summary: existing?.summary ?? '',
    category: existing?.category ?? 'data-table',
    tags: existing?.tags ?? [],
    tagsText: existing?.tags.join(', ') ?? '',
    problemStatement: existing?.problemStatement ?? '',
    beforeState: existing?.beforeState ?? { summary: '', failures: [] },
    failuresText: existing?.beforeState.failures.map((f) => f.description).join('\n') ?? '',
    designRationale: existing?.designRationale ?? '',
    clients: existing?.clients ?? [],
    wcagLevel: existing?.wcagLevel ?? 'AA',
    author: existing?.author ?? 'Design System Team',
    status: existing?.status ?? 'draft',
    componentName: '',
    code: '',
    testCode: '',
    styles: '',
  }));
  const [errors, setErrors] = useState<Errors>({});

  if (id && !existing) return <RequireEditor><NotFoundPage what="pattern" /></RequireEditor>;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]): void => setDraft((d) => ({ ...d, [key]: value }));
  const fid = (name: string): string => `${formId}-${name}`;
  const a11y = (name: keyof Draft, hint = false) => ({
    id: fid(name),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': [hint ? `${fid(name)}-hint` : '', errors[name] ? `${fid(name)}-error` : ''].filter(Boolean).join(' ') || undefined,
  });

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const found = validateDraft(draft, isNew);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(fid(first))?.focus();
      return;
    }
    const fields: EditablePatternFields = {
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      category: draft.category,
      tags: draft.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      problemStatement: draft.problemStatement.trim(),
      beforeState: { summary: draft.beforeState.summary.trim(), failures: failuresFromText(draft.failuresText, draft.beforeState.failures) },
      designRationale: draft.designRationale.trim(),
      clients: draft.clients,
      wcagLevel: draft.wcagLevel,
      author: draft.author.trim() || 'Design System Team',
      status: draft.status,
    };
    const saved = isNew
      ? createPattern({ ...fields, componentName: draft.componentName, code: draft.code, testCode: draft.testCode, styles: draft.styles })
      : updatePattern(existing?.id ?? '', fields);
    notify({ tone: 'success', title: `${saved.title} ${saved.status === 'published' ? 'published' : 'saved as draft'}` });
    navigate(patternPath(saved));
  };

  const errorCount = Object.keys(errors).length;

  return (
    <RequireEditor>
      <form onSubmit={submit} noValidate className="grid max-w-3xl gap-5" aria-labelledby={`${formId}-heading`}>
        <h1 id={`${formId}-heading`} className="m-0 text-2xl font-semibold">{isNew ? 'New pattern' : `Edit ${existing?.title ?? ''}`}</h1>
        {errorCount > 0 && (
          <p role="alert" className="m-0 rounded border-2 border-danger bg-[var(--sux-danger-soft)] p-3 text-sm font-medium">
            Fix {errorCount === 1 ? '1 field' : `${errorCount} fields`} before saving.
          </p>
        )}
        <Field id={fid('title')} label="Title" error={errors.title}>
          <input {...a11y('title')} className={inputClass} value={draft.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field id={fid('summary')} label="Summary" error={errors.summary} hint="One sentence shown on cards and in search.">
          <input {...a11y('summary', true)} className={inputClass} value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id={fid('category')} label="Category">
            <select {...a11y('category')} className={inputClass} value={draft.category} onChange={(e) => set('category', e.target.value as CategoryId)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field id={fid('wcagLevel')} label="WCAG target">
            <select {...a11y('wcagLevel')} className={inputClass} value={draft.wcagLevel} onChange={(e) => set('wcagLevel', e.target.value as WcagLevel)}>
              {(['A', 'AA', 'AAA'] as const).map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field id={fid('author')} label="Author">
            <input {...a11y('author')} className={inputClass} value={draft.author} onChange={(e) => set('author', e.target.value)} />
          </Field>
        </div>
        <fieldset className="m-0 grid gap-2 border-0 p-0" aria-describedby={errors.clients ? fid('clients-error') : undefined}>
          <legend className="mb-1 p-0 text-sm font-semibold">Observed in</legend>
          {errors.clients && <p id={fid('clients-error')} className="m-0 text-sm font-medium text-danger">{errors.clients}</p>}
          <div className="flex gap-5">
            {CLIENT_IDS.map((client, i) => (
              <label key={client} className="inline-flex items-center gap-2 text-sm">
                <input
                  id={i === 0 ? fid('clients') : undefined}
                  type="checkbox"
                  checked={draft.clients.includes(client)}
                  onChange={(e) => set('clients', e.target.checked ? [...draft.clients, client] : draft.clients.filter((c) => c !== client))}
                />
                {CLIENT_LABELS[client]}
              </label>
            ))}
          </div>
        </fieldset>
        <Field id={fid('tagsText')} label="Tags" hint="Comma separated.">
          <input {...a11y('tagsText', true)} className={inputClass} value={draft.tagsText} onChange={(e) => set('tagsText', e.target.value)} />
        </Field>
        <Field id={fid('problemStatement')} label="Problem statement" error={errors.problemStatement}>
          <textarea {...a11y('problemStatement')} rows={4} className={inputClass} value={draft.problemStatement} onChange={(e) => set('problemStatement', e.target.value)} />
        </Field>
        <Field id={fid('beforeSummary')} label="Before state">
          <input id={fid('beforeSummary')} className={inputClass} value={draft.beforeState.summary} onChange={(e) => set('beforeState', { ...draft.beforeState, summary: e.target.value })} />
        </Field>
        <Field id={fid('failuresText')} label="Observed failures" hint="One per line.">
          <textarea {...a11y('failuresText', true)} rows={4} className={inputClass} value={draft.failuresText} onChange={(e) => set('failuresText', e.target.value)} />
        </Field>
        <Field id={fid('designRationale')} label="Design rationale" error={errors.designRationale}>
          <textarea {...a11y('designRationale')} rows={4} className={inputClass} value={draft.designRationale} onChange={(e) => set('designRationale', e.target.value)} />
        </Field>
        {isNew && (
          <>
            <Field id={fid('componentName')} label="Component name" error={errors.componentName} hint="Used for exported file names.">
              <input {...a11y('componentName', true)} className={`${inputClass} font-mono`} value={draft.componentName} onChange={(e) => set('componentName', e.target.value)} />
            </Field>
            {(['code', 'styles', 'testCode'] as const).map((key) => (
              <Field key={key} id={fid(key)} label={key === 'code' ? 'Component source' : key === 'styles' ? 'CSS Module (optional)' : 'Test source'} error={errors[key]}>
                <textarea {...a11y(key)} rows={8} spellCheck={false} className={`${inputClass} font-mono text-xs`} value={draft[key]} onChange={(e) => set(key, e.target.value)} />
              </Field>
            ))}
          </>
        )}
        <fieldset className="m-0 flex gap-5 border-0 p-0">
          <legend className="mb-1 p-0 text-sm font-semibold">Status</legend>
          {(['draft', 'published'] as const).map((s) => (
            <label key={s} className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="status" checked={draft.status === s} onChange={() => set('status', s)} />
              {s === 'draft' ? 'Draft (editors only)' : 'Published (everyone)'}
            </label>
          ))}
        </fieldset>
        <div className="flex gap-3">
          <button type="submit" className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">Save</button>
          <button type="button" onClick={() => navigate(-1)} className="rounded border border-line px-4 py-2 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </RequireEditor>
  );
}
