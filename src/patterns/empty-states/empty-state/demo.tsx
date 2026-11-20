import { useState } from 'react';
import { EmptyState } from './EmptyState';
import type { EmptyStateProps } from './EmptyState';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

type Variant = EmptyStateProps['variant'];

const LABELS: Record<Variant, string> = {
  'first-use': 'First use',
  'no-results': 'No results',
  error: 'Error',
  'no-access': 'No access',
};

export default function EmptyStateDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const [variant, setVariant] = useState<Variant>('first-use');
  const [filters, setFilters] = useState(3);
  const [log, setLog] = useState('');

  return (
    <div className={demo.stack}>
      <fieldset className={demo.row}>
        <legend className={demo.log}>Variant</legend>
        {(Object.keys(LABELS) as Variant[]).map((key) => (
          <label key={key} className={demo.row}>
            <input type="radio" name="empty-variant" checked={variant === key} onChange={() => setVariant(key)} />
            {LABELS[key]}
          </label>
        ))}
      </fieldset>

      {variant === 'first-use' && (
        <EmptyState
          variant="first-use"
          headingLevel={3}
          title={text('No saved portfolio views yet')}
          description={text('Save a combination of filters and columns to reopen it in one click and share it with your team.')}
          primaryAction={{ label: text('Create a view'), onClick: () => setLog('Opened view builder.') }}
          learnMore={{ label: 'How saved views work', href: '#saved-views' }}
        />
      )}
      {variant === 'no-results' && (
        <EmptyState
          variant="no-results"
          headingLevel={3}
          query={text('halvorsn dairy')}
          activeFilterCount={filters}
          onClearFilters={() => {
            setFilters(0);
            setLog('Filters cleared.');
          }}
          suggestions={['Check the spelling of the borrower name.', 'Search by account number instead.']}
        />
      )}
      {variant === 'error' && (
        <EmptyState
          variant="error"
          headingLevel={3}
          title={text('Payment history could not be loaded')}
          description={text('The servicing system did not respond. Your other data is unaffected.')}
          onRetry={() => setLog('Retrying…')}
          errorReference="SRV-504-7F3A21"
          supportHref="#support"
        />
      )}
      {variant === 'no-access' && (
        <EmptyState variant="no-access" headingLevel={3} resource={text('Credit memos')} ownerName={text('Credit Administration')} requestAccessHref="#request-access" />
      )}
      <p className={demo.log} aria-live="polite">
        {log}
      </p>
    </div>
  );
}
