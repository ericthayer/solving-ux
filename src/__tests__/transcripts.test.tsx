import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ScreenReaderTranscript } from '../components/ScreenReaderTranscript';
import { builtInPatterns } from '../patterns/registry';
import { getTranscript, transcripts } from '../patterns/transcripts';
import type { ScreenReaderTranscript as Transcript } from '../types/transcript';

expect.extend(toHaveNoViolations);

describe('transcript data', () => {
  it('has exactly one transcript per built-in pattern', () => {
    expect([...transcripts.keys()].sort()).toEqual(builtInPatterns.map((p) => p.id).sort());
  });

  it.each([...transcripts.values()].map((t) => [t.patternId, t] as const))('%s is complete and comparable', (_, t) => {
    expect(t.steps.length).toBeGreaterThanOrEqual(4);
    expect(new Set(t.steps.map((s) => s.action)).size).toBe(t.steps.length);
    for (const step of t.steps) {
      expect(step.before.length).toBeGreaterThan(0);
      expect(step.after.length).toBeGreaterThan(0);
      // The solved pattern never leaves the user in silence.
      expect(step.after.every((u) => u.kind === 'speech')).toBe(true);
      if (step.criterion) {
        expect(step.criterion).toMatch(/^\d\.\d\.\d+$/);
        expect(step.failure).toBeTruthy();
      }
    }
    // Every transcript documents at least one outright failure.
    expect(t.steps.some((s) => s.failure)).toBe(true);
  });

  it('returns undefined for patterns without a transcript (edge case: editor drafts)', () => {
    expect(getTranscript('drafts.unknown')).toBeUndefined();
  });
});

describe('ScreenReaderTranscript', () => {
  const sample: Transcript = {
    patternId: 'test.sample',
    environment: 'NVDA + Chrome',
    steps: [
      {
        action: 'Tab to the checkbox',
        keys: 'Tab',
        before: [{ kind: 'speech', text: 'checkbox, not checked' }],
        after: [{ kind: 'speech', text: 'Select row 1, checkbox, not checked' }],
        failure: 'No accessible name.',
        criterion: '4.1.2',
      },
      {
        action: 'Apply an action',
        before: [{ kind: 'silence', note: 'No result is announced.' }],
        after: [{ kind: 'speech', text: 'Approve applied to 1 row.' }],
      },
    ],
  };

  it('renders each step with labelled before and after groups', () => {
    render(<ScreenReaderTranscript transcript={sample} />);
    expect(screen.getByRole('region', { name: 'Screen reader transcript' })).toBeInTheDocument();
    expect(screen.getByText('Tab to the checkbox')).toBeInTheDocument();
    expect(screen.getByText('Apply an action')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: 'Before' })).toHaveLength(2);
    expect(screen.getAllByRole('group', { name: 'After' })).toHaveLength(2);
    expect(screen.getByText('Fails 4.1.2.')).toBeInTheDocument();
    expect(screen.getByText('No result is announced.')).toBeInTheDocument();
    expect(screen.getByText('Tab', { selector: 'kbd' })).toBeInTheDocument();
  });

  it('omits the failure note when a step has none (edge case)', () => {
    render(<ScreenReaderTranscript transcript={{ ...sample, steps: [sample.steps[1]!] }} />);
    expect(screen.queryByText(/^Fails/)).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ScreenReaderTranscript transcript={sample} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
