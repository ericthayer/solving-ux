import { useState } from 'react';
import { WizardForm } from './WizardForm';
import type { Values, WizardStep } from './WizardForm';
import demo from '../../demo.module.css';

const steps: WizardStep[] = [
  {
    id: 'borrower',
    title: 'Borrower',
    fields: [
      { name: 'legalName', label: 'Legal entity name', type: 'text', required: true, hint: 'As it appears on your tax filings.' },
      {
        name: 'entityType',
        label: 'Entity type',
        type: 'radio',
        required: true,
        options: [
          { value: 'llc', label: 'Limited liability company' },
          { value: 'coop', label: 'Cooperative' },
          { value: 'sole', label: 'Sole proprietor' },
        ],
      },
      {
        name: 'memberCount',
        label: 'Number of members',
        type: 'number',
        required: true,
        visibleWhen: (v) => v.entityType === 'coop',
        validate: (value) => (Number.isInteger(Number(value)) && Number(value) >= 2 ? null : 'Enter a whole number of 2 or more.'),
      },
      { name: 'taxId', label: 'Tax ID (EIN)', type: 'text', required: true, hint: 'Format: 12-3456789', validate: (v) => (/^\d{2}-\d{7}$/.test(v) ? null : 'Enter the EIN as 2 digits, a hyphen, then 7 digits.') },
    ],
  },
  {
    id: 'request',
    title: 'Request',
    fields: [
      {
        name: 'purpose',
        label: 'Loan purpose',
        type: 'select',
        required: true,
        options: [
          { value: 'equipment', label: 'Equipment' },
          { value: 'operating', label: 'Operating line' },
          { value: 'real-estate', label: 'Real estate' },
        ],
      },
      { name: 'amount', label: 'Requested amount (USD)', type: 'number', required: true, validate: (v) => (Number(v) >= 10000 ? null : 'The minimum request is $10,000.') },
      { name: 'acreage', label: 'Acreage', type: 'number', required: false, visibleWhen: (v) => v.purpose === 'real-estate' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    fields: [
      { name: 'contactEmail', label: 'Contact email', type: 'email', required: true, validate: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Enter an email address like name@example.com.') },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
    ],
  },
];

export default function WizardFormDemo(): JSX.Element {
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
