import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */

/** "ATM style" money mask: every keystroke is reformatted from the digits alone. */
const maskMoney = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';
  return `$${(Number(digits) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const maskCostCenter = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
};

export default function NumberInputBefore(): JSX.Element {
  const [amount, setAmount] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [quantity, setQuantity] = useState('12');
  const [discount, setDiscount] = useState('');
  const [saved, setSaved] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <form className={s.frame} onSubmit={onSubmit} noValidate>
      <div className={s.field} {...failureTarget('caret-jump')}>
        <label htmlFor="before-amount">Amount</label>
        <input
          id="before-amount"
          className={s.input}
          placeholder="$___,___.__"
          value={amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(maskMoney(e.target.value))}
          {...failureTarget('placeholder-mask')}
        />
      </div>
      <div className={s.field}>
        <label htmlFor="before-cost-center">Cost center</label>
        <input
          id="before-cost-center"
          className={s.input}
          placeholder="____-____"
          value={costCenter}
          onChange={(e) => setCostCenter(maskCostCenter(e.target.value))}
          onPaste={(e) => e.preventDefault()}
          {...failureTarget('paste-blocked')}
        />
      </div>
      <div className={s.field} {...failureTarget('silent-clamp')}>
        <label htmlFor="before-quantity">Quantity</label>
        <input
          id="before-quantity"
          type="number"
          className={s.input}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => setQuantity((q) => (Number(q) > 10000 ? '10000' : q))}
          {...failureTarget('scroll-changes-value')}
        />
      </div>
      <div className={s.field}>
        <label htmlFor="before-discount">Discount</label>
        <input
          id="before-discount"
          className={s.input}
          value={discount}
          onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ''))}
          {...failureTarget('strips-characters')}
        />
      </div>
      <div>
        <button type="submit" className={s.btnPrimary}>
          Save
        </button>
      </div>
      {saved && <p className={s.muted}>Saved.</p>}
    </form>
  );
}
