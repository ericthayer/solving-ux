import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { CodeWalkthrough } from '../components/CodeWalkthrough';
import { builtInPatterns } from '../patterns/registry';
import { getWalkthrough, walkthroughs } from '../patterns/walkthroughs';
import { resolveWalkthrough } from '../utils/walkthrough';
import { WCAG_CRITERIA } from '../utils/wcag';

expect.extend(toHaveNoViolations);

beforeAll(() => {
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
});

describe('walkthrough content', () => {
  it('exists for every built-in pattern and nothing else', () => {
    expect(Object.keys(walkthroughs).sort()).toEqual(builtInPatterns.map((p) => `${p.category}/${p.slug}`).sort());
  });

  it.each(builtInPatterns.map((p) => [p.id, p] as const))('%s: every anchor resolves to the code it describes', (_, pattern) => {
    const annotations = getWalkthrough(pattern.category, pattern.slug);
    const { steps, errors } = resolveWalkthrough(annotations, { component: pattern.code, styles: pattern.styles });
    expect(errors).toEqual([]);
    expect(steps.length).toBeGreaterThanOrEqual(8);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const step of steps) {
      expect(step.rationale.length).toBeGreaterThan(60);
      // Spans longer than ~30 lines stop pointing at anything in particular.
      expect(step.end - step.start).toBeLessThan(30);
      for (const c of step.wcag ?? []) expect(WCAG_CRITERIA).toHaveProperty([c]);
    }
    // Steps read top to bottom within each file.
    for (const file of ['component', 'styles'] as const) {
      const starts = steps.filter((s) => s.file === file).map((s) => s.start);
      expect(starts).toEqual([...starts].sort((a, b) => a - b));
    }
  });
});

describe('resolveWalkthrough', () => {
  const sources = { component: 'const a = 1;\nconst b = 2;\nreturn a;\nconst b2 = 3;\n', styles: '.x {\n  color: red;\n}\n' };

  it('turns anchors into inclusive 1-based line ranges', () => {
    const { steps, errors } = resolveWalkthrough(
      [
        { id: 'one', anchor: 'const a', endAnchor: 'return', topic: 'state', title: 'T', rationale: 'R' },
        { id: 'css', file: 'styles', anchor: 'color: red', topic: 'styling', title: 'T', rationale: 'R' },
      ],
      sources,
    );
    expect(errors).toEqual([]);
    expect(steps.map((s) => [s.id, s.file, s.start, s.end])).toEqual([
      ['one', 'component', 1, 3],
      ['css', 'styles', 2, 2],
    ]);
  });

  it('drops ambiguous and missing anchors and explains why (edge case)', () => {
    const { steps, errors } = resolveWalkthrough(
      [
        { id: 'ambiguous', anchor: 'const b', topic: 'state', title: 'T', rationale: 'R' },
        { id: 'missing', anchor: 'nope', topic: 'state', title: 'T', rationale: 'R' },
        { id: 'bad-end', anchor: 'return a', endAnchor: 'const a', topic: 'state', title: 'T', rationale: 'R' },
      ],
      sources,
    );
    expect(steps).toEqual([]);
    expect(errors).toEqual([
      expect.stringContaining('ambiguous: anchor "const b" matched 2 lines'),
      expect.stringContaining('missing: anchor "nope" matched 0 lines'),
      expect.stringContaining('bad-end: endAnchor "const a" not found at or after line 3'),
    ]);
  });
});

function renderAt(path: string) {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App canEdit={false} />
    </MemoryRouter>,
  );
  return { ...utils, user };
}

const table = builtInPatterns.find((p) => p.slug === 'bulk-actions')!;
const sources = { component: table.code, styles: table.styles };
const tableSteps = resolveWalkthrough(getWalkthrough(table.category, table.slug), sources).steps;

/** Controlled harness, the way WalkthroughTab drives it from the URL. */
function Harness({ initial }: { initial?: string }): JSX.Element {
  const [active, setActive] = useState<string | null>(initial ?? null);
  return (
    <CodeWalkthrough
      steps={tableSteps}
      sources={sources}
      filenames={{ component: table.files.component, styles: table.files.styles }}
      activeId={active}
      onActiveChange={setActive}
    />
  );
}

