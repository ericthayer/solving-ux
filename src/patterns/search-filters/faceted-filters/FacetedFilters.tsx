import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import styles from './FacetedFilters.module.css';

export type FacetOption = { value: string; label: string };

export type Facet<T> = {
  id: string;
  label: string;
  options: FacetOption[];
  getValue: (item: T) => string;
};

/** Selected values per facet id. Values OR within a facet; facets AND together. */
export type Selection = Record<string, string[]>;

export type FacetCounts = Record<string, Record<string, number>>;

/** True when the item passes every facet except `skip`. */
export function matchesSelection<T>(item: T, facets: Facet<T>[], selection: Selection, skip?: string): boolean {
  return facets.every((facet) => {
    if (facet.id === skip) return true;
    const picked = selection[facet.id];
    return !picked || picked.length === 0 || picked.includes(facet.getValue(item));
  });
}

/** Count for each option as if it were checked next: other facets apply, its own facet does not. */
export function facetCounts<T>(items: T[], facets: Facet<T>[], selection: Selection): FacetCounts {
  const counts: FacetCounts = {};
  for (const facet of facets) {
    const tally: Record<string, number> = {};
    for (const option of facet.options) tally[option.value] = 0;
    for (const item of items) {
      if (!matchesSelection(item, facets, selection, facet.id)) continue;
      const value = facet.getValue(item);
      if (value in tally) tally[value] = (tally[value] ?? 0) + 1;
    }
    counts[facet.id] = tally;
  }
  return counts;
}

type FacetShape = { id: string; options: FacetOption[] };

/** Reads `?<prefix><facetId>=a,b` params. Unknown facets and values are dropped, so stale links cannot break the view. */
export function parseSelection(search: string, facets: FacetShape[], prefix: string): Selection {
  const params = new URLSearchParams(search);
  const selection: Selection = {};
  for (const facet of facets) {
    const known = new Set(facet.options.map((o) => o.value));
    const values = (params.get(`${prefix}${facet.id}`) ?? '').split(',').filter((v) => known.has(v));
    if (values.length) selection[facet.id] = [...new Set(values)];
  }
  return selection;
}

/** Writes the selection into `params`, removing params for facets with nothing selected. */
export function writeSelection(params: URLSearchParams, facets: FacetShape[], selection: Selection, prefix: string): void {
  for (const facet of facets) {
    const values = selection[facet.id] ?? [];
    if (values.length) params.set(`${prefix}${facet.id}`, values.join(','));
    else params.delete(`${prefix}${facet.id}`);
  }
}

export type FacetedFilterState<T> = {
  facets: Facet<T>[];
  selection: Selection;
  results: T[];
  total: number;
  counts: FacetCounts;
  setChecked: (facetId: string, value: string, checked: boolean) => void;
  clear: () => void;
};

/** Filtering state for FacetedFilters. Pass a stable (memoized) facets array. */
export function useFacetedFilters<T>(items: T[], facets: Facet<T>[], urlPrefix?: string): FacetedFilterState<T> {
  const [selection, setSelection] = useState<Selection>(() =>
    urlPrefix && typeof window !== 'undefined' ? parseSelection(window.location.search, facets, urlPrefix) : {},
  );

  // replaceState, not pushState: filtering is not navigation, so Back still leaves the page.
  useEffect(() => {
    if (!urlPrefix) return;
    const url = new URL(window.location.href);
    writeSelection(url.searchParams, facets, selection, urlPrefix);
    window.history.replaceState(window.history.state, '', url);
  }, [facets, selection, urlPrefix]);

  const results = useMemo(() => items.filter((item) => matchesSelection(item, facets, selection)), [items, facets, selection]);
  const counts = useMemo(() => facetCounts(items, facets, selection), [items, facets, selection]);

  const setChecked = useCallback((facetId: string, value: string, checked: boolean): void => {
    setSelection((prev) => {
      const current = prev[facetId] ?? [];
      const next = checked ? [...current.filter((v) => v !== value), value] : current.filter((v) => v !== value);
      return { ...prev, [facetId]: next };
    });
  }, []);

  const clear = useCallback((): void => setSelection({}), []);

  return { facets, selection, results, total: items.length, counts, setChecked, clear };
}

export type FacetedFiltersProps<T> = {
  /** Names the filter form, e.g. "Filter purchase orders". */
  label: string;
  /** Names the results region, e.g. "Purchase orders". */
  resultsLabel: string;
  /** Result noun, singular and plural: ['order', 'orders']. */
  noun: [string, string];
  state: FacetedFilterState<T>;
  /** The filtered results, rendered by the caller from state.results. */
  children: ReactNode;
};

type Chip = { key: string; facetId: string; value: string; text: string };

