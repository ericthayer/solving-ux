import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Field = { name: string; label: string; required?: boolean; type?: string; test?: (v: string) => boolean };

const FIELDS: Field[] = [
  { name: 'legalName', label: 'Legal entity name', required: true },
  { name: 'entityType', label: 'Entity type (LLC, Cooperative, Sole proprietor)', required: true },
  { name: 'memberCount', label: 'Number of members (cooperatives only)', type: 'number' },
  { name: 'patronage', label: 'Patronage refund policy (cooperatives only)' },
  { name: 'taxId', label: 'Tax ID (EIN)', required: true, test: (v) => /^\d{2}-\d{7}$/.test(v) },
  { name: 'purpose', label: 'Loan purpose', required: true },
  { name: 'amount', label: 'Requested amount (USD)', required: true, type: 'number', test: (v) => Number(v) >= 10000 },
  { name: 'acreage', label: 'Acreage', type: 'number' },
  { name: 'contactEmail', label: 'Contact email', required: true, type: 'email', test: (v) => /^\S+@\S+\.\S+$/.test(v) },
  { name: 'phone', label: 'Phone', type: 'tel' },
];


export default function WizardFormBefore(): JSX.Element {
  const form = useRef<HTMLFormElement>(null);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const bad = new Set(
      FIELDS.filter((f) => {
        const v = String(data.get(f.name) ?? '').trim();
        return (f.required && !v) || (v !== '' && f.test !== undefined && !f.test(v));
      }).map((f) => f.name),
    );
    setInvalid(bad);
    if (bad.size > 0) {
      setBanner('Please correct the fields in red.');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      // The server rejects the first submit and the page reloads the form empty.
      form.current?.reset();
      setBusy(false);
      setBanner('An error occurred. Please try again.');
    }, 600);
  };

  return (
    <form ref={form} className={s.frame} onSubmit={onSubmit} noValidate {...failureTarget('clears-data')}>
      {banner && (
        <p className={s.error} {...failureTarget('color-only-errors')}>
          {banner}
        </p>
      )}
      {FIELDS.map((f, i) => (
        <div key={f.name} className={s.field} {...(f.name === 'memberCount' ? failureTarget('irrelevant-fields') : {})}>
          <label htmlFor={`before-${f.name}`} className={invalid.has(f.name) ? s.error : undefined}>
            {f.label}
            {f.required && <span {...(i === 0 ? failureTarget('asterisk-only') : {})}> *</span>}
          </label>
          <input id={`before-${f.name}`} name={f.name} type={f.type ?? 'text'} className={invalid.has(f.name) ? s.inputError : s.input} />
        </div>
      ))}
      <div>
        <button type="submit" className={s.btnPrimary} disabled={busy} {...failureTarget('submit-only-validation')}>
          {busy ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </form>
  );
}
