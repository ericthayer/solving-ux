import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import demo from '../../demo.module.css';

type Scenario = 'none' | 'archive' | 'delete';

export default function ConfirmDialogDemo(): JSX.Element {
  const [scenario, setScenario] = useState<Scenario>('none');
  const [log, setLog] = useState('No action taken yet.');
  const [attempts, setAttempts] = useState(0);

  return (
    <div className={demo.stack}>
      <div className={demo.row}>
        <button type="button" className={demo.button} onClick={() => setScenario('archive')}>
          Archive relationship
        </button>
        <button type="button" className={demo.button} onClick={() => setScenario('delete')}>
          Delete facility FAC-2231
        </button>
      </div>
      <p className={demo.log} aria-live="polite">
        {log}
      </p>

      <ConfirmDialog
        open={scenario === 'archive'}
        title="Archive Cedar Ridge Farms?"
        description={<p>Archived relationships are hidden from search and reports. You can restore them from Settings for 90 days.</p>}
        confirmLabel="Archive"
        onConfirm={() => setLog('Cedar Ridge Farms archived.')}
        onClose={() => setScenario('none')}
      />

      <ConfirmDialog
        open={scenario === 'delete'}
        tone="danger"
        title="Delete facility FAC-2231?"
        description={<p>This cannot be undone. The following will also be removed:</p>}
        consequences={['2 scheduled draws ($1.4M total)', '14 covenant checks', 'All attached documents']}
        requireText="FAC-2231"
        confirmLabel="Delete facility"
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 700));
          setAttempts((n) => n + 1);
          // First attempt fails to show in-dialog error recovery.
          if (attempts === 0) throw new Error('The facility has a draw in progress. Wait for it to settle, then try again.');
          setLog('Facility FAC-2231 deleted.');
        }}
        onClose={() => setScenario('none')}
      />
    </div>
  );
}
