import { useMemo, useState } from 'react';
import { CommandPalette } from './CommandPalette';
import type { Command } from './CommandPalette';
import demo from '../../demo.module.css';
import { LARGE_DATA_COUNT, useStressTest } from '../../stress';

type Seed = { id: string; label: string; description: string; shortcut?: string };

const SEEDS: Seed[] = [
  { id: 'new-order', label: 'New purchase order', description: 'Create', shortcut: 'n' },
  { id: 'go-orders', label: 'Go to orders', description: 'Navigation', shortcut: 'o' },
  { id: 'go-suppliers', label: 'Go to suppliers', description: 'Navigation', shortcut: 's' },
  { id: 'go-reports', label: 'Go to reports', description: 'Navigation', shortcut: 'r' },
  { id: 'go-invoices', label: 'Go to invoices', description: 'Navigation' },
  { id: 'go-settings', label: 'Go to settings', description: 'Navigation' },
  { id: 'export', label: 'Export current view', description: 'Data', shortcut: 'e' },
  { id: 'density', label: 'Toggle compact rows', description: 'View', shortcut: 'd' },
  { id: 'invite', label: 'Invite a teammate', description: 'Workspace' },
  { id: 'switch', label: 'Switch workspace', description: 'Workspace' },
  { id: 'help', label: 'Open help center', description: 'Help' },
  { id: 'theme', label: 'Change color theme', description: 'View' },
];

const ORDERS = ['PO-4410 · Cedar Ridge Supply', 'PO-4411 · Blue Mesa Tooling', 'PO-4412 · River Bend Metals'];

export default function CommandPaletteDemo(): JSX.Element {
  const stress = useStressTest(['longText', 'largeData']);
  const [log, setLog] = useState('No command run yet.');

  const commands = useMemo<Command[]>(() => {
    const base = SEEDS.map((s) => ({ ...s, label: stress.text(s.label), run: () => setLog(`Ran ${s.label}.`) }));
    if (!stress.largeData) return base;
    // Large workspaces: one "Open" command per record, all searchable from the palette.
    const records = Array.from({ length: LARGE_DATA_COUNT - base.length }, (_, i) => {
      const label = `Open PO-${(5000 + i).toString()}`;
      return { id: `po-${i.toString()}`, label, description: 'Record', run: () => setLog(`Ran ${label}.`) };
    });
    return [...base, ...records];
  }, [stress]);

  return (
    <div className={demo.stack}>
      <CommandPalette commands={commands} scopeLabel="Orders workspace">
        <div className={demo.stack}>
          <div className={demo.row}>
            <label htmlFor="cp-filter">Filter orders</label>
            <input id="cp-filter" type="text" className={demo.button} aria-describedby="cp-filter-hint" />
            <span id="cp-filter-hint" className={demo.log}>
              Letters typed here never run commands.
            </span>
          </div>
          <div className={demo.row} role="group" aria-label="Open purchase orders">
            {ORDERS.map((order) => (
              <button key={order} type="button" className={demo.button}>
                {stress.text(order)}
              </button>
            ))}
          </div>
          <p className={demo.panelText}>Focus an order, then press N, O, S, R, E or D. Press ? for the full list.</p>
        </div>
      </CommandPalette>
      <p className={demo.log} aria-live="polite">
        {log}
      </p>
    </div>
  );
}
