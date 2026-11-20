import { AccessibleChart } from './AccessibleChart';
import type { ChartSeries } from './AccessibleChart';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

export const MONTHS = ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'];

export const APPROVAL_SERIES: ChartSeries[] = [
  { id: 'small', label: 'Under $10k', values: [2.1, 2.0, 2.2, 1.9, 2.0, 2.1, 2.0, 2.2, 2.1, 1.9, 2.0, 2.1] },
  { id: 'mid', label: '$10k to $100k', values: [4.0, 4.2, 4.1, 4.4, 4.3, 4.5, 4.6, 4.4, 4.7, 4.8, 4.6, 4.9] },
  { id: 'large', label: 'Over $100k', values: [6.1, 5.8, 6.0, 6.2, 6.4, 6.0, 7.2, 8.1, 8.9, 9.6, 10.4, 11.2] },
];

export const formatDays = (v: number): string => `${v.toFixed(1)} days`;

export default function AccessibleChartDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  return (
    <div className={demo.stack}>
      <AccessibleChart
        title={text('Purchase order approval time')}
        summary={text('Approvals over $100k slowed from about 6 days to 11.2 days since June. Smaller orders held steady.')}
        categories={MONTHS}
        categoryLabel="Month"
        valueLabel="Average days to approve"
        series={APPROVAL_SERIES.map((s) => ({ ...s, label: text(s.label) }))}
        formatValue={formatDays}
      />
    </div>
  );
}
