import { useMemo, useState } from 'react';
import { Typeahead } from './Typeahead';
import type { TypeaheadOption } from './Typeahead';
import demo from '../../demo.module.css';

const PREFIXES = ['Cedar', 'North', 'Blue', 'Prairie', 'River', 'Sand', 'High', 'Golden', 'Willow', 'Stone', 'Elk', 'Clear'];
const MIDDLES = ['Ridge', 'Plains', 'Mesa', 'Valley', 'Bend', 'Hill', 'Creek', 'Point', 'Field', 'Lake'];
const SUFFIXES = ['Farms', 'Co-op', 'Dairy', 'Grain', 'Orchards', 'Cattle', 'Ag Supply', 'Ranch'];
const STATES = ['IA', 'NE', 'KS', 'MN', 'ND', 'SD', 'CO', 'WA', 'OR', 'ID'];

function buildBorrowers(): TypeaheadOption[] {
  const list: TypeaheadOption[] = [];
  let n = 0;
  for (const p of PREFIXES)
    for (const m of MIDDLES)
      for (const s of SUFFIXES) {
        n += 1;
        list.push({ id: `B${n}`, label: `${p} ${m} ${s}`, description: `ACCT ${(10000 + n * 37).toString()} · ${STATES[n % STATES.length] ?? 'IA'}` });
      }
  return list;
}

export default function TypeaheadDemo(): JSX.Element {
  const borrowers = useMemo(buildBorrowers, []);
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
