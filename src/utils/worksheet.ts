import { CATEGORIES } from '../types/pattern';
import type { Pattern } from '../types/pattern';
import { EMPTY_WORKSHEET, SEVERITIES } from '../types/worksheet';
import type { Finding, FindingCategory, FindingDraft, Severity, Worksheet } from '../types/worksheet';
import { patternPath } from './slug';

const SEVERITY_IDS: readonly string[] = SEVERITIES.map((s) => s.id);
const CATEGORY_IDS: readonly string[] = [...CATEGORIES.map((c) => c.id), 'other'];

export const severityLabel = (id: Severity): string => SEVERITIES.find((s) => s.id === id)?.label ?? id;
export const categoryLabel = (id: FindingCategory): string => CATEGORIES.find((c) => c.id === id)?.label ?? 'Other';

/** Most severe first; ties keep the order findings were logged in. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_IDS.indexOf(a.severity) - SEVERITY_IDS.indexOf(b.severity));
}

export function severityCounts(findings: Finding[]): Record<Severity, number> {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return counts;
}

export type DraftErrors = Partial<Record<keyof FindingDraft, string>>;

export function validateDraft(draft: FindingDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.title.trim()) errors.title = 'Enter a short title for the finding.';
  if (!draft.observation.trim()) errors.observation = 'Describe what you observed.';
  return errors;
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

function parseFinding(raw: unknown): Finding | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  const title = str(r.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    severity: (SEVERITY_IDS.includes(str(r.severity)) ? r.severity : 'moderate') as Severity,
    category: (CATEGORY_IDS.includes(str(r.category)) ? r.category : 'other') as FindingCategory,
    location: str(r.location),
    wcag: str(r.wcag),
    observation: str(r.observation),
    recommendation: str(r.recommendation),
    patternId: str(r.patternId),
    createdAt: str(r.createdAt) || new Date(0).toISOString(),
  };
}

/** Reads stored JSON defensively: bad or foreign data yields an empty worksheet, bad rows are dropped. */
export function parseWorksheet(json: string | null): Worksheet {
  if (!json) return EMPTY_WORKSHEET;
  try {
    const raw: unknown = JSON.parse(json);
    if (!raw || typeof raw !== 'object') return EMPTY_WORKSHEET;
    const r = raw as Record<string, unknown>;
    const findings = Array.isArray(r.findings) ? r.findings.map(parseFinding).filter((f): f is Finding => f !== null) : [];
    return { version: 1, appName: str(r.appName), auditor: str(r.auditor), findings };
  } catch {
    return EMPTY_WORKSHEET;
  }
}

/** Collapses newlines so user text cannot break out of a heading, list item, or table row. */
const inline = (text: string): string => text.replace(/\s*\n\s*/g, ' ').trim();
const cell = (text: string): string => inline(text).replace(/\|/g, '\\|') || '—';

export type MarkdownOptions = {
  patterns: Pick<Pattern, 'id' | 'title' | 'category' | 'slug'>[];
  /** Origin used to turn pattern routes into absolute links. */
  baseUrl: string;
  /** ISO date (YYYY-MM-DD) printed in the header. */
  date: string;
};

export function worksheetToMarkdown(sheet: Worksheet, { patterns, baseUrl, date }: MarkdownOptions): string {
  const findings = sortFindings(sheet.findings);
  const counts = severityCounts(findings);
  const breakdown = SEVERITIES.filter((s) => counts[s.id] > 0)
    .map((s) => `${counts[s.id]} ${s.label.toLowerCase()}`)
    .join(', ');
  const lines: string[] = [`# UX audit: ${inline(sheet.appName) || 'Untitled app'}`, ''];
  if (sheet.auditor.trim()) lines.push(`- **Auditor:** ${inline(sheet.auditor)}`);
  lines.push(`- **Date:** ${date}`, `- **Findings:** ${findings.length}${breakdown ? ` (${breakdown})` : ''}`, '');

  if (findings.length === 0) {
    lines.push('_No findings logged yet._', '');
    return lines.join('\n');
  }

  lines.push('## Summary', '', '| # | Finding | Severity | Category | WCAG |', '| --- | --- | --- | --- | --- |');
  findings.forEach((f, i) => {
    lines.push(`| ${i + 1} | ${cell(f.title)} | ${severityLabel(f.severity)} | ${categoryLabel(f.category)} | ${cell(f.wcag)} |`);
  });
  lines.push('', '## Findings', '');

  findings.forEach((f, i) => {
    const pattern = patterns.find((p) => p.id === f.patternId);
    lines.push(`### ${i + 1}. ${inline(f.title)}`, '');
    lines.push(`- **Severity:** ${severityLabel(f.severity)}`, `- **Category:** ${categoryLabel(f.category)}`);
    if (f.location.trim()) lines.push(`- **Where:** ${inline(f.location)}`);
    if (f.wcag.trim()) lines.push(`- **WCAG:** ${inline(f.wcag)}`);
    if (pattern) lines.push(`- **Solved by:** [${pattern.title}](${baseUrl.replace(/\/$/, '')}${patternPath(pattern)})`);
    lines.push('', '**Observation**', '', f.observation.trim(), '');
    if (f.recommendation.trim()) lines.push('**Recommendation**', '', f.recommendation.trim(), '');
  });
  return lines.join('\n');
}

export function markdownFilename(appName: string, date: string): string {
  const base = appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `ux-audit-${base || 'app'}-${date}.md`;
}
