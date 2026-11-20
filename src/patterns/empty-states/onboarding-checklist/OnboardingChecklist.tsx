import { useEffect, useId, useRef, useState } from 'react';
import styles from './OnboardingChecklist.module.css';

/** Where a task takes the user: a real URL, or an in-app handler that routes and moves focus. */
type TaskTarget = { href: string; onSelect?: never } | { onSelect: () => void; href?: never };

export type OnboardingTask = TaskTarget & {
  id: string;
  title: string;
  description: string;
  /** Set by the product when the user actually does the task, never by viewing a step. */
  complete: boolean;
};

export type OnboardingChecklistProps = {
  tasks: OnboardingTask[];
  /** Visible heading and accessible name of the region. Defaults to "Getting started". */
  title?: string;
  /** Match the surrounding outline. Defaults to 2. */
  headingLevel?: 2 | 3 | 4;
  /** Start collapsed, for example when the user hid the checklist in an earlier session. */
  defaultExpanded?: boolean;
  /** Fires when the user collapses or expands, so the product can remember the choice. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Help link rendered in the same place on every page the checklist appears on. */
  help: { label: string; href: string };
  /** Offered only once every task is complete. The product should keep the help link elsewhere. */
  onDismiss?: () => void;
};

const progressText = (done: number, total: number): string => `${done} of ${total} done`;

export function OnboardingChecklist({
  tasks,
  title = 'Getting started',
  headingLevel = 2,
  defaultExpanded = true,
  onExpandedChange,
  help,
  onDismiss,
}: OnboardingChecklistProps): JSX.Element {
  const headingId = useId();
  const bodyId = useId();
  const progressId = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [announcement, setAnnouncement] = useState('');
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';

  const done = tasks.filter((t) => t.complete).length;
  const total = tasks.length;
  const allDone = total > 0 && done === total;

  // Announce completions detected from real use. The first render is never announced.
  const completedRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const now = new Set(tasks.filter((t) => t.complete).map((t) => t.id));
    const before = completedRef.current;
    completedRef.current = now;
    if (!before) return;
    const newlyDone = tasks.filter((t) => t.complete && !before.has(t.id));
    if (newlyDone.length === 0) return;
    const names = newlyDone.map((t) => t.title).join(', ');
    setAnnouncement(
      now.size === tasks.length ? `Task complete: ${names}. All ${tasks.length} tasks done.` : `Task complete: ${names}. ${progressText(now.size, tasks.length)}.`,
    );
  }, [tasks]);

  const toggle = (): void => {
    const next = !expanded;
    setExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <aside className={styles.root} aria-labelledby={headingId} data-complete={allDone || undefined}>
      <div className={styles.header}>
        <Heading id={headingId} className={styles.title}>
          {title}
        </Heading>
        <span id={progressId} className={styles.count}>
          {progressText(done, total)}
        </span>
        <button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls={bodyId} onClick={toggle}>
          {expanded ? 'Hide' : 'Show'}
          <span className={styles.visuallyHidden}> {title.toLowerCase()} tasks</span>
        </button>
      </div>
      <progress className={styles.meter} max={total || 1} value={done} aria-labelledby={headingId} aria-describedby={progressId} />

      <div id={bodyId} className={styles.body} hidden={!expanded}>
        {allDone && (
          <p className={styles.doneNote}>
            Setup is complete. You can keep this list for reference or remove it.
          </p>
        )}
        <ol className={styles.tasks}>
          {tasks.map((task) => {
            const descId = `${bodyId}-${task.id}`;
            const label = (
              <>
                {task.title}
                <span className={styles.visuallyHidden}>{task.complete ? ', done' : ', not started'}</span>
              </>
            );
            return (
              <li key={task.id} className={styles.task} data-complete={task.complete || undefined}>
                <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  {task.complete ? <path d="m6 12 4 4 8-8" /> : <circle cx="12" cy="12" r="7" />}
                </svg>
                <div className={styles.taskText}>
                  {task.href !== undefined ? (
                    <a className={styles.taskLink} href={task.href} aria-describedby={descId}>
                      {label}
                    </a>
                  ) : (
                    <button type="button" className={styles.taskLink} onClick={task.onSelect} aria-describedby={descId}>
                      {label}
                    </button>
                  )}
                  <p id={descId} className={styles.description}>
                    {task.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Outside the collapsible body: help stays in the same place whether the list is open or not. */}
      <div className={styles.footer}>
        <a className={styles.help} href={help.href}>
          {help.label}
        </a>
        {allDone && onDismiss && (
          <button type="button" className={styles.secondary} onClick={onDismiss}>
            Remove checklist
          </button>
        )}
      </div>

      <p className={styles.visuallyHidden} role="status">
        {announcement}
      </p>
    </aside>
  );
}
