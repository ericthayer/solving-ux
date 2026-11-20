import { useEffect, useId, useRef, useState } from 'react';
import { PagedList } from './PagedList';
import type { PagedListMode } from './PagedList';
import demo from '../../demo.module.css';
import { LARGE_DATA_COUNT, useStressTest } from '../../stress';

type Request = { id: string; title: string; team: string; age: number };

const TITLES = ['Replace badge reader', 'Update vendor address', 'Renew software license', 'Fix shared printer', 'Grant report access', 'Order replacement laptop'];
const TEAMS = ['Facilities', 'Finance', 'IT', 'Operations'];

const buildItems = (count: number, text: (value: string) => string): Request[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `REQ-${(1001 + i).toString()}`,
    title: text(TITLES[i % TITLES.length] ?? 'Request'),
    team: TEAMS[i % TEAMS.length] ?? 'Operations',
    age: 1 + ((i * 7) % 30),
  }));

/** The decision rule, shown next to each choice. */
const MODES: Record<PagedListMode, { label: string; useWhen: string }> = {
  pages: { label: 'Pages', useWhen: 'Tasks: people compare, cite, or come back to a position.' },
  'load-more': { label: 'Load more', useWhen: 'Browsing: reading order matters more than position.' },
  infinite: { label: 'Infinite scroll', useWhen: 'Almost never. Endless feeds with nothing below them.' },
};

const storageKey = (mode: PagedListMode): string => `sux-demo-paged-list-${mode}`;

export default function PagedListDemo(): JSX.Element {
  const { text, largeData } = useStressTest(['longText', 'largeData']);
  const hintId = useId();
  const [items] = useState(() => buildItems(largeData ? LARGE_DATA_COUNT : 57, text));
  const [mode, setMode] = useState<PagedListMode>(() => {
    // A fresh visit starts at the top; only Back inside the demo restores a position.
    (Object.keys(MODES) as PagedListMode[]).forEach((m) => sessionStorage.removeItem(storageKey(m)));
    return 'pages';
  });
  const [open, setOpen] = useState<Request | null>(null);
  const detailRef = useRef<HTMLHeadingElement>(null);

  // Opening a request replaces the list, so focus moves to the new view's heading.
  useEffect(() => {
    if (open) detailRef.current?.focus();
  }, [open]);

  const changeMode = (next: PagedListMode): void => {
    sessionStorage.removeItem(storageKey(next));
    setMode(next);
  };

  return (
    <div className={demo.stack}>
      <fieldset className={demo.stack}>
        <legend className={demo.panelTitle}>Mode</legend>
        {(Object.keys(MODES) as PagedListMode[]).map((key) => (
          <div key={key} className={demo.row}>
            <input
              id={`${hintId}-${key}`}
              type="radio"
              name="paged-list-mode"
              checked={mode === key}
              onChange={() => changeMode(key)}
              aria-describedby={`${hintId}-${key}-rule`}
            />
            <label htmlFor={`${hintId}-${key}`}>{MODES[key].label}</label>
            <span id={`${hintId}-${key}-rule`} className={demo.log}>
              {MODES[key].useWhen}
            </span>
          </div>
        ))}
      </fieldset>

      {open ? (
        <section className={demo.panel} aria-labelledby={`${hintId}-detail`}>
          <h3 id={`${hintId}-detail`} ref={detailRef} tabIndex={-1} className={demo.panelTitle}>
            {open.id}: {open.title}
          </h3>
          <p className={demo.panelText}>
            {open.team} · opened {open.age} days ago. Go back to see the list return to the same place.
          </p>
          <p className={demo.row}>
            <button type="button" className={demo.button} onClick={() => setOpen(null)}>
              Back to requests
            </button>
          </p>
        </section>
      ) : (
        <PagedList<Request>
          key={mode}
          label={text('Service requests')}
          noun="requests"
          items={items}
          mode={mode}
          pageSize={10}
          restoreKey={storageKey(mode)}
          renderItem={(item) => (
            <span className={demo.row}>
              <strong>{item.title}</strong>
              <span className={demo.log}>
                {item.id} · {item.team} · {item.age}d
              </span>
              <button type="button" className={demo.button} onClick={() => setOpen(item)} aria-label={`Open ${item.id}, ${item.title}`}>
                Open
              </button>
            </span>
          )}
        />
      )}

      <footer className={demo.panel}>
        <p className={demo.panelText}>
          Page footer: <a href="#help">Help</a> · <a href="#contact">Contact support</a>
        </p>
      </footer>
    </div>
  );
}
