import { useState } from 'react';
import type { UIEvent } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const TITLES = ['Replace badge reader', 'Update vendor address', 'Renew software license', 'Fix shared printer', 'Grant report access', 'Order replacement laptop'];
const title = (i: number): string => `REQ-${(1001 + i).toString()} ${TITLES[i % TITLES.length] ?? ''}`;
const PAGE_SIZE = 5;
const TOTAL = 57;

function Feed(): JSX.Element {
  const [count, setCount] = useState(8);
  // Appends whenever the reader nears the bottom, so the footer keeps moving away.
  const onScroll = (e: UIEvent<HTMLDivElement>): void => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setCount((c) => Math.min(c + 8, 500));
  };
  return (
    <div className={s.feed} onScroll={onScroll}>
      <ul className={s.list}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className={s.muted}>
            {title(i)}
          </li>
        ))}
      </ul>
      <div className={s.toolbar} {...failureTarget('footer-unreachable')}>
        <a href="#help">Help</a> · <a href="#contact">Contact support</a>
      </div>
    </div>
  );
}

function Catalog(): JSX.Element {
  const [count, setCount] = useState(6);
  return (
    <div className={s.field}>
      <ul className={s.list} {...failureTarget('silent-count')}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>{title(i)}</li>
        ))}
      </ul>
      {count < TOTAL && (
        // New rows render above the button while focus stays on it.
        <button type="button" className={s.btn} onClick={() => setCount((c) => Math.min(c + 6, TOTAL))} {...failureTarget('load-more-focus')}>
          Load more
        </button>
      )}
    </div>
  );
}

function Queue(): JSX.Element {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const pages = Math.ceil(TOTAL / PAGE_SIZE);

  if (open !== null) {
    return (
      <div className={s.field}>
        <span>{title(open)}</span>
        <button
          type="button"
          className={s.btn}
          onClick={() => {
            setOpen(null);
            setPage(0); // Back always lands on page 1.
          }}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className={s.field}>
      <ul className={s.list}>
        {Array.from({ length: PAGE_SIZE }, (_, k) => page * PAGE_SIZE + k)
          .filter((i) => i < TOTAL)
          .map((i, k) => (
            <li key={i}>
              <a href={`#req-${i}`} onClick={(e) => {
                  e.preventDefault();
                  setOpen(i);
                }} {...(k === 0 ? failureTarget('position-lost') : {})}>
                {title(i)}
              </a>
            </li>
          ))}
      </ul>
      <div className={s.toolbar}>
        {Array.from({ length: pages }, (_, p) => (
          <span
            key={p}
            className={p === page ? s.pageLinkCurrent : s.pageLink}
            onClick={() => setPage(p)}
            {...(p === page ? failureTarget('page-current') : p === 1 ? failureTarget('page-keyboard') : {})}
          >
            {p + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PagedListBefore(): JSX.Element {
  return (
    <div className={s.frame}>
      <p className={s.cardTitle}>Activity feed</p>
      <Feed />
      <p className={s.cardTitle}>Request catalog</p>
      <Catalog />
      <p className={s.cardTitle}>Work queue</p>
      <Queue />
    </div>
  );
}
