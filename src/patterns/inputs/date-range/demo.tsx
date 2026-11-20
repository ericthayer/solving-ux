import { useState } from 'react';
import { DateRangeInput, addDays } from './DateRangeInput';
import type { DateRange } from './DateRangeInput';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const pad = (n: number): string => String(n).padStart(2, '0');
const now = new Date();
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export default function DateRangeInputDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const [report, setReport] = useState<DateRange | null>(null);
  const [delivery, setDelivery] = useState<DateRange | null>(null);

  return (
    <div className={demo.stack}>
      <DateRangeInput
        legend={stress.text('Order date')}
        labels={{ start: stress.text('From'), end: stress.text('To') }}
        defaultValue={{ start: addDays(today, -29), end: today }}
        max={today}
        maxDays={366}
        today={today}
        timeZoneNote={stress.text('Dates use Coordinated Universal Time (UTC). Each range runs from 00:00 on the first day to 23:59 on the last.')}
        onChange={setReport}
      />
      <DateRangeInput
        mode="single"
        legend={stress.text('Requested delivery date')}
        min={addDays(today, 2)}
        required
        today={today}
        timeZoneNote={stress.text('Deliveries arrive between 08:00 and 17:00 local time at the receiving dock.')}
        onChange={setDelivery}
      />
      <pre className={demo.log}>{JSON.stringify({ orderDate: report, deliveryDate: delivery?.start ?? null }, null, 2)}</pre>
    </div>
  );
}
