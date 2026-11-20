import JSZip from 'jszip';
import { builtInPatterns } from '../patterns/registry';
import { CATEGORIES } from '../types/pattern';
import type { Pattern } from '../types/pattern';
import { activeFilterCount, EMPTY_FILTERS, filterPatterns, matchesSource } from '../utils/filter';
import { serializePattern, toPatternJson } from '../utils/jsonExporter';
import { buildReadme } from '../utils/readme';
import { patternPath, slugify, uniqueSlug } from '../utils/slug';
import { buildPatternZip, zipEntries } from '../utils/zipBuilder';

const table = builtInPatterns.find((p) => p.slug === 'bulk-actions') as Pattern;

describe('registry', () => {
  it('covers every category with unique ids and slugs', () => {
    expect(new Set(builtInPatterns.map((p) => p.category))).toEqual(new Set(CATEGORIES.map((c) => c.id)));
    expect(new Set(builtInPatterns.map((p) => p.id)).size).toBe(builtInPatterns.length);
    expect(new Set(builtInPatterns.map(patternPath)).size).toBe(builtInPatterns.length);
  });

  it.each(builtInPatterns.map((p) => [p.id, p] as const))('%s ships source, an axe test, an edge case, and full a11y notes', (_, p) => {
    expect(p.code.length).toBeGreaterThan(200);
    expect(p.testCode).toContain('toHaveNoViolations');
    expect(p.testCode).toMatch(/edge case/i);
    expect(p.code).not.toMatch(/TODO|FIXME/);
    const kinds = new Set(p.accessibilityNotes.map((n) => n.kind));
    expect([...kinds].sort()).toEqual(['aria', 'keyboard', 'screen-reader', 'wcag']);
    expect(p.props.length).toBeGreaterThan(0);
  });
});

describe('slug utils', () => {
  it('slugifies titles', () => {
    expect(slugify('Modals & Overlays: Stacked  dialogs!')).toBe('modals-and-overlays-stacked-dialogs');
    expect(slugify('Ünïcode Résumé')).toBe('unicode-resume');
  });

  it('generates unique slugs (edge case)', () => {
    expect(uniqueSlug('Bulk actions', ['bulk-actions', 'bulk-actions-2'])).toBe('bulk-actions-3');
    expect(uniqueSlug('!!!', [])).toBe('pattern');
  });

  it('builds deep-link paths', () => {
    expect(patternPath(table)).toBe('/patterns/data-table/bulk-actions');
  });
});

describe('filters', () => {
  it('treats "Both" patterns as matching either app', () => {
    const both = { ...table, sourceApps: ['Both'] } as Pattern;
    const cobank = { ...table, sourceApps: ['CoBank'] } as Pattern;
    expect(matchesSource(both, 'ISW')).toBe(true);
    expect(matchesSource(cobank, 'ISW')).toBe(false);
    expect(matchesSource(cobank, 'Both')).toBe(false);
  });

  it('combines query, tag, and source', () => {
    expect(filterPatterns(builtInPatterns, { ...EMPTY_FILTERS, query: 'combobox' }).map((p) => p.slug)).toEqual(['typeahead']);
    expect(filterPatterns(builtInPatterns, { ...EMPTY_FILTERS, tag: 'breadcrumbs' }).map((p) => p.slug)).toEqual(['nested-nav']);
    expect(activeFilterCount({ query: ' ', tag: 'x', source: 'ISW' })).toBe(2);
  });
});

describe('exports', () => {
  it('serializes pattern JSON without the component', () => {
    const json = toPatternJson(table, new Date('2026-01-01T00:00:00Z'));
    expect(json).not.toHaveProperty('component');
    expect(json).not.toHaveProperty('beforeComponent');
    expect(json).toMatchObject({ schemaVersion: 2, path: '/patterns/data-table/bulk-actions', hasLiveDemo: true, hasBeforeDemo: true, exportedAt: '2026-01-01T00:00:00.000Z' });
    expect(JSON.parse(serializePattern(table)).code).toBe(table.code);
  });

  it('builds a README with props and accessibility sections', () => {
    const readme = buildReadme(table);
    expect(readme).toContain('# Bulk action table');
    expect(readme).toContain('| `caption` | `string` | Yes |');
    expect(readme).toContain('### Screen reader behavior');
  });

  it('zips component, styles, tests, and README', async () => {
    expect(zipEntries(table).map((e) => e.path)).toEqual([
      'bulk-actions/BulkActionTable.tsx',
      'bulk-actions/BulkActionTable.module.css',
      'bulk-actions/BulkActionTable.test.tsx',
      'bulk-actions/README.md',
    ]);
    const blob = await buildPatternZip(table);
    const zip = await JSZip.loadAsync(blob);
    expect(await zip.file('bulk-actions/BulkActionTable.tsx')?.async('string')).toBe(table.code);
  });

  it('omits the stylesheet when a pattern has none (edge case)', () => {
    const noStyles = { ...table, styles: '', files: { ...table.files, styles: '' } };
    expect(zipEntries(noStyles)).toHaveLength(3);
  });
});
