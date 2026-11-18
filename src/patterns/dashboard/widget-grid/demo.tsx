import { useCallback, useEffect, useState } from 'react';
import { DashboardGrid, Stat, Widget } from './DashboardGrid';
import type { WidgetState } from './DashboardGrid';
import demo from '../../demo.module.css';

const TOP_BORROWERS = ['Blue Mesa Grain — $182M', 'North Plains Co-op — $164M', 'Cedar Ridge Farms — $131M', 'Halvorsen Dairy — $97M', 'Riverbend Orchards — $88M'];

function useSimulatedLoad(delay: number, failFirst = false): [WidgetState['status'], () => void] {
  const [status, setStatus] = useState<WidgetState['status']>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus('loading');
    const timer = setTimeout(() => setStatus(failFirst && attempt === 0 ? 'error' : 'ready'), delay);
    return () => clearTimeout(timer);
  }, [attempt, delay, failFirst]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return [status, retry];
}

export default function DashboardGridDemo(): JSX.Element {
  const [exposure] = useSimulatedLoad(500);
  const [delinquency] = useSimulatedLoad(1100);
  const [covenants, retryCovenants] = useSimulatedLoad(900, true);
  const [borrowers] = useSimulatedLoad(1400);

  return (
    <div className={demo.stack}>
      <DashboardGrid title="Portfolio health">
        <Widget
          title="Committed exposure"
          description="As of today"
          state={exposure === 'ready' ? { status: 'ready', content: <Stat label="Total" value="$4.21B" change={{ value: '3.1% vs last quarter', direction: 'up', good: true }} /> } : { status: 'loading' }}
        />
        <Widget
          title="30+ day delinquency"
          description="Share of outstanding balance"
          state={delinquency === 'ready' ? { status: 'ready', content: <Stat label="Rate" value="0.42%" change={{ value: '0.08 pts', direction: 'up', good: false }} /> } : { status: 'loading' }}
        />
        <Widget
          title="Covenant breaches"
          description="Open, last 90 days"
          state={
            covenants === 'error'
              ? { status: 'error', message: 'The covenant service timed out.', onRetry: retryCovenants }
              : covenants === 'ready'
                ? { status: 'empty', message: 'No open breaches. Nothing needs action.' }
                : { status: 'loading' }
          }
        />
        <Widget
          title="Largest relationships"
          description="Top 5 of 1,284 by commitment"
          span={2}
          viewAll={{ label: 'View all 1,284 relationships', href: '#relationships' }}
          state={
            borrowers === 'ready'
              ? { status: 'ready', content: <ol className={demo.log}>{TOP_BORROWERS.map((b) => <li key={b}>{b}</li>)}</ol> }
              : { status: 'loading' }
          }
        />
      </DashboardGrid>
    </div>
  );
}