export function FacetedFilters<T>({ label, resultsLabel, noun, state, children }: FacetedFiltersProps<T>): JSX.Element {
  const id = useId();
  const { facets, selection, results, total, counts, setChecked, clear } = state;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);

  const chips: Chip[] = facets.flatMap((facet) =>
    (selection[facet.id] ?? []).flatMap((value) => {
      const option = facet.options.find((o) => o.value === value);
      return option ? [{ key: `${facet.id}:${value}`, facetId: facet.id, value, text: `${facet.label}: ${option.label}` }] : [];
    }),
  );

  // Removing a chip unmounts the focused button. Move focus to its neighbor, or to the results when none remain.
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    const chip = chipRefs.current.get(target);
    if (chip) chip.focus();
    else resultsRef.current?.focus();
  });

  const removeChip = (index: number): void => {
    const chip = chips[index];
    if (!chip) return;
    const neighbor = chips[index + 1] ?? chips[index - 1];
    pendingFocus.current = neighbor?.key ?? '';
    setChecked(chip.facetId, chip.value, false);
  };

  const clearAll = (): void => {
    pendingFocus.current = '';
    clear();
  };

  const count = (n: number): string => `${n.toLocaleString()} ${n === 1 ? noun[0] : noun[1]}`;
  const status =
    results.length === 0
      ? `No ${noun[1]} match these filters. Remove a filter to see more.`
      : chips.length === 0
        ? `Showing all ${count(results.length)}.`
        : `Showing ${results.length.toLocaleString()} of ${count(total)}.`;

  const showResults = (): void => {
    setDrawerOpen(false);
    resultsRef.current?.focus();
  };

  // Escape closes the narrow-layout drawer, but only when the toggle is visible to receive focus back.
  const onPanelKeyDown = (event: KeyboardEvent<HTMLFormElement>): void => {
    const toggle = toggleRef.current;
    if (event.key !== 'Escape' || !drawerOpen || !toggle || getComputedStyle(toggle).display === 'none') return;
    setDrawerOpen(false);
    toggle.focus();
  };

  return (
    <div className={styles.root}>
      <div className={styles.layout} data-drawer-open={drawerOpen || undefined}>
        <button
          ref={toggleRef}
          type="button"
          className={styles.drawerToggle}
          aria-expanded={drawerOpen}
          aria-controls={`${id}-panel`}
          onClick={() => setDrawerOpen((open) => !open)}
        >
          Filters{chips.length > 0 ? ` (${chips.length.toString()} applied)` : ''}
        </button>

        <form id={`${id}-panel`} aria-label={label} className={styles.panel} onSubmit={(e) => e.preventDefault()} onKeyDown={onPanelKeyDown}>
          {facets.map((facet) => (
            <fieldset key={facet.id} className={styles.group}>
              <legend className={styles.legend}>{facet.label}</legend>
              {facet.options.map((option) => {
                const inputId = `${id}-${facet.id}-${option.value}`;
                const n = counts[facet.id]?.[option.value] ?? 0;
                return (
                  <div key={option.value} className={styles.option}>
                    <input
                      id={inputId}
                      type="checkbox"
                      className={styles.checkbox}
                      checked={(selection[facet.id] ?? []).includes(option.value)}
                      onChange={(event) => setChecked(facet.id, option.value, event.target.checked)}
                    />
                    <label htmlFor={inputId} className={styles.optionLabel} data-empty={n === 0 || undefined}>
                      <span className={styles.optionText}>{option.label}</span>
                      <span className={styles.count}>
                        {n.toLocaleString()}
                        <span className={styles.srOnly}> {n === 1 ? 'result' : 'results'}</span>
                      </span>
                    </label>
                  </div>
                );
              })}
            </fieldset>
          ))}
          <button type="button" className={styles.showResults} onClick={showResults}>
            Show {count(results.length)}
          </button>
        </form>

        <section ref={resultsRef} tabIndex={-1} aria-label={resultsLabel} className={styles.results}>
          {chips.length > 0 && (
            <div className={styles.applied}>
              <p id={`${id}-applied`} className={styles.appliedLabel}>
                Applied filters
              </p>
              <ul aria-labelledby={`${id}-applied`} className={styles.chips}>
                {chips.map((chip, index) => (
                  <li key={chip.key}>
                    <button
                      ref={(el) => {
                        if (el) chipRefs.current.set(chip.key, el);
                        else chipRefs.current.delete(chip.key);
                      }}
                      type="button"
                      className={styles.chip}
                      aria-label={`Remove filter ${chip.text}`}
                      onClick={() => removeChip(index)}
                    >
                      <span className={styles.chipText}>{chip.text}</span>
                      <svg className={styles.chipIcon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className={styles.clearAll} onClick={clearAll}>
                Clear all filters
              </button>
            </div>
          )}
          <p role="status" className={styles.status}>
            {status}
          </p>
          {children}
        </section>
      </div>
    </div>
  );
}
