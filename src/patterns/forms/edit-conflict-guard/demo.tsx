import { useRef, useState } from 'react';
import { EditConflictForm } from './EditConflictForm';
import type { FieldDef, SaveResult, Values, VersionedRecord } from './EditConflictForm';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const ORDERS: Record<string, VersionedRecord> = {
  'PO-1042': {
    version: 3,
    values: { contact: 'Sam Rivera', delivery: '2026-12-04', terms: 'Net 30', notes: 'Deliver to dock 2. Call ahead.' },
  },
  'PO-1043': {
    version: 1,
    values: { contact: 'Alex Kim', delivery: '2026-12-11', terms: 'Net 45', notes: '' },
  },
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export default function EditConflictDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const fields: FieldDef[] = [
    { name: 'contact', label: text('Supplier contact') },
    { name: 'delivery', label: text('Delivery date') },
    { name: 'terms', label: text('Payment terms') },
    { name: 'notes', label: text('Notes'), multiline: true },
  ];
  // Stand-in for the server: the latest saved copy of each order.
  const server = useRef<Record<string, VersionedRecord>>(JSON.parse(JSON.stringify(ORDERS)) as Record<string, VersionedRecord>);
  const [current, setCurrent] = useState('PO-1042');
  const [loaded, setLoaded] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [log, setLog] = useState('Edit a field, then try another order or simulate a colleague.');

  const save = async (values: Values, baseVersion: number): Promise<SaveResult> => {
    await wait(500);
    const latest = server.current[current]!;
    if (latest.version !== baseVersion) return { status: 'conflict', latest };
    const record = { version: latest.version + 1, values, updatedBy: 'You' };
    server.current[current] = record;
    setLog(`${current} saved as version ${record.version}.`);
    return { status: 'saved', record };
  };

  const colleagueEdit = (): void => {
    const latest = server.current[current]!;
    server.current[current] = {
      version: latest.version + 1,
      updatedBy: 'Jordan Lee',
      values: { ...latest.values, terms: 'Net 60', delivery: '2026-12-09' },
    };
    setLog(`Jordan Lee saved ${current} in another tab: payment terms and delivery date changed.`);
  };

  return (
    <div className={demo.stack}>
      <nav aria-label="Purchase orders" className={demo.row}>
        {Object.keys(ORDERS).map((po) => (
          <button
            key={po}
            type="button"
            className={demo.button}
            aria-current={po === current ? 'page' : undefined}
            onClick={() => po !== current && setPending(po)}
          >
            {po}
          </button>
        ))}
        <button type="button" className={demo.button} onClick={colleagueEdit}>
          {text('Simulate a colleague saving')}
        </button>
      </nav>

      <EditConflictForm
        key={`${current}-${loaded}`}
        title={text(`Purchase order ${current}`)}
        fields={fields}
        record={server.current[current]!}
        onSave={save}
        pendingNavigation={pending}
        onNavigationResolved={(allow) => {
          if (allow && pending) {
            setCurrent(pending);
            setLoaded((n) => n + 1);
            setLog(`Opened ${pending}.`);
          }
          setPending(null);
        }}
      />

      <p className={demo.log} aria-live="polite">
        {log}
      </p>
    </div>
  );
}
