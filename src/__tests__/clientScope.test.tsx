import { render, screen } from '@testing-library/react';
import { SourceBadges } from '../components/Badges';
import { builtInPatterns } from '../patterns/registry';
import { CLIENT_IDS } from '../types/client';

describe('client attribution', () => {
  it('tags every pattern with at least one known client id', () => {
    for (const pattern of builtInPatterns) {
      expect(pattern.clients.length).toBeGreaterThan(0);
      for (const client of pattern.clients) expect(CLIENT_IDS).toContain(client);
    }
  });

  it('shows client labels in the team build and nothing in the public build', () => {
    const globals = globalThis as { __TEAM_BUILD__?: boolean };
    const { container, rerender } = render(<SourceBadges clients={['client-a', 'client-b']} />);
    expect(screen.getByRole('list', { name: 'Observed in' })).toHaveTextContent('Client AClient B');
    globals.__TEAM_BUILD__ = false;
    try {
      rerender(<SourceBadges clients={['client-b']} />);
      expect(container).toBeEmptyDOMElement();
    } finally {
      globals.__TEAM_BUILD__ = true;
    }
  });
});
