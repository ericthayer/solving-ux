import { render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StatusBadge, StatusLegend, defineStatusVocabulary } from './StatusBadge';
import type { StatusTone } from './StatusBadge';

expect.extend(toHaveNoViolations);

const TONES: StatusTone[] = ['success', 'warning', 'error', 'info', 'pending', 'neutral'];

describe('StatusBadge', () => {
  it('always renders the status as visible text', () => {
    render(<StatusBadge tone="error" label="Failed" />);
    expect(screen.getByText('Failed')).toBeVisible();
  });

  it('hides the icon from assistive tech so the text is read once', () => {
    const { container } = render(<StatusBadge tone="success" label="Succeeded" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(container.textContent).toBe('Succeeded');
  });

  it('gives every tone a different shape, so no two differ by hue alone', () => {
    const shapes = TONES.map((tone) => {
      const { container, unmount } = render(<StatusBadge tone={tone} label={tone} />);
      const paths = [...container.querySelectorAll('svg path')].map((p) => `${p.getAttribute('class') ?? ''}:${p.getAttribute('d') ?? ''}`);
      unmount();
      return paths.join('|');
    });
    expect(new Set(shapes).size).toBe(TONES.length);
  });

  it('reads the detail after the label with a pause (edge case)', () => {
    const { container } = render(<StatusBadge tone="warning" label="Needs review" detail="2 rows skipped" />);
    expect(container.textContent).toBe('Needs review, 2 rows skipped');
  });

  it('omits the detail separator when there is no detail (edge case)', () => {
    const { container } = render(<StatusBadge tone="pending" label="Running" detail="" />);
    expect(container.textContent).toBe('Running');
  });
});

describe('compact density', () => {
  it('keeps the label as text for assistive tech and drops the visible detail', () => {
    const { container } = render(<StatusBadge tone="error" label="Failed" detail="Timed out" density="compact" />);
    expect(container.textContent).toBe('Failed');
    expect(screen.getByText('Failed').className).not.toBe('');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('defineStatusVocabulary', () => {
  const recordStatus = defineStatusVocabulary({
    active: { tone: 'success', label: 'Active', meaning: 'In use.' },
    overdue: { tone: 'warning', label: 'Overdue', meaning: 'Past its due date.' },
  });

  it('renders a badge from a state key with the configured word and tone', () => {
    const { container } = render(<recordStatus.Badge status="overdue" detail="3 days" />);
    expect(container.textContent).toBe('Overdue, 3 days');
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'warning');
  });

  it('builds legend entries in definition order', () => {
    expect(recordStatus.entries.map((e) => e.label)).toEqual(['Active', 'Overdue']);
  });
});

describe('StatusLegend', () => {
  it('names the key by its caption and pairs each status with its meaning', () => {
    render(
      <StatusLegend
        caption="Status key"
        entries={[
          { tone: 'success', label: 'Succeeded', meaning: 'Finished with no errors.' },
          { tone: 'error', label: 'Failed', meaning: 'Stopped. Open the run to see why.' },
        ]}
      />,
    );
    const legend = screen.getByRole('figure', { name: 'Status key' });
    const terms = within(legend).getAllByRole('term');
    expect(terms.map((t) => t.textContent)).toEqual(['Succeeded', 'Failed']);
    expect(within(legend).getAllByRole('definition')[1]).toHaveTextContent('Stopped. Open the run to see why.');
  });

  it('has no axe violations for every tone, in a table and in the legend', async () => {
    const { container } = render(
      <main>
        <table>
          <caption>Jobs</caption>
          <thead>
            <tr>
              <th scope="col">Job</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {TONES.map((tone) => (
              <tr key={tone}>
                <th scope="row">{tone} job</th>
                <td>
                  <StatusBadge tone={tone} label={tone} detail="Detail" />
                  <StatusBadge tone={tone} label={`${tone} compact`} density="compact" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <StatusLegend caption="Status key" entries={TONES.map((tone) => ({ tone, label: tone, meaning: `${tone} meaning` }))} />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
