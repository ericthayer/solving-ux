import { EMPTY_DRAFT } from '../types/worksheet';
import type { Finding, Worksheet } from '../types/worksheet';
import { markdownFilename, parseWorksheet, sortFindings, validateDraft, worksheetToMarkdown } from '../utils/worksheet';

const finding = (over: Partial<Finding>): Finding => ({
  ...EMPTY_DRAFT,
  id: over.id ?? 'f1',
  title: 'Untitled',
  observation: 'Saw it.',
  createdAt: '2026-11-20T00:00:00.000Z',
  ...over,
});

const patterns = [{ id: 'forms.wizard-validation', title: 'Multi-step form', category: 'forms' as const, slug: 'wizard-validation' }];
const opts = { patterns, baseUrl: 'https://example.test/', date: '2026-11-20' };

describe('worksheet utils', () => {
  it('sorts most severe first and keeps logging order for ties', () => {
    const sorted = sortFindings([
      finding({ id: 'a', severity: 'minor' }),
      finding({ id: 'b', severity: 'critical' }),
      finding({ id: 'c', severity: 'minor' }),
      finding({ id: 'd', severity: 'serious' }),
    ]);
    expect(sorted.map((f) => f.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('requires a title and an observation', () => {
    expect(validateDraft({ ...EMPTY_DRAFT, title: '  ' })).toEqual({
      title: expect.any(String),
      observation: expect.any(String),
    });
    expect(validateDraft({ ...EMPTY_DRAFT, title: 'x', observation: 'y' })).toEqual({});
  });

  it('exports a summary table, ordered findings, and absolute pattern links', () => {
    const sheet: Worksheet = {
      version: 1,
      appName: 'Supplier portal',
      auditor: 'Sam',
      findings: [
        finding({ id: 'a', title: 'Tiny hint text', severity: 'minor', category: 'forms' }),
        finding({
          id: 'b',
          title: 'Wizard loses data',
          severity: 'critical',
          category: 'forms',
          location: 'Apply > Step 2',
          wcag: '3.3.1',
          recommendation: 'Keep values on back.',
          patternId: 'forms.wizard-validation',
        }),
      ],
    };
    const md = worksheetToMarkdown(sheet, opts);
    expect(md).toContain('# UX audit: Supplier portal');
    expect(md).toContain('- **Findings:** 2 (1 critical, 1 minor)');
    expect(md).toContain('| 1 | Wizard loses data | Critical | Forms | 3.3.1 |');
    expect(md).toContain('| 2 | Tiny hint text | Minor | Forms | — |');
    expect(md.indexOf('### 1. Wizard loses data')).toBeLessThan(md.indexOf('### 2. Tiny hint text'));
    expect(md).toContain('- **Solved by:** [Multi-step form](https://example.test/patterns/forms/wizard-validation)');
    expect(md).toContain('**Recommendation**\n\nKeep values on back.');
  });

  it('keeps user text from breaking table rows and headings (edge case)', () => {
    const md = worksheetToMarkdown(
      { version: 1, appName: 'A\nB', auditor: '', findings: [finding({ title: 'Pipe | and\nnewline', wcag: '1.4.3 | 1.4.11' })] },
      opts,
    );
    expect(md).toContain('# UX audit: A B');
    expect(md).toContain('| 1 | Pipe \\| and newline | Serious | Other | 1.4.3 \\| 1.4.11 |');
    expect(md).toContain('### 1. Pipe | and newline');
    expect(md).not.toContain('Auditor');
  });

  it('exports an explicit empty state with no findings (edge case)', () => {
    const md = worksheetToMarkdown({ version: 1, appName: '', auditor: '', findings: [] }, opts);
    expect(md).toContain('# UX audit: Untitled app');
    expect(md).toContain('_No findings logged yet._');
    expect(md).not.toContain('## Summary');
  });

  it('recovers from corrupt or foreign storage (edge case)', () => {
    expect(parseWorksheet('{not json').findings).toEqual([]);
    expect(parseWorksheet('"a string"').findings).toEqual([]);
    const parsed = parseWorksheet(JSON.stringify({ appName: 'X', findings: [{ id: 'a', title: 'Ok', severity: 'bogus' }, { title: 'no id' }, null] }));
    expect(parsed.appName).toBe('X');
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0]?.severity).toBe('moderate');
  });

  it('builds a safe filename', () => {
    expect(markdownFilename('Acme / Supplier Portal!', '2026-11-20')).toBe('ux-audit-acme-supplier-portal-2026-11-20.md');
    expect(markdownFilename('', '2026-11-20')).toBe('ux-audit-app-2026-11-20.md');
  });
});
