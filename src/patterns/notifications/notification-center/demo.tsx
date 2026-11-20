import { useState } from 'react';
import { NotificationCenter } from './NotificationCenter';
import type { NotificationItem } from './NotificationCenter';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const hoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString();

const INCOMING = [
  { title: 'Export ready: Q3 vendor spend', body: 'The CSV is available for 7 days.' },
  { title: 'Jordan Lee mentioned you', body: '"Can you confirm the renewal terms by Friday?"' },
  { title: 'Approval needed: PO-7714', body: 'Office equipment, $4,280.00.' },
];

export default function NotificationCenterDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const [log, setLog] = useState('');
  const [next, setNext] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>(() => [
    {
      id: 'n1',
      title: 'Invoice INV-2048 approved',
      body: 'Approved by Finance. Payment runs Thursday.',
      timestamp: hoursAgo(1),
      read: false,
      action: { label: 'View invoice', onClick: () => setLog('Opened INV-2048.') },
    },
    { id: 'n2', title: 'Contract renewal due in 5 days', body: 'Facilities services agreement.', timestamp: hoursAgo(3), read: false },
    { id: 'n3', title: 'Weekly usage report generated', timestamp: hoursAgo(5), read: true },
    {
      id: 'n4',
      title: 'Access request from Sam Patel',
      body: 'Requested the Reporting workspace.',
      timestamp: hoursAgo(27),
      read: false,
      action: { label: 'Review request', onClick: () => setLog('Opened access request.') },
    },
    { id: 'n5', title: 'Password expires in 14 days', timestamp: hoursAgo(52), read: true },
  ]);

  const view = items.map((i) => ({ ...i, title: text(i.title), body: i.body && text(i.body) }));

  return (
    <div className={demo.stackTall}>
      <div className={demo.rowEnd}>
        <button
          type="button"
          className={demo.button}
          onClick={() => {
            const incoming = INCOMING[next % INCOMING.length]!;
            setItems((list) => [{ id: `new-${next}`, ...incoming, timestamp: new Date().toISOString(), read: false }, ...list]);
            setNext((n) => n + 1);
          }}
        >
          Simulate new notification
        </button>
        <NotificationCenter
          items={view}
          onReadChange={(id, read) => setItems((list) => list.map((i) => (i.id === id ? { ...i, read } : i)))}
          onMarkAllRead={() => setItems((list) => list.map((i) => ({ ...i, read: true })))}
        />
      </div>
      <p className={demo.log}>Open the bell, Tab through items, and press Escape to close and return to the bell. {log}</p>
    </div>
  );
}
