import { useId, useState } from 'react';
import { SidePanel } from './SidePanel';
import { useRecordParam } from './useRecordParam';
import styles from './SidePanel.module.css';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

export type WorkOrder = {
  id: string;
  title: string;
  site: string;
  owner: string;
  status: 'Open' | 'In progress' | 'Done';
  due: string;
};

const TASKS = ['Replace air filters', 'Inspect fire doors', 'Service loading dock lift', 'Repair lobby lighting', 'Calibrate thermostats', 'Clear roof drains'];
const SITES = ['Building A', 'Building B', 'Building C', 'Warehouse 2'];
const OWNERS = ['Avery Chen', 'Jordan Patel', 'Sam Okafor', 'Riley Novak'];

/** 36 deterministic records: enough to scroll, so the demo shows the list keeping its place. */
export const WORK_ORDERS: WorkOrder[] = Array.from({ length: 36 }, (_, i) => ({
  id: `WO-${1040 + i}`,
  title: TASKS[i % TASKS.length] ?? 'Work order',
  site: SITES[i % SITES.length] ?? 'Building A',
  owner: OWNERS[(i * 3) % OWNERS.length] ?? 'Unassigned',
  status: i % 5 === 0 ? 'Done' : i % 3 === 0 ? 'In progress' : 'Open',
  due: `Dec ${String((i % 28) + 1)}, 2026`,
}));

export default function SidePanelDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const headingId = useId();
  const [recordId, setRecordId] = useRecordParam('record');
  const [orders, setOrders] = useState(WORK_ORDERS);
  const [log, setLog] = useState('Open a work order. The list keeps its scroll and selection when you close the panel.');
  // An unknown id in the URL (deleted record, typo) just leaves the panel closed.
  const record = orders.find((o) => o.id === recordId) ?? null;

  const complete = (order: WorkOrder): void => {
    setOrders((all) => all.map((o) => (o.id === order.id ? { ...o, status: 'Done' } : o)));
    setLog(`${order.id} marked done.`);
  };

  const master = (
    <section aria-labelledby={headingId} className={demo.stack}>
      <h3 id={headingId} className={demo.panelTitle}>
        Work orders
      </h3>
      <p className={demo.log}>{orders.length} records</p>
      <ul className={styles.recordList}>
        {orders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              className={styles.recordButton}
              aria-current={o.id === record?.id ? 'true' : undefined}
              onClick={() => setRecordId(o.id)}
            >
              <span className={styles.recordName}>{text(o.title)}</span>
              <span className={styles.recordMeta}>
                {o.id} · {o.site} · {o.status}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className={demo.stack}>
      <SidePanel
        master={master}
        recordKey={record?.id ?? null}
        title={record ? text(record.title) : ''}
        subtitle={record ? `${record.id} · ${record.status}` : undefined}
        headingLevel={3}
        onClose={() => setRecordId(null)}
      >
        {record && (
          <div className={demo.stack}>
            <dl className={styles.fields}>
              <dt>Site</dt>
              <dd>{record.site}</dd>
              <dt>Owner</dt>
              <dd>{record.owner}</dd>
              <dt>Due</dt>
              <dd>{record.due}</dd>
            </dl>
            <p>{text('Scheduled maintenance. Check the previous visit notes before starting.')}</p>
            <div className={demo.row}>
              <button type="button" className={demo.button} disabled={record.status === 'Done'} onClick={() => complete(record)}>
                {record.status === 'Done' ? 'Already done' : 'Mark done'}
              </button>
            </div>
          </div>
        )}
      </SidePanel>
      <p className={demo.log} aria-live="polite">
        {log}
      </p>
    </div>
  );
}
