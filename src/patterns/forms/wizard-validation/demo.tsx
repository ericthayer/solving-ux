import { useMemo, useState } from 'react';
import { WizardForm } from './WizardForm';
import type { Values, WizardStep } from './WizardForm';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const buildSteps = (t: (value: string) => string): WizardStep[] => [
  {
    id: 'borrower',
    title: t('Borrower'),
    fields: [
      { name: 'legalName', label: t('Legal entity name'), type: 'text', required: true, hint: t('As it appears on your tax filings.') },
      {
        name: 'entityType',
        label: t('Entity type'),
        type: 'radio',
        required: true,
        options: [
          { value: 'llc', label: t('Limited liability company') },
          { value: 'coop', label: t('Cooperative') },
          { value: 'sole', label: t('Sole proprietor') },
        ],
      },
      {
        name: 'memberCount',
        label: t('Number of members'),
        type: 'number',
        required: true,
        visibleWhen: (v) => v.entityType === 'coop',
        validate: (value) => (Number.isInteger(Number(value)) && Number(value) >= 2 ? null : 'Enter a whole number of 2 or more.'),
      },
      { name: 'taxId', label: t('Tax ID (EIN)'), type: 'text', required: true, hint: t('Format: 12-3456789'), validate: (v) => (/^\d{2}-\d{7}$/.test(v) ? null : 'Enter the EIN as 2 digits, a hyphen, then 7 digits.') },
    ],
  },
  {
    id: 'request',
    title: t('Request'),
    fields: [
      {
        name: 'purpose',
        label: t('Loan purpose'),
        type: 'select',
        required: true,
        options: [
          { value: 'equipment', label: t('Equipment') },
          { value: 'operating', label: t('Operating line') },
          { value: 'real-estate', label: t('Real estate') },
        ],
      },
      { name: 'amount', label: t('Requested amount (USD)'), type: 'number', required: true, validate: (v) => (Number(v) >= 10000 ? null : 'The minimum request is $10,000.') },
      { name: 'acreage', label: t('Acreage'), type: 'number', required: false, visibleWhen: (v) => v.purpose === 'real-estate' },
    ],
  },
  {
    id: 'contact',
    title: t('Contact'),
    fields: [
      { name: 'contactEmail', label: t('Contact email'), type: 'email', required: true, validate: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Enter an email address like name@example.com.') },
      { name: 'phone', label: t('Phone'), type: 'tel', required: false },
    ],
  },
];

export default function WizardFormDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const steps = useMemo(() => buildSteps(stress.text), [stress.text]);
  const [submitted, setSubmitted] = useState<Values | null>(null);
  const [failNext, setFailNext] = useState(true);

  const onSubmit = async (values: Values): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    // The first attempt fails on purpose so you can see error recovery.
    if (failNext) {
      setFailNext(false);
      throw new Error('Network error');
    }
    setSubmitted(values);
  };

  return (
    <div className={demo.stack}>
      <WizardForm steps={steps} onSubmit={onSubmit} submitLabel="Submit application" />
      {submitted && <pre className={demo.log}>{JSON.stringify(submitted, null, 2)}</pre>}
    </div>
  );
}
