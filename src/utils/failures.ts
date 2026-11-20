import type { Failure } from '../types/failure';
import { slugify } from './slug';

/**
 * Turns a stored failures value into Failure[]. Accepts the v1 shape (plain strings) that
 * editor overrides saved to localStorage before failures became structured.
 */
export function normalizeFailures(value: unknown): Failure[] {
  if (!Array.isArray(value)) return [];
  const taken: string[] = [];
  return value.flatMap((item): Failure[] => {
    if (typeof item === 'string') {
      const description = item.trim();
      if (!description) return [];
      const id = uniqueId(description, taken);
      taken.push(id);
      return [{ id, description, refs: [], target: { label: '' } }];
    }
    if (item && typeof item === 'object' && 'id' in item && 'description' in item) {
      const failure = item as Failure;
      taken.push(failure.id);
      return [{ ...failure, refs: Array.isArray(failure.refs) ? failure.refs : [], target: failure.target ?? { label: '' } }];
    }
    return [];
  });
}

/**
 * Applies one-description-per-line editor text to an existing failure list. Lines that match an
 * existing description keep its id, refs, and target; new lines get a fresh id and no refs.
 */
export function failuresFromText(text: string, previous: Failure[]): Failure[] {
  const byDescription = new Map(previous.map((f) => [f.description, f]));
  const taken: string[] = [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((description) => {
      const kept = byDescription.get(description);
      const id = kept && !taken.includes(kept.id) ? kept.id : uniqueId(description, taken);
      taken.push(id);
      return kept ? { ...kept, id } : { id, description, refs: [], target: { label: '' } };
    });
}

function uniqueId(description: string, taken: string[]): string {
  const base = slugify(description).split('-').slice(0, 5).join('-') || 'failure';
  let id = base;
  for (let n = 2; taken.includes(id); n += 1) id = `${base}-${n.toString()}`;
  return id;
}
