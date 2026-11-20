import type { ComponentType } from 'react';
import type { ClientId } from './client';
import type { Failure } from './failure';

export const CATEGORIES = [
  { id: 'data-table', label: 'Data Tables' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'forms', label: 'Forms' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'dashboard', label: 'Dashboards' },
  { id: 'modals', label: 'Modals & Overlays' },
  { id: 'empty-states', label: 'Empty States' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'search-filters', label: 'Search & Filters' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export type WcagLevel = 'A' | 'AA' | 'AAA';

export type AccessibilityNote =
  | { kind: 'wcag'; criterion: string; level: WcagLevel; title: string; detail: string }
  | { kind: 'keyboard'; keys: string; action: string }
  | { kind: 'aria'; attribute: string; detail: string }
  | { kind: 'screen-reader'; title: string; detail: string };

export type PropDoc = {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
};

/** The audited "before" state. Failures are structured; see src/types/failure.ts. */
export type BeforeState = {
  summary: string;
  failures: Failure[];
};

/** Raw source text for a pattern, produced by scripts/gen-sources.mjs. */
export type PatternSource = {
  componentFile: string;
  component: string;
  stylesFile: string;
  styles: string;
  testFile: string;
  test: string;
};

export type PatternStatus = 'published' | 'draft';

export type Pattern = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: CategoryId;
  tags: string[];
  problemStatement: string;
  beforeState: BeforeState;
  designRationale: string;
  /** Opaque client ids where this failure was observed. Drives per-client builds; never shown in a client build. */
  clients: ClientId[];
  /** Live demo. Editor-created drafts have no component until registered in code. */
  component: ComponentType | null;
  /** Deliberately broken reproduction of beforeState. Marks each failure with data-failure. */
  beforeComponent: ComponentType | null;
  code: string;
  styles: string;
  testCode: string;
  files: { component: string; styles: string; test: string };
  props: PropDoc[];
  usage: string;
  accessibilityNotes: AccessibilityNote[];
  wcagLevel: WcagLevel;
  lastUpdated: string;
  author: string;
  status: PatternStatus;
};

/** Fields an editor can change without touching code. */
export type EditablePatternFields = Pick<
  Pattern,
  | 'title'
  | 'summary'
  | 'category'
  | 'tags'
  | 'problemStatement'
  | 'designRationale'
  | 'clients'
  | 'wcagLevel'
  | 'author'
  | 'status'
> & { beforeState: BeforeState };

/** A pattern definition as written in each pattern folder's pattern.ts. */
export type PatternDefinition = Omit<Pattern, 'code' | 'styles' | 'testCode' | 'files' | 'status'>;
