import type { Pattern } from '../types/pattern';
import { patternPath } from './slug';

/**
 * v2: beforeState.failures became structured Failure objects (src/types/failure.ts).
 * v3: client attribution (sourceApps) is no longer exported, so a shared file never names where a pattern came from.
 */
export const PATTERN_JSON_SCHEMA_VERSION = 3;

export type PatternJson = Omit<Pattern, 'component' | 'beforeComponent' | 'clients'> & {
  schemaVersion: number;
  path: string;
  hasLiveDemo: boolean;
  hasBeforeDemo: boolean;
  exportedAt: string;
};

/** Everything except the React components, which cannot be serialized, and client attribution. */
export function toPatternJson(pattern: Pattern, exportedAt: Date = new Date()): PatternJson {
  const { component, beforeComponent, clients, ...rest } = pattern;
  return {
    schemaVersion: PATTERN_JSON_SCHEMA_VERSION,
    ...rest,
    path: patternPath(pattern),
    hasLiveDemo: component !== null,
    hasBeforeDemo: beforeComponent !== null,
    exportedAt: exportedAt.toISOString(),
  };
}

export function serializePattern(pattern: Pattern, exportedAt?: Date): string {
  return JSON.stringify(toPatternJson(pattern, exportedAt), null, 2);
}
