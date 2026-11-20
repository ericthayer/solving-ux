import { useRef, useState } from 'react';
import { OnboardingChecklist } from './OnboardingChecklist';
import { EmptyState } from '../empty-state/EmptyState';
import type { OnboardingTask } from './OnboardingChecklist';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

/** Each task page opens on the first-use empty state from the empty-state pattern, so the task's action is where the work happens. */
type TaskSeed = { id: string; title: string; description: string; page: string; empty: string; action: string };

const SEEDS: TaskSeed[] = [
  { id: 'profile', title: 'Add your organization profile', description: 'Name and time zone appear on every report.', page: 'Organization profile', empty: 'Your profile is blank', action: 'Save profile' },
  { id: 'import', title: 'Import your first records', description: 'Upload a spreadsheet or start from the sample file.', page: 'Import records', empty: 'No records yet', action: 'Import sample file' },
  { id: 'invite', title: 'Invite a teammate', description: 'Work is easier to review with a second person.', page: 'Team members', empty: 'It is just you so far', action: 'Send invite' },
  { id: 'report', title: 'Build your first report', description: 'Pick columns and filters, then save it to reuse.', page: 'Reports', empty: 'No saved reports yet', action: 'Create report' },
  { id: 'alerts', title: 'Choose notification settings', description: 'Decide which changes reach your inbox.', page: 'Notifications', empty: 'Using default notifications', action: 'Save settings' },
];

export default function OnboardingChecklistDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const [done, setDone] = useState<Set<string>>(() => new Set(['profile']));
  const [page, setPage] = useState<TaskSeed>(SEEDS[1] ?? SEEDS[0]!);
  const [removed, setRemoved] = useState(false);
  const pageHeading = useRef<HTMLHeadingElement>(null);

  const open = (seed: TaskSeed): void => {
    setPage(seed);
    // Move focus to the new "page", the way a route change should.
    requestAnimationFrame(() => pageHeading.current?.focus());
  };

  const tasks: OnboardingTask[] = SEEDS.map((seed) => ({
    id: seed.id,
    title: text(seed.title),
    description: text(seed.description),
    complete: done.has(seed.id),
    onSelect: () => open(seed),
  }));

  const pageDone = done.has(page.id);

  return (
    <div className={demo.split}>
      {removed ? (
        <section className={demo.panel} aria-label="Checklist removed">
          <p className={demo.panelText}>Checklist removed. Help and support stays in the same place in the header.</p>
          <div className={demo.row}>
            <button
              type="button"
              className={demo.button}
              onClick={() => {
                setDone(new Set(['profile']));
                setRemoved(false);
              }}
            >
              Reset demo
            </button>
          </div>
        </section>
      ) : (
        <OnboardingChecklist
          tasks={tasks}
          headingLevel={3}
          help={{ label: 'Help and support', href: '#help' }}
          onDismiss={() => setRemoved(true)}
        />
      )}

      <section className={demo.panel} aria-labelledby="onboarding-demo-page">
        <h3 id="onboarding-demo-page" ref={pageHeading} tabIndex={-1} className={demo.panelTitle}>
          {text(page.page)}
        </h3>
        {pageDone ? (
          <p className={demo.panelText}>Done. The checklist ticked because you did the task, not because you opened this page.</p>
        ) : (
          <div className={demo.panelText}>
            <EmptyState
              variant="first-use"
              headingLevel={4}
              title={text(page.empty)}
              description={text(page.description)}
              primaryAction={{ label: text(page.action), onClick: () => setDone((prev) => new Set(prev).add(page.id)) }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
