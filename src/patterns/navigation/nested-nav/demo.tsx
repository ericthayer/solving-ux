import { useMemo, useState } from 'react';
import { NestedNav, findPath } from './NestedNav';
import type { NavItem } from './NestedNav';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const baseItems: NavItem[] = [
  { id: 'overview', label: 'Overview', href: '#overview' },
  {
    id: 'customers',
    label: 'Customers',
    href: '#customers',
    children: [
      { id: 'directory', label: 'Directory', href: '#directory' },
      {
        id: 'relationships',
        label: 'Relationships',
        children: [
          { id: 'hierarchies', label: 'Entity hierarchies', href: '#hierarchies' },
          { id: 'contacts', label: 'Contacts', href: '#contacts' },
          {
            id: 'spend',
            label: 'Spend',
            children: [
              { id: 'by-industry', label: 'By industry', href: '#by-industry' },
              { id: 'by-region', label: 'By region', href: '#by-region' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'receiving',
    label: 'Receiving',
    children: [
      { id: 'payments', label: 'Payments', href: '#payments' },
      { id: 'returns', label: 'Returns', href: '#returns' },
      { id: 'compliance', label: 'Compliance tracking', href: '#compliance' },
    ],
  },
  { id: 'reports', label: 'Reports', href: '#reports' },
];

const relabel = (list: NavItem[], t: (value: string) => string): NavItem[] =>
  list.map((item) => ('children' in item ? { ...item, label: t(item.label), children: relabel(item.children, t) } : { ...item, label: t(item.label) }));

export default function NestedNavDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const items = useMemo(() => relabel(baseItems, stress.text), [stress.text]);
  const [currentId, setCurrentId] = useState('by-region');
  const current = findPath(items, currentId)?.at(-1);

  return (
    <div className={demo.split}>
      <NestedNav label="Workspace" breadcrumbLabel="Workspace breadcrumb" items={items} currentId={currentId} onNavigate={(item) => setCurrentId(item.id)} />
      <section aria-live="polite" className={demo.panel}>
        <h3 className={demo.panelTitle}>{current?.label ?? 'Not found'}</h3>
        <p className={demo.panelText}>
          Page content for the selected route. Narrow the window below 640px to see the menu collapse behind a Menu button.
        </p>
      </section>
    </div>
  );
}
