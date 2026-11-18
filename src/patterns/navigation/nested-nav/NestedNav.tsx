import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import styles from './NestedNav.module.css';

export type NavLink = { id: string; label: string; href: string };
export type NavGroup = { id: string; label: string; href?: string; children: NavItem[] };
export type NavItem = NavLink | NavGroup;

export type NestedNavProps = {
  /** Accessible name for the navigation landmark. */
  label: string;
  items: NavItem[];
  /** id of the page the user is on. Its ancestors open automatically. */
  currentId: string;
  /** Called on link activation. When provided, default link navigation is prevented (client-side routing). */
  onNavigate?: (item: NavLink) => void;
  showBreadcrumbs?: boolean;
  /** Name for the breadcrumb landmark. Change it when the page already has a "Breadcrumb" nav. */
  breadcrumbLabel?: string;
};

const isGroup = (item: NavItem): item is NavGroup => 'children' in item;

export function findPath(items: NavItem[], id: string): NavItem[] | null {
  for (const item of items) {
    if (item.id === id) return [item];
    if (isGroup(item)) {
      const childPath = findPath(item.children, id);
      if (childPath) return [item, ...childPath];
    }
  }
  return null;
}

export function NestedNav({
  label,
  items,
  currentId,
  onNavigate,
  showBreadcrumbs = true,
  breadcrumbLabel = 'Breadcrumb',
}: NestedNavProps): JSX.Element {
  const baseId = useId();
  const path = useMemo((): NavItem[] => findPath(items, currentId) ?? [], [items, currentId]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(path.slice(0, -1).map((item) => item.id)));
  const [menuOpen, setMenuOpen] = useState(false);
  const toggles = useRef(new Map<string, HTMLButtonElement>());
  const menuButton = useRef<HTMLButtonElement>(null);

  // Navigating elsewhere (e.g. browser back) re-opens the new page's ancestors without closing others.
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      path.slice(0, -1).forEach((item) => next.add(item.id));
      return next.size === prev.size ? prev : next;
    });
  }, [path]);

  const toggleGroup = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseOnEscape = (event: KeyboardEvent<HTMLUListElement>, groupId: string | null): void => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    if (groupId) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      toggles.current.get(groupId)?.focus();
    } else if (menuOpen) {
      setMenuOpen(false);
      menuButton.current?.focus();
    }
  };

  const handleLink = (event: MouseEvent<HTMLAnchorElement>, item: NavLink): void => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(item);
    setMenuOpen(false);
  };

  const groupListId = (id: string): string => `${baseId}-group-${id}`;

  const renderList = (list: NavItem[], level: number, groupId: string | null): JSX.Element => (
    <ul
      className={styles.list}
      id={groupId ? groupListId(groupId) : undefined}
      data-level={Math.min(level, 4)}
      onKeyDown={(event) => collapseOnEscape(event, groupId)}
    >
      {list.map((item) => {
        const inPath = path.includes(item);
        if (isGroup(item)) {
          const open = expanded.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                ref={(node) => {
                  if (node) toggles.current.set(item.id, node);
                  else toggles.current.delete(item.id);
                }}
                className={styles.groupToggle}
                aria-expanded={open}
                aria-controls={groupListId(item.id)}
                data-in-path={inPath || undefined}
                onClick={() => toggleGroup(item.id)}
              >
                <span aria-hidden="true" className={styles.chevron} />
                {item.label}
              </button>
              {open && renderList(item.children, level + 1, item.id)}
            </li>
          );
        }
        const current = item.id === currentId;
        return (
          <li key={item.id}>
            <a
              href={item.href}
              className={styles.link}
              aria-current={current ? 'page' : undefined}
              onClick={(event) => handleLink(event, item)}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={styles.root}>
      {showBreadcrumbs && path.length > 0 && (
        <nav aria-label={breadcrumbLabel} className={styles.breadcrumb}>
          <ol>
            {path.map((item, index) => {
              const last = index === path.length - 1;
              return (
                <li key={item.id}>
                  {last ? (
                    <span aria-current="page">{item.label}</span>
                  ) : item.href ? (
                    <a href={item.href}>{item.label}</a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <nav aria-label={label} className={styles.nav} data-open={menuOpen || undefined}>
        <button
          ref={menuButton}
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls={`${baseId}-panel`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Close menu' : 'Menu'}
        </button>
        <div id={`${baseId}-panel`} className={styles.panel}>
          {renderList(items, 1, null)}
        </div>
      </nav>
    </div>
  );
}
