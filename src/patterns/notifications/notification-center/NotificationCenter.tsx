import { useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './NotificationCenter.module.css';

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  /** ISO 8601 timestamp. Items are grouped by local day and sorted newest first. */
  timestamp: string;
  read: boolean;
  /** Optional per-item action, e.g. "Review invoice". */
  action?: { label: string; onClick: () => void };
};

export type NotificationCenterProps = {
  items: NotificationItem[];
  /** Called when one item is marked read or unread. */
  onReadChange: (id: string, read: boolean) => void;
  onMarkAllRead: () => void;
  /** Reference time for "Today" and "Yesterday" groups. Defaults to the current time. */
  now?: Date;
  label?: string;
};

type DayGroup = { key: string; label: string; items: NotificationItem[] };

const MAX_BADGE = 99;
const dayKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

/** Groups items by local calendar day, newest first. Pure, so it is tested without rendering. */
export function groupByDay(items: NotificationItem[], now: Date): DayGroup[] {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const named: Record<string, string> = { [dayKey(now)]: 'Today', [dayKey(yesterday)]: 'Yesterday' };
  const groups = new Map<string, DayGroup>();
  const sorted = [...items].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  for (const item of sorted) {
    const date = new Date(item.timestamp);
    const key = dayKey(date);
    const group = groups.get(key) ?? { key, label: named[key] ?? dateFormat.format(date), items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

export function NotificationCenter({ items, onReadChange, onMarkAllRead, now, label = 'Notifications' }: NotificationCenterProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const seen = useRef(new Set(items.map((i) => i.id)));
  const id = useId();
  const panelId = `${id}-panel`;
  const headingId = `${id}-heading`;

  const unread = items.filter((i) => !i.read).length;
  const groups = useMemo(() => groupByDay(items, now ?? new Date()), [items, now]);

  // Announce only items that were not there before, never the whole list on re-render.
  useEffect(() => {
    const fresh = items.filter((i) => !seen.current.has(i.id));
    for (const i of items) seen.current.add(i.id);
    if (fresh.length === 1) setAnnouncement(`New notification: ${fresh[0]?.title ?? ''}`);
    else if (fresh.length > 1) setAnnouncement(plural(fresh.length, 'new notification'));
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = (): void => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const markAll = (): void => {
    if (unread === 0) return;
    onMarkAllRead();
    setAnnouncement(`${plural(unread, 'notification')} marked as read`);
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg className={styles.bell} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3a6 6 0 0 0-6 6v3.5L4.5 16h15L18 12.5V9a6 6 0 0 0-6-6Zm-2 15a2 2 0 0 0 4 0" />
        </svg>
        {/* The name carries the exact count; the badge is capped visually only. */}
        <span className={styles.visuallyHidden}>{unread > 0 ? `${label}, ${unread} unread` : label}</span>
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
          </span>
        )}
      </button>

      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>

      <section id={panelId} className={styles.panel} aria-labelledby={headingId} hidden={!open}>
        <header className={styles.header}>
          <h2 id={headingId} className={styles.heading}>
            {label}
          </h2>
          <span className={styles.summary}>{unread === 0 ? 'All read' : `${unread} unread`}</span>
          <button type="button" className={styles.linkButton} aria-disabled={unread === 0} onClick={markAll}>
            Mark all as read
          </button>
        </header>

        {groups.length === 0 ? (
          <p className={styles.empty}>You're all caught up. New activity will show here.</p>
        ) : (
          <div className={styles.scroll}>
            {groups.map((group) => (
              <section key={group.key} className={styles.group} aria-labelledby={`${id}-${group.key}`}>
                <h3 id={`${id}-${group.key}`} className={styles.groupHeading}>
                  {group.label}
                </h3>
                <ul className={styles.list}>
                  {group.items.map((item) => (
                    <NotificationRow key={item.id} idPrefix={id} item={item} onReadChange={onReadChange} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type RowProps = { idPrefix: string; item: NotificationItem; onReadChange: (id: string, read: boolean) => void };

function NotificationRow({ idPrefix, item, onReadChange }: RowProps): JSX.Element {
  const titleId = `${idPrefix}-${item.id}-title`;
  return (
    <li className={styles.item} data-read={item.read}>
      <span className={styles.dot} aria-hidden="true" />
      <div className={styles.content}>
        <p id={titleId} className={styles.title}>
          {!item.read && <span className={styles.visuallyHidden}>Unread: </span>}
          {item.title}
        </p>
        {item.body && <p className={styles.body}>{item.body}</p>}
        <time className={styles.time} dateTime={item.timestamp}>
          {timeFormat.format(new Date(item.timestamp))}
        </time>
        <div className={styles.actions}>
          {item.action && (
            <button
              type="button"
              className={styles.action}
              aria-describedby={titleId}
              onClick={() => {
                item.action?.onClick();
                if (!item.read) onReadChange(item.id, true);
              }}
            >
              {item.action.label}
            </button>
          )}
          <button type="button" className={styles.linkButton} aria-describedby={titleId} onClick={() => onReadChange(item.id, !item.read)}>
            {item.read ? 'Mark as unread' : 'Mark as read'}
          </button>
        </div>
      </div>
    </li>
  );
}
