import { useCallback, useEffect, useState } from 'react';
import { DashboardGrid, Stat, Widget } from './DashboardGrid';
import type { WidgetState } from './DashboardGrid';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const TOP_SUPPLIERS = ['Summit Components — $182M', 'Apex Industrial — $164M', 'Northwind Supply — $131M', 'Harbor Logistics — $97M', 'Bluefin Packaging — $88M'];

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
  const { text } = useStressTest(['longText']);
  const [spend] = useSimulatedLoad(500);
  const [lateDeliveries] = useSimulatedLoad(1100);
  const [contracts, retryContracts] = useSimulatedLoad(900, true);
  const [suppliers] = useSimulatedLoad(1400);

  return (
    <div className={demo.stack}>
      <DashboardGrid title={text('Supply chain health')}>
        <Widget
          title={text('Committed spend')}
          description={text('As of today')}
          state={spend === 'ready' ? { status: 'ready', content: <Stat label="Total" value="$4.21B" change={{ value: '3.1% vs last quarter', direction: 'up', good: true }} /> } : { status: 'loading' }}
        />
        <Widget
          title={text('Late deliveries (30 days)')}
          description={text('Share of open orders')}
          state={lateDeliveries === 'ready' ? { status: 'ready', content: <Stat label="Rate" value="0.42%" change={{ value: '0.08 pts', direction: 'up', good: false }} /> } : { status: 'loading' }}
        />
        <Widget
          title={text('Contract breaches')}
          description={text('Open, last 90 days')}
          state={
            contracts === 'error'
              ? { status: 'error', message: 'The contracts service timed out.', onRetry: retryContracts }
              : contracts === 'ready'
                ? { status: 'empty', message: text('No open breaches. Nothing needs action.') }
                : { status: 'loading' }
          }
        />
        <Widget
          title={text('Largest suppliers')}
          description={text('Top 5 of 1,284 by spend')}
          span={2}
          viewAll={{ label: 'View all 1,284 suppliers', href: '#suppliers' }}
          state={
            suppliers === 'ready'
              ? { status: 'ready', content: <ol className={demo.log}>{TOP_SUPPLIERS.map((b) => <li key={b}>{text(b)}</li>)}</ol> }
              : { status: 'loading' }
          }
        />
      </DashboardGrid>
    </div>
  );
}
