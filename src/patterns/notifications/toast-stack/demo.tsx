import { useState } from 'react';
import { ToastProvider, useToast } from './ToastStack';
import demo from '../../demo.module.css';

function Controls(): JSX.Element {
  const { notify } = useToast();
  const [count, setCount] = useState(0);
  const [log, setLog] = useState('');

  return (
    <div className={demo.stack}>
      <div className={demo.row}>
        <button type="button" className={demo.button} onClick={() => notify({ tone: 'success', title: 'Draft saved', description: 'Saved to Cedar Ridge Farms renewal.' })}>
          Success
        </button>
        <button type="button" className={demo.button} onClick={() => notify({ tone: 'info', title: 'Export started', description: 'You will get an email when the file is ready.' })}>
          Info
        </button>
        <button type="button" className={demo.button} onClick={() => notify({ tone: 'warning', title: 'Rate lock expires today', description: 'Lock FAC-2231 before 5:00 PM CT.' })}>
          Warning
        </button>
        <button type="button" className={demo.button} onClick={() => notify({ tone: 'error', title: 'Payment file rejected', description: 'Row 18 has an invalid routing number.' })}>
          Error
        </button>
        <button
          type="button"
          className={demo.button}
          onClick={() => notify({ tone: 'success', title: 'Relationship archived', action: { label: 'Undo', onClick: () => setLog('Archive undone.') } })}
        >
          Success with Undo
        </button>
        <button
          type="button"
          className={demo.button}
          onClick={() => {
            for (let i = 1; i <= 6; i += 1) notify({ tone: 'info', title: `Statement ${count + i} generated` });
            setCount((n) => n + 6);
          }}
        >
          Burst of 6
        </button>
      </div>
      <p className={demo.log}>
        Toasts appear in the bottom-right of the window. Press F8 to jump to them, Escape to dismiss the focused one. {log}
      </p>
    </div>
  );
}

export default function ToastStackDemo(): JSX.Element {
  return (
    <ToastProvider maxVisible={3}>
      <Controls />
    </ToastProvider>
  );
}
