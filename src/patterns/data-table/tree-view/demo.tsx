import { useId, useMemo, useState } from 'react';
import { TreeView } from './TreeView';
import type { TreeNode } from './TreeView';
import demo from '../../demo.module.css';
import { LARGE_DATA_COUNT, useStressTest } from '../../stress';

const account = (id: string, label: string): TreeNode => ({ id, label });

const baseNodes = (largeData: boolean): TreeNode[] => [
  {
    id: 'north',
    label: 'North region',
    children: [
      {
        id: 'north-ops',
        label: 'Operations',
        children: [account('acct-1001', 'Cedar Supply Co.'), account('acct-1002', 'Harbor Logistics'), account('acct-1003', 'Summit Components')],
      },
      { id: 'north-sales', label: 'Field sales', children: [account('acct-1004', 'Bluefin Packaging'), account('acct-1005', 'Granite Tooling')] },
    ],
  },
  {
    id: 'south',
    label: 'South region',
    children: largeData
      ? Array.from({ length: LARGE_DATA_COUNT }, (_, i) => account(`acct-s${i}`, `Account ${(20000 + i).toString()}`))
      : [account('acct-2001', 'Apex Industrial'), account('acct-2002', 'Northwind Supply'), account('acct-2003', 'Riverbend Foods')],
  },
  // Children of this branch come from the server on first expand.
  { id: 'archived', label: 'Archived accounts', hasChildren: true },
];

const relabel = (list: TreeNode[], t: (value: string) => string): TreeNode[] =>
  list.map((node) => ({ ...node, label: t(node.label), children: node.children && relabel(node.children, t) }));

const ARCHIVED: TreeNode[] = [account('acct-9001', 'Lakeside Mills'), account('acct-9002', 'Prairie Freight'), account('acct-9003', 'Oakridge Textiles')];

/** Simulated network call. The first expand is slow on purpose so the loading state is visible. */
const loadChildren = (node: TreeNode): Promise<TreeNode[]> =>
  new Promise((resolve) => window.setTimeout(() => resolve(node.id === 'archived' ? ARCHIVED : []), 900));

export default function TreeViewDemo(): JSX.Element {
  const stress = useStressTest(['longText', 'largeData']);
  const nodes = useMemo(() => relabel(baseNodes(stress.largeData), stress.text), [stress.largeData, stress.text]);
  const [checkedIds, setCheckedIds] = useState<string[]>(['acct-1004']);
  const summaryId = useId();

  return (
    <div className={demo.split}>
      <TreeView
        label="Account hierarchy"
        nodes={nodes}
        checkable
        defaultExpanded={['north', 'north-sales']}
        defaultChecked={checkedIds}
        loadChildren={loadChildren}
        onCheckedChange={setCheckedIds}
      />
      <section className={demo.panel} aria-labelledby={summaryId}>
        <h3 id={summaryId} className={demo.panelTitle}>
          {checkedIds.length} {checkedIds.length === 1 ? 'account' : 'accounts'} in scope
        </h3>
        <p className={demo.panelText}>
          Tab into the tree, then use the arrow keys. Space checks a branch and everything loaded inside it. Type a letter to jump. Expand Archived accounts to see
          lazy loading.
        </p>
      </section>
    </div>
  );
}