// Highlighted source is thousands of nodes, so queries are scoped to the step list where possible.
describe('CodeWalkthrough', () => {
  it('steps through annotations and announces the position', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const list = screen.getByRole('heading', { name: 'Code walkthrough' }).closest('section')!;
    const stepButtons = within(list).getAllByRole('button');
    expect(stepButtons).toHaveLength(tableSteps.length);
    expect(stepButtons[0]).toHaveAttribute('aria-current', 'step');

    const status = container.querySelector('[aria-live="polite"]')!;
    expect(status).toHaveTextContent(new RegExp(`^Step 1 of ${tableSteps.length}:`));
    const toolbar = status.parentElement!;
    expect(within(toolbar).getByRole('button', { name: 'Previous step' })).toHaveAttribute('aria-disabled', 'true');

    await user.click(within(toolbar).getByRole('button', { name: 'Next step' }));
    expect(stepButtons[1]).toHaveAttribute('aria-current', 'step');
    expect(status).toHaveTextContent(/^Step 2 of/);

    await user.click(within(list).getByRole('button', { name: /Each checkbox says which row it selects/ }));
    expect(within(list).getByText(/rowLabel is a required prop/)).toBeInTheDocument();
    expect(within(list).getByRole('link', { name: /4\.1\.2 Name, role, value \(A\)/ })).toHaveAttribute(
      'href',
      'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
    );
    const step = tableSteps.find((s) => s.id === 'checkbox-names')!;
    expect(container.querySelector(`[data-line="${step.start}"]`)).toHaveAttribute('data-active');
    expect(container.querySelector(`[data-line="${step.start - 1}"]`)).not.toHaveAttribute('data-active');
  });

  it('selects a step when its highlighted code is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const step = tableSteps.find((s) => s.id === 'aria-sort')!;
    await user.click(container.querySelector(`[data-line="${step.start}"]`)!);
    const list = screen.getByRole('heading', { name: 'Code walkthrough' }).closest('section')!;
    expect(within(list).getByRole('button', { name: /Sort state lives on the header/ })).toHaveAttribute('aria-current', 'step');
  });

  it('switches to the stylesheet for a CSS step and keeps focus on Next at the end (edge case)', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initial="focus-styles" />);
    expect(container.querySelector('[role="region"]')).toHaveAccessibleName(/BulkActionTable\.module\.css source, step \d+ highlighted/);
    const toolbar = container.querySelector('[aria-live="polite"]')!.parentElement!;
    const next = within(toolbar).getByRole('button', { name: 'Next step' });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    next.focus();
    await user.click(next);
    expect(next).toHaveFocus();
  });

  it('has no axe violations', async () => {
    // Same markup as a real pattern on a short source: axe on thousands of highlighted tokens takes ~25s in jsdom.
    const small = { component: 'const a = 1;\nconst b = 2;\nexport default a + b;\n', styles: '.x {\n  color: red;\n}\n' };
    const { steps } = resolveWalkthrough(
      [
        { id: 'a', anchor: 'const a', endAnchor: 'const b', topic: 'state', title: 'First', rationale: 'Why the first span exists.', wcag: ['4.1.2'] },
        { id: 'b', file: 'styles', anchor: 'color: red', topic: 'styling', title: 'Second', rationale: 'Why the second span exists.' },
      ],
      small,
    );
    const { container } = render(
      <CodeWalkthrough steps={steps} sources={small} filenames={{ component: 'A.tsx', styles: 'A.module.css' }} activeId="a" onActiveChange={jest.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders a message instead of an empty layout when there are no steps (edge case)', () => {
    render(<CodeWalkthrough steps={[]} sources={sources} filenames={{ component: 'A.tsx', styles: '' }} activeId={null} onActiveChange={jest.fn()} />);
    expect(screen.getByText('No walkthrough has been written for this pattern yet.')).toBeInTheDocument();
  });
});

describe('Walkthrough tab on the pattern page', () => {
  it('deep-links to a step through ?tab=walkthrough&step=', async () => {
    renderAt('/patterns/data-table/bulk-actions?tab=walkthrough&step=status-region');
    const tablist = await screen.findByRole('tablist');
    expect(within(tablist).getByRole('tab', { name: 'Walkthrough' })).toHaveAttribute('aria-selected', 'true');
    const list = screen.getByRole('heading', { name: 'Code walkthrough' }).closest('section')!;
    expect(within(list).getByRole('button', { name: /One status region, always mounted/ })).toHaveAttribute('aria-current', 'step');
  }, 20000);
});
