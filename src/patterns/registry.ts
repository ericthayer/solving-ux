import type { Pattern, PatternDefinition } from '../types/pattern';
import { CATEGORIES } from '../types/pattern';
import { catalogPatterns } from './catalog.generated';
import { patternSources } from './sources.generated';

/** Joins a hand-written definition with the source text generated from its folder. */
export function buildPattern(definition: PatternDefinition): Pattern {
  const key = `${definition.category}/${definition.slug}`;
  const source = patternSources[key];
  if (!source) throw new Error(`No generated source for pattern "${key}". Run npm run gen.`);
  return {
    ...definition,
    code: source.component,
    styles: source.styles,
    testCode: source.test,
    files: { component: source.componentFile, styles: source.stylesFile, test: source.testFile },
    status: 'published',
  };
}

const categoryOrder = (p: PatternDefinition): number => CATEGORIES.findIndex((c) => c.id === p.category);

/** Every pattern folder in this build's scope (see scripts/gen-sources.mjs), in category order. */
export const builtInPatterns: Pattern[] = [...catalogPatterns].sort((a, b) => categoryOrder(a) - categoryOrder(b)).map(buildPattern);
