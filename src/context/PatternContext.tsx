import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { activeClient } from '../appConfig';
import { CLIENT_IDS, isClientId } from '../types/client';
import type { ClientId } from '../types/client';
import type { BeforeState, EditablePatternFields, Pattern } from '../types/pattern';
import { builtInPatterns } from '../patterns/registry';
import { EMPTY_FILTERS, filterPatterns } from '../utils/filter';
import type { PatternFilters } from '../utils/filter';
import { normalizeFailures } from '../utils/failures';
import { uniqueSlug } from '../utils/slug';
import { useEditor } from './EditorContext';

export type NewPatternInput = EditablePatternFields & { code: string; testCode: string; styles: string; componentName: string };

/** Editor changes live in localStorage until a pattern is promoted into src/patterns via PR. */
type StoredState = {
  overrides: Record<string, EditablePatternFields & { lastUpdated: string }>;
  created: Omit<Pattern, 'component' | 'beforeComponent'>[];
};

// Client builds share one origin, so each keeps its own key and never reads another client's edits.
const STORAGE_KEY = activeClient ? `solving-ux:${activeClient}:patterns:v1` : 'solving-ux:patterns:v1';
const EMPTY_STATE: StoredState = { overrides: {}, created: [] };

function load(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    // Failures were plain strings before schema v2; upgrade them in place. Client attribution
    // replaced named source apps; legacy values are dropped so built-in patterns keep their own.
    const upgrade = <T extends { beforeState: BeforeState; clients?: ClientId[] }>(entry: T): T => {
      const { sourceApps: _legacy, ...rest } = entry as T & { sourceApps?: unknown };
      const clients = Array.isArray(rest.clients) ? rest.clients.filter(isClientId) : [];
      return {
        ...(rest as T),
        ...(clients.length > 0 ? { clients } : { clients: undefined }),
        beforeState: { ...entry.beforeState, failures: normalizeFailures(entry.beforeState?.failures) },
      };
    };
    const dropEmpty = <T extends object>(entry: T): T =>
      Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined)) as T;
    const overrides = Object.fromEntries(Object.entries(parsed.overrides ?? {}).map(([id, entry]) => [id, dropEmpty(upgrade(entry))]));
    // A legacy draft with no valid client stays visible to the team build under every client.
    const created = (parsed.created ?? []).map((entry) => {
      const next = upgrade(entry);
      return { ...next, clients: next.clients ?? [...CLIENT_IDS] };
    });
    return { overrides, created };
  } catch {
    return EMPTY_STATE;
  }
}

type PatternContextValue = {
  /** Patterns the current viewer may see: published only, plus drafts in Editor Mode. */
  patterns: Pattern[];
  filtered: Pattern[];
  filters: PatternFilters;
  setFilters: (update: Partial<PatternFilters>) => void;
  resetFilters: () => void;
  getPattern: (category: string, slug: string) => Pattern | undefined;
  getPatternById: (id: string) => Pattern | undefined;
  updatePattern: (id: string, fields: EditablePatternFields) => Pattern;
  createPattern: (input: NewPatternInput) => Pattern;
};

const PatternContext = createContext<PatternContextValue | null>(null);

const today = (): string => new Date().toISOString().slice(0, 10);

export function PatternProvider({ children, seed = builtInPatterns }: { children: ReactNode; seed?: Pattern[] }): JSX.Element {
  const { editorMode } = useEditor();
  const [stored, setStored] = useState<StoredState>(load);
  const [filters, setFilterState] = useState<PatternFilters>(EMPTY_FILTERS);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Quota or privacy mode: edits still apply for this session.
    }
  }, [stored]);

  const all = useMemo((): Pattern[] => {
    const merged = seed.map((p) => {
      const override = stored.overrides[p.id];
      return override ? { ...p, ...override } : p;
    });
    const created = stored.created.map((p): Pattern => ({ ...p, ...stored.overrides[p.id], component: null, beforeComponent: null }));
    const inScope = (p: Pattern): boolean => activeClient === null || p.clients.includes(activeClient);
    return [...merged, ...created].filter(inScope);
  }, [seed, stored]);

  const patterns = useMemo(() => (editorMode ? all : all.filter((p) => p.status === 'published')), [all, editorMode]);
  const filtered = useMemo(() => filterPatterns(patterns, filters), [patterns, filters]);

  const getPattern = useCallback((category: string, slug: string) => patterns.find((p) => p.category === category && p.slug === slug), [patterns]);
  const getPatternById = useCallback((id: string) => all.find((p) => p.id === id), [all]);

  const updatePattern = useCallback(
    (id: string, fields: EditablePatternFields): Pattern => {
      const current = all.find((p) => p.id === id);
      if (!current) throw new Error(`Unknown pattern ${id}`);
      const entry = { ...fields, lastUpdated: today() };
      setStored((s) => ({ ...s, overrides: { ...s.overrides, [id]: entry } }));
      return { ...current, ...entry };
    },
    [all],
  );

  const createPattern = useCallback(
    (input: NewPatternInput): Pattern => {
      const { code, testCode, styles, componentName, ...fields } = input;
      const slug = uniqueSlug(fields.title, all.filter((p) => p.category === fields.category).map((p) => p.slug));
      const created: Omit<Pattern, 'component' | 'beforeComponent'> = {
        ...fields,
        id: `${fields.category}.${slug}`,
        slug,
        code,
        testCode,
        styles,
        files: { component: `${componentName}.tsx`, styles: styles ? `${componentName}.module.css` : '', test: `${componentName}.test.tsx` },
        props: [],
        usage: '',
        accessibilityNotes: [],
        lastUpdated: today(),
      };
      setStored((s) => ({ ...s, created: [...s.created, created] }));
      return { ...created, component: null, beforeComponent: null };
    },
    [all],
  );

  const value = useMemo(
    (): PatternContextValue => ({
      patterns,
      filtered,
      filters,
      setFilters: (update) => setFilterState((f) => ({ ...f, ...update })),
      resetFilters: () => setFilterState(EMPTY_FILTERS),
      getPattern,
      getPatternById,
      updatePattern,
      createPattern,
    }),
    [patterns, filtered, filters, getPattern, getPatternById, updatePattern, createPattern],
  );

  return <PatternContext.Provider value={value}>{children}</PatternContext.Provider>;
}

export function usePatterns(): PatternContextValue {
  const value = useContext(PatternContext);
  if (!value) throw new Error('usePatterns must be used inside <PatternProvider>.');
  return value;
}
