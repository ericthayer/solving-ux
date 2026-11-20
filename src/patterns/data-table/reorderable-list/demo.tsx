import { useState } from 'react';
import { ReorderableList } from './ReorderableList';
import { useStressTest } from '../../stress';
import s from '../../demo.module.css';

type AgendaItem = { id: string; title: string; owner: string; minutes: number };

const AGENDA: AgendaItem[] = [
  { id: 'quarterly-review', title: 'Quarterly review', owner: 'Operations', minutes: 20 },
  { id: 'budget', title: 'Budget check-in', owner: 'Finance', minutes: 15 },
  { id: 'hiring', title: 'Hiring plan', owner: 'People team', minutes: 10 },
  { id: 'vendor-renewals', title: 'Vendor renewals', owner: 'Purchasing', minutes: 10 },
  { id: 'roadmap', title: 'Roadmap update', owner: 'Product', minutes: 15 },
  { id: 'open-questions', title: 'Open questions', owner: 'Everyone', minutes: 5 },
];

export default function ReorderableListDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const initial = (): AgendaItem[] => AGENDA.map((item) => ({ ...item, title: stress.text(item.title) }));
  const [items, setItems] = useState(initial);

  return (
    <div className={s.stack}>
      <ReorderableList<AgendaItem>
        label="Meeting agenda"
        items={items}
        onReorder={setItems}
        itemLabel={(item) => item.title}
        renderItem={(item) => (
          <>
            <strong>{item.title}</strong>
            <span className={s.log}>
              {' '}
              · {item.owner}, {item.minutes} min
            </span>
          </>
        )}
      />
      <div className={s.row}>
        <button type="button" className={s.button} onClick={() => setItems(initial())}>
          Reset order
        </button>
      </div>
    </div>
  );
}
