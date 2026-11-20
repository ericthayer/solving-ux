import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OnboardingChecklist } from './OnboardingChecklist';
import type { OnboardingTask } from './OnboardingChecklist';

expect.extend(toHaveNoViolations);

const help = { label: 'Help and support', href: '/help' };

const makeTasks = (doneIds: string[] = []): OnboardingTask[] => [
  { id: 'profile', title: 'Add your profile', description: 'Shown on reports.', href: '/profile', complete: doneIds.includes('profile') },
  { id: 'import', title: 'Import records', description: 'Start from the sample file.', href: '/import', complete: doneIds.includes('import') },
  { id: 'invite', title: 'Invite a teammate', description: 'Reviews need a second person.', href: '/team', complete: doneIds.includes('invite') },
];

describe('OnboardingChecklist', () => {
  it('renders a labelled landmark with progress and task links in order', () => {
    render(<OnboardingChecklist tasks={makeTasks(['profile'])} help={help} />);
    expect(screen.getByRole('complementary', { name: 'Getting started' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Getting started' })).toBeInTheDocument();
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Getting started' })).toHaveAttribute('value', '1');
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/profile', '/import', '/team', '/help']);
  });

  it('states completion in the accessible name, not by color alone', () => {
    render(<OnboardingChecklist tasks={makeTasks(['profile'])} help={help} />);
    expect(screen.getByRole('link', { name: /^Add your profile\s?, done$/ })).toHaveAccessibleDescription('Shown on reports.');
    expect(screen.getByRole('link', { name: /^Import records\s?, not started$/ })).toBeInTheDocument();
  });

  it('collapses with the keyboard and keeps help in place', async () => {
    const onExpandedChange = jest.fn();
    const user = userEvent.setup();
    render(<OnboardingChecklist tasks={makeTasks()} help={help} onExpandedChange={onExpandedChange} />);
    const toggle = screen.getByRole('button', { name: 'Hide getting started tasks' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: 'Show getting started tasks' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Show getting started tasks' })).toHaveFocus();
    expect(screen.queryByRole('link', { name: /Import records/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Help and support' })).toBeVisible();
  });

  it('announces only completions detected after the first render', () => {
    const { rerender } = render(<OnboardingChecklist tasks={makeTasks(['profile'])} help={help} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    rerender(<OnboardingChecklist tasks={makeTasks(['profile', 'import'])} help={help} />);
    expect(screen.getByRole('status')).toHaveTextContent('Task complete: Import records. 2 of 3 done.');
    rerender(<OnboardingChecklist tasks={makeTasks(['profile', 'import', 'invite'])} help={help} />);
    expect(screen.getByRole('status')).toHaveTextContent('Task complete: Invite a teammate. All 3 tasks done.');
  });

  it('offers removal only when every task is complete (edge case)', async () => {
    const onDismiss = jest.fn();
    const user = userEvent.setup();
    const { rerender } = render(<OnboardingChecklist tasks={makeTasks(['profile'])} help={help} onDismiss={onDismiss} />);
    expect(screen.queryByRole('button', { name: 'Remove checklist' })).not.toBeInTheDocument();
    rerender(<OnboardingChecklist tasks={makeTasks(['profile', 'import', 'invite'])} help={help} onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: 'Remove checklist' }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('routes in-app tasks through onSelect buttons', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<OnboardingChecklist tasks={[{ id: 'a', title: 'Open reports', description: 'Build one.', onSelect, complete: false }]} help={help} />);
    await user.click(screen.getByRole('button', { name: /^Open reports\s?, not started$/ }));
    expect(onSelect).toHaveBeenCalled();
  });

  it('handles an empty task list without dividing by zero (edge case)', () => {
    render(<OnboardingChecklist tasks={[]} help={help} />);
    expect(screen.getByText('0 of 0 done')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '1');
  });

  it('has no axe violations expanded, collapsed, and complete', async () => {
    const { container } = render(
      <main>
        <OnboardingChecklist tasks={makeTasks(['profile'])} help={help} />
        <OnboardingChecklist title="Team setup" tasks={makeTasks()} help={help} defaultExpanded={false} />
        <OnboardingChecklist title="Workspace setup" tasks={makeTasks(['profile', 'import', 'invite'])} help={help} onDismiss={jest.fn()} />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
