import { useMemo, useState } from 'react';
import { Typeahead } from './Typeahead';
import type { TypeaheadOption } from './Typeahead';
import demo from '../../demo.module.css';
import { LARGE_DATA_COUNT, useStressTest } from '../../stress';

const PREFIXES = ['Cedar', 'North', 'Blue', 'Prairie', 'River', 'Sand', 'High', 'Golden', 'Willow', 'Stone', 'Elk', 'Clear'];
const MIDDLES = ['Ridge', 'Plains', 'Mesa', 'Valley', 'Bend', 'Hill', 'Creek', 'Point', 'Field', 'Lake'];
const SUFFIXES = ['Supply', 'Industrial', 'Logistics', 'Components', 'Packaging', 'Tooling', 'Metals', 'Systems'];
const STATES = ['CA', 'TX', 'NY', 'IL', 'OH', 'GA', 'NC', 'WA', 'MI', 'AZ'];

const BASE_COUNT = PREFIXES.length * MIDDLES.length * SUFFIXES.length;

/** Builds `count` suppliers. Past the 960 base names, repeats them as numbered units of the same entity. */
function buildSuppliers(count: number, text: (value: string) => string): TypeaheadOption[] {
  const list: TypeaheadOption[] = [];
  for (let i = 0; i < count; i += 1) {
    const n = i + 1;
    const base = i % BASE_COUNT;
    const p = PREFIXES[Math.floor(base / (MIDDLES.length * SUFFIXES.length))] ?? 'Cedar';
    const m = MIDDLES[Math.floor(base / SUFFIXES.length) % MIDDLES.length] ?? 'Ridge';
    const s = SUFFIXES[base % SUFFIXES.length] ?? 'Supply';
    const unit = i >= BASE_COUNT ? ` Unit ${Math.floor(i / BASE_COUNT) + 1}` : '';
    list.push({ id: `B${n}`, label: text(`${p} ${m} ${s}${unit}`), description: `ACCT ${(10000 + n * 37).toString()} · ${STATES[n % STATES.length] ?? 'CA'}` });
  }
  return list;
}

export default function TypeaheadDemo(): JSX.Element {
  const stress = useStressTest(['longText', 'largeData']);
  const suppliers = useMemo(() => buildSuppliers(stress.largeData ? LARGE_DATA_COUNT : BASE_COUNT, stress.text), [stress.largeData, stress.text]);
  const [selected, setSelected] = useState<TypeaheadOption | null>(null);

  return (
    <div className={demo.stack}>
      <Typeahead
        label="Supplier"
        hint={`Search ${suppliers.length.toLocaleString()} suppliers by name or account number.`}
        options={suppliers}
        onSelect={setSelected}
      />
      <p className={demo.log} aria-live="polite">
        {selected ? `Selected ${selected.label} (${selected.description ?? ''}).` : 'Nothing selected.'}
      </p>
    </div>
  );
}
