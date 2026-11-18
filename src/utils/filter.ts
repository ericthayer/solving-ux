import type { Pattern, SourceApp } from '../types/pattern';

export type SourceFilter = 'All' | SourceApp;

export type PatternFilters = {
  query: string;
  tag: string;
  source: SourceFilter;
};

export const EMPTY_FILTERS: PatternFilters = { query: '', tag: '', source: 'All' };

/** "Both" on a pattern means it was observed in CoBank and ISW, so it matches either app filter. */
export function matchesSource(pattern: Pattern, source: SourceFilter): boolean {
  if (source === 'All') return true;
  const apps = new Set(pattern.sourceApps);
  const both = apps.has('Both') || (apps.has('CoBank') && apps.has('ISW'));
  if (source === 'Both') return both;
  return both || apps.has(source);
}

export function matchesQuery(pattern: Pattern, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [pattern.title, pattern.summary, pattern.category, pattern.problemStatement, ...pattern.tags].some((field) =>
    field.toLowerCase().includes(q),
  );
}

export function filterPatterns(patterns: Pattern[], filters: PatternFilters): Pattern[] {
  return patterns.filter(
    (p) => matchesSource(p, filters.source) && matchesQuery(p, filters.query) && (!filters.tag || p.tags.includes(filters.tag)),
  );
}

export function activeFilterCount(filters: PatternFilters): number {
  return [filters.query.trim() !== '', filters.tag !== '', filters.source !== 'All'].filter(Boolean).length;
}

export function allTags(patterns: Pattern[]): string[] {
  return [...new Set(patterns.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b));
}
