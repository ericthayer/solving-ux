import { useMemo, useState } from 'react';
import { Typeahead } from './Typeahead';
import type { TypeaheadOption } from './Typeahead';
import demo from '../../demo.module.css';
import { LARGE_DATA_COUNT, useStressTest } from '../../stress';

const PREFIXES = ['Cedar', 'North', 'Blue', 'Prairie', 'River', 'Sand', 'High', 'Golden', 'Willow', 'Stone', 'Elk', 'Clear'];
const MIDDLES = ['Ridge', 'Plains', 'Mesa', 'Valley', 'Bend', 'Hill', 'Creek', 'Point', 'Field', 'Lake'];
const SUFFIXES = ['Farms', 'Co-op', 'Dairy', 'Grain', 'Orchards', 'Cattle', 'Ag Supply', 'Ranch'];
const STATES = ['IA', 'NE', 'KS', 'MN', 'ND', 'SD', 'CO', 'WA', 'OR', 'ID'];

const BASE_COUNT = PREFIXES.length * MIDDLES.length * SUFFIXES.length;

/** Builds `count` borrowers. Past the 960 base names, repeats them as numbered units of the same entity. */
function buildBorrowers(count: number, text: (value: string) => string): TypeaheadOption[] {
  const list: TypeaheadOption[] = [];
  for (let i = 0; i < count; i += 1) {
    const n = i + 1;
    const base = i % BASE_COUNT;
    const p = PREFIXES[Math.floor(base / (MIDDLES.length * SUFFIXES.length))] ?? 'Cedar';
    const m = MIDDLES[Math.floor(base / SUFFIXES.length) % MIDDLES.length] ?? 'Ridge';
    const s = SUFFIXES[base % SUFFIXES.length] ?? 'Farms';
    const unit = i >= BASE_COUNT ? ` Unit ${Math.floor(i / BASE_COUNT) + 1}` : '';
    list.push({ id: `B${n}`, label: text(`${p} ${m} ${s}${unit}`), description: `ACCT ${(10000 + n * 37).toString()} · ${STATES[n % STATES.length] ?? 'IA'}` });
  }
  return list;
}

export default function TypeaheadDemo(): JSX.Element {
  const stress = useStressTest(['longText', 'largeData']);
  const borrowers = useMemo(() => buildBorrowers(stress.largeData ? LARGE_DATA_COUNT : BASE_COUNT, stress.text), [stress.largeData, stress.text]);
  const [selected, setSelected] = useState<TypeaheadOption | null>(null);

  return (
    <div className={demo.stack}>
      <Typeahead
        label="Borrower"
        hint={`Search ${borrowers.length.toLocaleString()} borrowers by name or account number.`}
        options={borrowers}
        onSelect={setSelected}
      />
      <p className={demo.log} aria-live="polite">
        {selected ? `Selected ${selected.label} (${selected.description ?? ''}).` : 'Nothing selected.'}
      </p>
    </div>
  );
}
