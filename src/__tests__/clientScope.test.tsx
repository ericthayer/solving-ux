import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { SourceBadges } from '../components/Badges';
import { builtInPatterns } from '../patterns/registry';
import { CLIENT_IDS } from '../types/client';

const root = join(__dirname, '..', '..');
const catalogFile = join(root, 'src', 'patterns', 'catalog.generated.ts');

/** Runs the generator for one client, returns the generated catalog, then restores the unscoped catalog. */
function generate(client: string): string {
  try {
    execFileSync('node', ['scripts/gen-sources.mjs'], { cwd: root, env: { ...process.env, VITE_CLIENT: client }, stdio: 'pipe' });
    return readFileSync(catalogFile, 'utf8');
  } finally {
    execFileSync('node', ['scripts/gen-sources.mjs'], { cwd: root, env: { ...process.env, VITE_CLIENT: '' }, stdio: 'pipe' });
  }
}

describe('client scoping', () => {
  it('tags every pattern with at least one known client id', () => {
    for (const pattern of builtInPatterns) {
      expect(pattern.clients.length).toBeGreaterThan(0);
      for (const client of pattern.clients) expect(CLIENT_IDS).toContain(client);
    }
  });

  it.each(CLIENT_IDS)('generates a %s catalog with only that client’s patterns', (client) => {
    const catalog = generate(client);
    for (const pattern of builtInPatterns) {
      expect(catalog.includes(`'./${pattern.category}/${pattern.slug}/pattern'`)).toBe(pattern.clients.includes(client));
    }
  });

  it('rejects an unknown client id', () => {
    expect(() =>
      execFileSync('node', ['scripts/gen-sources.mjs'], { cwd: root, env: { ...process.env, VITE_CLIENT: 'nope' }, stdio: 'pipe' }),
    ).toThrow();
  });

  it('shows client labels in the team build and nothing in a client build', () => {
    const { container, rerender } = render(<SourceBadges clients={['client-a', 'client-b']} scoped={false} />);
    expect(screen.getByRole('list', { name: 'Observed in' })).toHaveTextContent('Client AClient B');
    rerender(<SourceBadges clients={['client-a', 'client-b']} scoped />);
    expect(container).toBeEmptyDOMElement();
  });
});
