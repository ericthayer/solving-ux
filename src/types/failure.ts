/**
 * Structured audit failures.
 *
 * Every pattern documents the failures of its "Before" state as data, not prose, so the
 * same record can drive the Before card, the live broken demo, numbered hotspots, a
 * spot-the-failure exercise, and a WCAG / heuristic index.
 *
 * Contract (enforced by src/__tests__/failures.test.tsx for built-in patterns):
 *  - `id` is kebab-case and unique within its pattern. The global key is
 *    `failureKey(pattern.id, failure.id)`, e.g. "data-table.bulk-actions#select-all-scope".
 *  - `refs` names at least one WCAG success criterion or Nielsen heuristic.
 *  - `target` points at the element in the live Before demo that exhibits the failure.
 *    The demo marks it with `{...failureTarget(id)}`, which renders `data-failure="<id>"`.
 *    Targets are present on first render unless `revealedBy` says which interaction
 *    makes them appear (open a dialog, submit a form, and so on).
 */
import type { WcagLevel } from './pattern';

/** Jakob Nielsen's 10 usability heuristics (1994, revised 2020). */
export const HEURISTICS = [
  { id: 'H1', title: 'Visibility of system status' },
  { id: 'H2', title: 'Match between system and the real world' },
  { id: 'H3', title: 'User control and freedom' },
  { id: 'H4', title: 'Consistency and standards' },
  { id: 'H5', title: 'Error prevention' },
  { id: 'H6', title: 'Recognition rather than recall' },
  { id: 'H7', title: 'Flexibility and efficiency of use' },
  { id: 'H8', title: 'Aesthetic and minimalist design' },
  { id: 'H9', title: 'Help users recognize, diagnose, and recover from errors' },
  { id: 'H10', title: 'Help and documentation' },
] as const;

export type HeuristicId = (typeof HEURISTICS)[number]['id'];

/** WCAG 2.2 success criteria referenced by built-in failures. Add entries as patterns need them. */
export const WCAG_CRITERIA = {
  '1.3.1': { title: 'Info and Relationships', level: 'A' },
  '1.4.1': { title: 'Use of Color', level: 'A' },
  '1.4.10': { title: 'Reflow', level: 'AA' },
  '1.4.13': { title: 'Content on Hover or Focus', level: 'AA' },
  '2.1.1': { title: 'Keyboard', level: 'A' },
  '2.1.2': { title: 'No Keyboard Trap', level: 'A' },
  '2.2.1': { title: 'Timing Adjustable', level: 'A' },
  '2.4.3': { title: 'Focus Order', level: 'A' },
  '2.4.6': { title: 'Headings and Labels', level: 'AA' },
  '2.4.8': { title: 'Location', level: 'AAA' },
  '2.4.11': { title: 'Focus Not Obscured (Minimum)', level: 'AA' },
  '3.2.3': { title: 'Consistent Navigation', level: 'AA' },
  '3.3.1': { title: 'Error Identification', level: 'A' },
  '3.3.2': { title: 'Labels or Instructions', level: 'A' },
  '3.3.3': { title: 'Error Suggestion', level: 'AA' },
  '3.3.4': { title: 'Error Prevention (Legal, Financial, Data)', level: 'AA' },
  '3.3.7': { title: 'Redundant Entry', level: 'A' },
  '4.1.2': { title: 'Name, Role, Value', level: 'A' },
  '4.1.3': { title: 'Status Messages', level: 'AA' },
} as const satisfies Record<string, { title: string; level: WcagLevel }>;

export type WcagCriterionId = keyof typeof WCAG_CRITERIA;

export type FailureRef = { kind: 'wcag'; criterion: WcagCriterionId } | { kind: 'heuristic'; id: HeuristicId };

export type FailureTarget = {
  /** Plain-language name of the element, e.g. "Select-all checkbox". */
  label: string;
  /** Interaction that makes the target appear, e.g. "Click Delete contract". Omit when it renders immediately. */
  revealedBy?: string;
};

export type Failure = {
  id: string;
  description: string;
  refs: FailureRef[];
  target: FailureTarget;
};

/** DOM attribute that ties an element in a Before demo to a failure id. */
export const FAILURE_ATTR = 'data-failure';

/** Spread onto the element that exhibits a failure: `<th {...failureTarget('sort-state')}>`. */
export function failureTarget(id: string): { 'data-failure': string } {
  return { [FAILURE_ATTR]: id } as { 'data-failure': string };
}

export function failureKey(patternId: string, failureId: string): string {
  return `${patternId}#${failureId}`;
}

/** Short label for a reference: "WCAG 1.4.1" or "H5". */
export function refLabel(ref: FailureRef): string {
  return ref.kind === 'wcag' ? `WCAG ${ref.criterion}` : ref.id;
}

/** Long label for a reference: "1.4.1 Use of Color (A)" or "H5 Error prevention". */
export function refTitle(ref: FailureRef): string {
  if (ref.kind === 'wcag') {
    const sc = WCAG_CRITERIA[ref.criterion];
    return `${ref.criterion} ${sc.title} (${sc.level})`;
  }
  const h = HEURISTICS.find((x) => x.id === ref.id);
  return `${ref.id} ${h?.title ?? ''}`.trim();
}
