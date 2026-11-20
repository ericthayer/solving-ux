import type { AccessibilityNote, Pattern } from '../types/pattern';
import { CATEGORIES } from '../types/pattern';
import { refLabel } from '../types/failure';

const escapeCell = (text: string): string => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function notesOfKind<K extends AccessibilityNote['kind']>(notes: AccessibilityNote[], kind: K): Extract<AccessibilityNote, { kind: K }>[] {
  return notes.filter((n): n is Extract<AccessibilityNote, { kind: K }> => n.kind === kind);
}

export function buildReadme(pattern: Pattern): string {
  const category = CATEGORIES.find((c) => c.id === pattern.category)?.label ?? pattern.category;
  const notes = pattern.accessibilityNotes;
  const lines: string[] = [
    `# ${pattern.title}`,
    '',
    `${category} · WCAG 2.2 ${pattern.wcagLevel} · Updated ${pattern.lastUpdated} by ${pattern.author}`,
    '',
    pattern.summary,
    '',
    '## Files',
    '',
    `- \`${pattern.files.component}\`: component`,
    ...(pattern.files.styles ? [`- \`${pattern.files.styles}\`: CSS Module. Theme with the \`--sux-*\` custom properties; every value has a fallback.`] : []),
    `- \`${pattern.files.test}\`: Jest + React Testing Library + jest-axe tests`,
    '',
    '## Problem',
    '',
    pattern.problemStatement,
    '',
    '### Before',
    '',
    pattern.beforeState.summary,
    '',
    ...pattern.beforeState.failures.map((f) => `- ${f.description}${f.refs.length ? ` (${f.refs.map(refLabel).join(', ')})` : ''}`),
    '',
    '## Design rationale',
    '',
    pattern.designRationale,
    '',
    '## Usage',
    '',
    '```tsx',
    pattern.usage,
    '```',
    '',
    '## Props',
    '',
    '| Prop | Type | Required | Default | Description |',
    '| --- | --- | --- | --- | --- |',
    ...pattern.props.map(
      (p) => `| \`${escapeCell(p.name)}\` | \`${escapeCell(p.type)}\` | ${p.required ? 'Yes' : 'No'} | ${p.defaultValue ? `\`${escapeCell(p.defaultValue)}\`` : '–'} | ${escapeCell(p.description)} |`,
    ),
    '',
    '## Accessibility',
    '',
    '### WCAG success criteria',
    '',
    ...notesOfKind(notes, 'wcag').map((n) => `- **${n.criterion} ${n.title} (${n.level})**: ${n.detail}`),
    '',
    '### Keyboard',
    '',
    '| Keys | Action |',
    '| --- | --- |',
    ...notesOfKind(notes, 'keyboard').map((n) => `| ${escapeCell(n.keys)} | ${escapeCell(n.action)} |`),
    '',
    '### ARIA',
    '',
    ...notesOfKind(notes, 'aria').map((n) => `- \`${n.attribute}\`: ${n.detail}`),
    '',
    '### Screen reader behavior',
    '',
    ...notesOfKind(notes, 'screen-reader').map((n) => `- **${n.title}**: ${n.detail}`),
    '',
    '## Testing',
    '',
    'Requires `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, and `jest-axe`. Map `*.module.css` to `identity-obj-proxy` in your Jest config.',
    '',
  ];
  return lines.join('\n');
}
