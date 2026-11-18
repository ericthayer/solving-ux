import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export type TabDef<T extends string> = { id: T; label: string; panel: ReactNode };

type TabsProps<T extends string> = {
  label: string;
  tabs: TabDef<T>[];
  selected: T;
  onSelect: (id: T) => void;
};

/** ARIA tabs with automatic activation and roving tabindex. */
export function Tabs<T extends string>({ label, tabs, selected, onSelect }: TabsProps<T>): JSX.Element {
  const baseId = useId();
  const refs = useRef(new Map<T, HTMLButtonElement>());

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const index = tabs.findIndex((t) => t.id === selected);
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    onSelect(tab.id);
    refs.current.get(tab.id)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 border-b border-line" onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const active = tab.id === selected;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) refs.current.set(tab.id, node);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== selected}
          tabIndex={0}
          className="pt-5 focus-visible:outline-offset-4"
        >
          {tab.id === selected && tab.panel}
        </div>
      ))}
    </div>
  );
}
