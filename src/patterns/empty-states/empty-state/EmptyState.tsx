import { useId, useState } from 'react';
import styles from './EmptyState.module.css';

type Action = { label: string; onClick: () => void };
type LinkAction = { label: string; href: string };

type Common = {
  /** Match the surrounding outline. Use 1 when the state is the whole page. Defaults to 2. */
  headingLevel?: 1 | 2 | 3 | 4;
};

export type EmptyStateProps = Common &
  (
    | { variant: 'first-use'; title: string; description: string; primaryAction: Action; learnMore?: LinkAction }
    | { variant: 'no-results'; query?: string; activeFilterCount: number; onClearFilters: () => void; suggestions?: string[] }
    | { variant: 'error'; title?: string; description: string; onRetry: () => void; errorReference?: string; supportHref?: string }
    | { variant: 'no-access'; resource: string; ownerName?: string; requestAccessHref: string }
  );

const ICONS: Record<EmptyStateProps['variant'], string> = {
  'first-use': 'M12 5v14M5 12h14',
  'no-results': 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4',
  error: 'M12 8v5m0 3h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  'no-access': 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
};

export function EmptyState(props: EmptyStateProps): JSX.Element {
  const headingId = useId();
  const [copied, setCopied] = useState(false);
  const Heading = `h${props.headingLevel ?? 2}` as 'h1' | 'h2' | 'h3' | 'h4';

  const copyReference = async (reference: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  let title: string;
  let body: JSX.Element;
  let role: 'status' | 'alert' | undefined;

  switch (props.variant) {
    case 'first-use':
      title = props.title;
      body = (
        <>
          <p>{props.description}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={props.primaryAction.onClick}>
              {props.primaryAction.label}
            </button>
            {props.learnMore && (
              <a className={styles.link} href={props.learnMore.href}>
                {props.learnMore.label}
              </a>
            )}
          </div>
        </>
      );
      break;
    case 'no-results':
      role = 'status';
      title = props.query ? `No results for “${props.query}”` : 'No matching results';
      body = (
        <>
          <p>
            {props.activeFilterCount > 0
              ? `${props.activeFilterCount} ${props.activeFilterCount === 1 ? 'filter is' : 'filters are'} narrowing these results.`
              : 'Check the spelling or try a broader term.'}
          </p>
          {props.suggestions && props.suggestions.length > 0 && (
            <ul className={styles.suggestions}>
              {props.suggestions.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
          {props.activeFilterCount > 0 && (
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={props.onClearFilters}>
                Clear {props.activeFilterCount === 1 ? 'filter' : `all ${props.activeFilterCount} filters`}
              </button>
            </div>
          )}
        </>
      );
      break;
    case 'error': {
      role = 'alert';
      title = props.title ?? 'This data could not be loaded';
      const reference = props.errorReference;
      body = (
        <>
          <p>{props.description}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={props.onRetry}>
              Try again
            </button>
            {props.supportHref && (
              <a className={styles.link} href={props.supportHref}>
                Contact support
              </a>
            )}
          </div>
          {reference && (
            <p className={styles.reference}>
              Reference: <code>{reference}</code>{' '}
              <button type="button" className={styles.linkButton} onClick={() => void copyReference(reference)}>
                {copied ? 'Copied' : 'Copy'}
                <span className={styles.visuallyHidden}> error reference</span>
              </button>
            </p>
          )}
        </>
      );
      break;
    }
    case 'no-access':
      title = `You do not have access to ${props.resource}`;
      body = (
        <>
          <p>{props.ownerName ? `${props.ownerName} manages access to this area.` : 'An administrator manages access to this area.'}</p>
          <div className={styles.actions}>
            <a className={styles.primaryLink} href={props.requestAccessHref}>
              Request access
            </a>
          </div>
        </>
      );
      break;
  }

  return (
    <section className={styles.root} data-variant={props.variant} aria-labelledby={headingId}>
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={ICONS[props.variant]} />
      </svg>
      <div className={styles.content} role={role}>
        <Heading id={headingId} className={styles.title}>
          {title}
        </Heading>
        {body}
      </div>
    </section>
  );
}
