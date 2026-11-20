import type { ClientId } from '../types/client';
import type { Pattern } from '../types/pattern';

/** Client filter for the unscoped team build. Client builds hide it; every pattern there is already in scope. */
export type SourceFilter = 'All' | ClientId | 'Both';

export type PatternFilters = {
  query: string;
  tag: string;
  source: SourceFilter;
};

export const EMPTY_FILTERS: PatternFilters = { query: '', tag: '', source: 'All' };

/** "Both" matches patterns observed at every client; a single client matches any pattern seen there. */
export function matchesSource(pattern: Pattern, source: SourceFilter): boolean {
  // Client builds have no client filter and no client data; compiled down to `return true`.
  if (!__TEAM_BUILD__ || source === 'All') return true;
  const clients = new Set(pattern.clients);
  if (source === 'Both') return clients.has('client-a') && clients.has('client-b');
  return clients.has(source);
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
