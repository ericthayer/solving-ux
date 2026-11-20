import { useState } from 'react';
import type { FormEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
type Values = { contact: string; terms: string; notes: string };

const ORDERS: Record<string, Values> = {
  'PO-1042': { contact: 'Sam Rivera', terms: 'Net 30', notes: 'Deliver to dock 2. Call ahead.' },
  'PO-1043': { contact: 'Alex Kim', terms: 'Net 45', notes: '' },
};

export default function EditConflictBefore(): JSX.Element {
  const [server, setServer] = useState(ORDERS);
  const [current, setCurrent] = useState('PO-1042');
  const [draft, setDraft] = useState<Values>(ORDERS['PO-1042']!);
  const [message, setMessage] = useState('');
  const [leaving, setLeaving] = useState(false);

  // Switching orders reloads the form. Whatever was typed is gone, no warning.
  const open = (po: string): void => {
    setCurrent(po);
    setDraft(server[po]!);
    setMessage('');
  };

  const colleague = (): void => {
    setServer((all) => ({ ...all, [current]: { ...all[current]!, terms: 'Net 60' } }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    // No version check: whatever is in this form replaces the server copy.
    setServer((all) => ({ ...all, [current]: draft }));
    setMessage('Record saved.');
  };

  return (
    <form className={s.frame} onSubmit={onSubmit}>
      <div className={s.toolbar}>
        {Object.keys(ORDERS).map((po) => (
          <button key={po} type="button" className={s.btn} onClick={() => open(po)} {...(po === 'PO-1043' ? failureTarget('route-loses-data') : {})}>
            {po}
          </button>
        ))}
        <span className={s.spacer} />
        <button type="button" className={s.btn} onClick={colleague}>
          Colleague saves (other tab)
        </button>
        <button type="button" className={s.btn} onClick={() => setLeaving(true)}>
          Back to orders
        </button>
      </div>
      <strong {...failureTarget('no-dirty-state')}>Edit purchase order {current}</strong>
      {(['contact', 'terms', 'notes'] as const).map((name) => (
        <div key={name} className={s.field}>
          <label htmlFor={`before-${name}`}>{name === 'contact' ? 'Supplier contact' : name === 'terms' ? 'Payment terms' : 'Notes'}</label>
          <input id={`before-${name}`} className={s.input} value={draft[name]} onChange={(e) => setDraft({ ...draft, [name]: e.target.value })} />
        </div>
      ))}
      <div>
        <button type="submit" className={s.btnPrimary} {...failureTarget('silent-overwrite')}>
          Save
        </button>
      </div>
      {message && (
        <p className={s.muted} {...failureTarget('save-not-announced')}>
          {message}
        </p>
      )}
      <p className={s.muted}>Server copy: payment terms {server[current]!.terms}</p>
      {leaving && (
        <div className={s.overlay}>
          <div className={s.dialog} {...failureTarget('nags-when-clean')}>
            <span>Are you sure you want to leave this page? Changes you made may not be saved.</span>
            <div className={s.toolbar}>
              <button type="button" className={s.btnPrimary} onClick={() => setLeaving(false)}>
                OK
              </button>
              <button type="button" className={s.btn} onClick={() => setLeaving(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
