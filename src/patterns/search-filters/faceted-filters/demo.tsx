import { useMemo } from 'react';
import { FacetedFilters, useFacetedFilters } from './FacetedFilters';
import type { Facet } from './FacetedFilters';
import styles from './FacetedFilters.module.css';
import { LARGE_DATA_COUNT, useStressTest } from '../../stress';

type PurchaseOrder = { id: string; title: string; status: string; category: string; team: string };

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
const CATEGORIES = [
  { value: 'office', label: 'Office supplies' },
  { value: 'hardware', label: 'IT hardware' },
  { value: 'software', label: 'Software' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'services', label: 'Professional services' },
];
const TEAMS = [
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
];
const ITEMS = ['Laptop docks', 'Printer toner', 'Desk chairs', 'Annual license renewal', 'Badge readers', 'Audit support', 'Monitors', 'Shelving'];

const BASE_COUNT = 120;
const pick = <T,>(list: T[], n: number): T => list[n % list.length] as T;

const STATUS_MIX = ['pending', 'approved', 'approved', 'draft', 'pending', 'rejected', 'approved'];

/** Deterministic, unevenly spread orders. Facilities never has a draft, so one option shows a count of 0. */
function buildOrders(count: number, text: (value: string) => string): PurchaseOrder[] {
  return Array.from({ length: count }, (_, i) => {
    const h = (Math.imul(i, 2654435761) >>> 0) >>> 8;
    const category = pick(CATEGORIES, h).value;
    const status = pick(STATUS_MIX, h >>> 4);
    return {
      id: `PO-${(24001 + i).toString()}`,
      title: text(`${pick(ITEMS, h >>> 2)} (x${((i % 9) + 1).toString()})`),
      status: category === 'facilities' && status === 'draft' ? 'pending' : status,
      category,
      team: pick(TEAMS, h >>> 9).value,
    };
  });
}

const VISIBLE = 8;

export default function FacetedFiltersDemo(): JSX.Element {
  const stress = useStressTest(['longText', 'largeData']);
  const orders = useMemo(() => buildOrders(stress.largeData ? LARGE_DATA_COUNT : BASE_COUNT, stress.text), [stress.largeData, stress.text]);
  const facets = useMemo<Facet<PurchaseOrder>[]>(() => {
    const labelled = (list: typeof STATUSES) => list.map((o) => ({ ...o, label: stress.text(o.label) }));
    return [
      { id: 'status', label: 'Status', options: labelled(STATUSES), getValue: (o) => o.status },
      { id: 'category', label: 'Category', options: labelled(CATEGORIES), getValue: (o) => o.category },
      { id: 'team', label: 'Requesting team', options: labelled(TEAMS), getValue: (o) => o.team },
    ];
  }, [stress.text]);
  const state = useFacetedFilters(orders, facets, 'f-');
  const labelOf = (facetId: string, value: string): string =>
    facets.find((f) => f.id === facetId)?.options.find((o) => o.value === value)?.label ?? value;

  return (
    <FacetedFilters label="Filter purchase orders" resultsLabel="Purchase orders" noun={['order', 'orders']} state={state}>
      {state.results.length > 0 && (
        <ul className={styles.resultList}>
          {state.results.slice(0, VISIBLE).map((order) => (
            <li key={order.id} className={styles.resultItem}>
              <span>
                {order.id} · {order.title}
              </span>
              <span className={styles.resultMeta}>
                {labelOf('status', order.status)} · {labelOf('category', order.category)} · {labelOf('team', order.team)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {state.results.length > VISIBLE && (
        <p className={styles.resultMeta}>First {VISIBLE} shown. Add a filter to narrow the list.</p>
      )}
    </FacetedFilters>
  );
}
