import type { Pattern } from '../types/pattern';
import { patternPath } from './slug';

export const PATTERN_JSON_SCHEMA_VERSION = 1;

export type PatternJson = Omit<Pattern, 'component'> & {
  schemaVersion: number;
  path: string;
  hasLiveDemo: boolean;
  exportedAt: string;
};

/** Everything except the React component, which cannot be serialized. */
export function toPatternJson(pattern: Pattern, exportedAt: Date = new Date()): PatternJson {
  const { component, ...rest } = pattern;
  return {
    schemaVersion: PATTERN_JSON_SCHEMA_VERSION,
    ...rest,
    path: patternPath(pattern),
    hasLiveDemo: component !== null,
    exportedAt: exportedAt.toISOString(),
  };
}

export function serializePattern(pattern: Pattern, exportedAt?: Date): string {
  return JSON.stringify(toPatternJson(pattern, exportedAt), null, 2);
}
