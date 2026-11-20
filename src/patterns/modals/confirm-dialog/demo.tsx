import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

type Scenario = 'none' | 'archive' | 'delete';

export default function ConfirmDialogDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const [scenario, setScenario] = useState<Scenario>('none');
  const [log, setLog] = useState('No action taken yet.');
  const [attempts, setAttempts] = useState(0);

  return (
    <div className={demo.stack}>
      <div className={demo.row}>
        <button type="button" className={demo.button} onClick={() => setScenario('archive')}>
          {text('Archive relationship')}
        </button>
        <button type="button" className={demo.button} onClick={() => setScenario('delete')}>
          Delete contract CTR-2231
        </button>
      </div>
      <p className={demo.log} aria-live="polite">
        {log}
      </p>

      <ConfirmDialog
        open={scenario === 'archive'}
        title={text('Archive Northwind Supply?')}
        description={<p>{text('Archived relationships are hidden from search and reports. You can restore them from Settings for 90 days.')}</p>}
        confirmLabel={text('Archive')}
        onConfirm={() => setLog('Northwind Supply archived.')}
        onClose={() => setScenario('none')}
      />

      <ConfirmDialog
        open={scenario === 'delete'}
        tone="danger"
        title="Delete contract CTR-2231?"
        description={<p>This cannot be undone. The following will also be removed:</p>}
        consequences={['2 scheduled orders ($1.4M total)', '14 compliance checks', 'All attached documents'].map(text)}
        requireText="FAC-2231"
        confirmLabel={text('Delete contract')}
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 700));
          setAttempts((n) => n + 1);
          // First attempt fails to show in-dialog error recovery.
          if (attempts === 0) throw new Error('The contract has an order in progress. Wait for it to close, then try again.');
          setLog('Contract CTR-2231 deleted.');
        }}
        onClose={() => setScenario('none')}
      />
    </div>
  );
}
