import type { CategoryId } from './pattern';

export const SEVERITIES = [
  { id: 'critical', label: 'Critical', hint: 'Blocks a task, or locks some users out entirely.' },
  { id: 'serious', label: 'Serious', hint: 'Major friction or a WCAG A/AA failure with only a hard workaround.' },
  { id: 'moderate', label: 'Moderate', hint: 'Slows people down or causes recoverable errors.' },
  { id: 'minor', label: 'Minor', hint: 'Polish: inconsistency or noise that does not stop the task.' },
] as const;

export type Severity = (typeof SEVERITIES)[number]['id'];
export type FindingCategory = CategoryId | 'other';

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  category: FindingCategory;
  /** Screen, URL, or flow step where the issue shows up. */
  location: string;
  /** WCAG success criterion, e.g. "1.4.3 Contrast (Minimum)". Optional. */
  wcag: string;
  observation: string;
  recommendation: string;
  /** Id of the library pattern that solves this, or "" for none. */
  patternId: string;
  createdAt: string;
};

export type FindingDraft = Omit<Finding, 'id' | 'createdAt'>;

export type Worksheet = {
  version: 1;
  appName: string;
  auditor: string;
  findings: Finding[];
};

export type WorksheetMeta = Pick<Worksheet, 'appName' | 'auditor'>;

export const EMPTY_DRAFT: FindingDraft = {
  title: '',
  severity: 'serious',
  category: 'other',
  location: '',
  wcag: '',
  observation: '',
  recommendation: '',
  patternId: '',
};

export const EMPTY_WORKSHEET: Worksheet = { version: 1, appName: '', auditor: '', findings: [] };
