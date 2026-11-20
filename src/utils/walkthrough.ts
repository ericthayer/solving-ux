import type { CodeAnnotation, ResolvedAnnotation, WalkthroughFile } from '../types/walkthrough';

export type WalkthroughSources = Record<WalkthroughFile, string>;
export type ResolveResult = { steps: ResolvedAnnotation[]; errors: string[] };

/** Every 1-based line number whose text contains `needle`, at or after `from`. */
function linesContaining(lines: string[], needle: string, from = 1): number[] {
  const hits: number[] = [];
  for (let i = from - 1; i < lines.length; i += 1) {
    if (lines[i]?.includes(needle)) hits.push(i + 1);
  }
  return hits;
}

/**
 * Turns text anchors into line ranges. Steps whose anchors are missing or ambiguous are
 * dropped from `steps` and described in `errors`, so the UI degrades instead of pointing
 * at the wrong code.
 */
export function resolveWalkthrough(annotations: CodeAnnotation[], sources: WalkthroughSources): ResolveResult {
  const byFile: Record<WalkthroughFile, string[]> = {
    component: sources.component.replace(/\n$/, '').split('\n'),
    styles: sources.styles.replace(/\n$/, '').split('\n'),
  };
  const steps: ResolvedAnnotation[] = [];
  const errors: string[] = [];

  for (const annotation of annotations) {
    const file: WalkthroughFile = annotation.file ?? 'component';
    const lines = byFile[file];
    const starts = linesContaining(lines, annotation.anchor);
    if (starts.length !== 1) {
      errors.push(`${annotation.id}: anchor "${annotation.anchor}" matched ${starts.length} lines in ${file}; it must match exactly 1.`);
      continue;
    }
    const start = starts[0] as number;
    let end = start;
    if (annotation.endAnchor) {
      const ends = linesContaining(lines, annotation.endAnchor, start);
      if (ends.length === 0) {
        errors.push(`${annotation.id}: endAnchor "${annotation.endAnchor}" not found at or after line ${start} in ${file}.`);
        continue;
      }
      end = ends[0] as number;
    }
    steps.push({ ...annotation, file, start, end });
  }
  return { steps, errors };
}

export const lineRangeLabel = (step: Pick<ResolvedAnnotation, 'start' | 'end'>): string =>
  step.start === step.end ? `line ${step.start}` : `lines ${step.start}–${step.end}`;
