import { useState } from 'react';
import type { FormEvent } from 'react';
import { NumberInput } from './NumberInput';
import styles from './NumberInput.module.css';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const REGIONS = {
  'en-US': { label: 'United States (USD)', currency: 'USD' },
  'de-DE': { label: 'Germany (EUR)', currency: 'EUR' },
} as const;

type Locale = keyof typeof REGIONS;
type Values = { amount: number | null; quantity: number | null; discount: number | null };

export default function NumberInputDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const [locale, setLocale] = useState<Locale>('en-US');
  const [values, setValues] = useState<Values>({ amount: null, quantity: 12, discount: null });
  const [submitted, setSubmitted] = useState<Values | null>(null);
  const set = (key: keyof Values) => (value: number | null) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = event.currentTarget;
    // checkValidity() fires "invalid" on each bad field, which reveals its inline error.
    if (!form.checkValidity()) {
      form.querySelector<HTMLInputElement>('input:invalid')?.focus();
      setSubmitted(null);
      return;
    }
    setSubmitted(values);
  };

  return (
    <div className={demo.stack}>
      <form className={demo.stack} onSubmit={onSubmit} noValidate aria-label="Purchase request">
        <div className={styles.root}>
          <label htmlFor="number-demo-region" className={styles.label}>
            Number format
          </label>
          <select id="number-demo-region" className={demo.select} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
            {Object.entries(REGIONS).map(([id, r]) => (
              <option key={id} value={id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {/* key remounts the fields so their text is reformatted for the new locale. */}
        <div key={locale} className={demo.stack}>
          <NumberInput
            label={stress.text('Amount requested')}
            name="amount"
            format={{ style: 'currency', currency: REGIONS[locale].currency }}
            locale={locale}
            min={1000}
            max={500000}
            required
            value={values.amount}
            onValueChange={set('amount')}
          />
          <NumberInput
            label={stress.text('Quantity')}
            name="quantity"
            format={{ style: 'integer', unit: 'units' }}
            locale={locale}
            min={1}
            max={10000}
            required
            value={values.quantity}
            onValueChange={set('quantity')}
          />
          <NumberInput
            label={stress.text('Volume discount')}
            name="discount"
            format={{ style: 'percent' }}
            locale={locale}
            min={0}
            max={100}
            hint="Optional. Up to 2 decimal places, from 0% to 100%."
            value={values.discount}
            onValueChange={set('discount')}
          />
        </div>
        <div>
          <button type="submit" className={demo.button}>
            Submit request
          </button>
        </div>
      </form>
      {submitted && (
        <pre className={demo.log} role="status">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      )}
    </div>
  );
}
