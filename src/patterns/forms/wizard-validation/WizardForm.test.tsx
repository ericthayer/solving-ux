import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { WizardForm, validateFields } from './WizardForm';
import type { WizardStep } from './WizardForm';

expect.extend(toHaveNoViolations);

const steps: WizardStep[] = [
  {
    id: 'entity',
    title: 'Entity',
    fields: [
      { name: 'legalName', label: 'Legal name', type: 'text', required: true },
      {
        name: 'entityType',
        label: 'Entity type',
        type: 'radio',
        required: true,
        options: [
          { value: 'llc', label: 'LLC' },
          { value: 'partnership', label: 'Partnership' },
        ],
      },
      {
        name: 'members',
        label: 'Member count',
        type: 'number',
        required: true,
        visibleWhen: (v) => v.entityType === 'partnership',
        validate: (value) => (Number(value) < 2 ? 'A partnership needs at least 2 partners.' : null),
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    fields: [{ name: 'email', label: 'Email', type: 'email', required: true, validate: (v) => (v.includes('@') ? null : 'Enter an email address like name@example.com.') }],
  },
];

function setup(onSubmit = jest.fn()) {
  const user = userEvent.setup();
  render(<WizardForm steps={steps} onSubmit={onSubmit} />);
  return { user, onSubmit };
}

describe('WizardForm', () => {
  it('renders the first step with progress and labelled fields', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Step 1 of 3: Entity' })).toBeInTheDocument();
    const progress = screen.getByRole('list', { name: 'Progress' });
    expect(within(progress).getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByLabelText('Legal name')).toBeInTheDocument();
  });

  it('shows an error summary, focuses it, and links each error to its field', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const summary = screen.getByRole('heading', { name: 'Fix 2 problems to continue' }).parentElement!;
    expect(summary).toHaveFocus();
    const input = screen.getByLabelText('Legal name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter legal name.');
    expect(screen.getByText('Select entity type.')).toBeInTheDocument();

    await user.click(within(summary).getByRole('link', { name: /Legal name/ }));
    expect(input).toHaveFocus();
  });

  it('validates on blur and clears the error once fixed', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('Legal name'));
    await user.tab();
    expect(screen.getByText('Enter legal name.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Legal name'), 'Cedar Ridge');
    expect(screen.queryByText('Enter legal name.')).not.toBeInTheDocument();
  });

  it('reveals a conditional field and completes the flow with the keyboard', async () => {
    const { user, onSubmit } = setup();
    await user.type(screen.getByLabelText('Legal name'), 'Apex Industrial');
    await user.click(screen.getByLabelText('Partnership'));
    await user.type(screen.getByLabelText('Member count'), '40');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Step 2 of 3: Contact' })).toHaveFocus();

    await user.type(screen.getByLabelText('Email'), 'ops@apexindustrial.example{Enter}');
    expect(screen.getByText('Apex Industrial')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith({ legalName: 'Apex Industrial', entityType: 'partnership', members: '40', email: 'ops@apexindustrial.example' });
    expect(await screen.findByRole('status')).toHaveTextContent('Submitted');
  });

  it('skips validation for a hidden conditional field (edge case)', () => {
    const values = { legalName: 'X', entityType: 'llc', members: '1' };
    expect(validateFields(steps[0]!.fields, values)).toEqual({});
  });

  it('keeps entered data and shows a recoverable error when submit fails (edge case)', async () => {
    const { user } = setup(jest.fn().mockRejectedValue(new Error('offline')));
    await user.type(screen.getByLabelText('Legal name'), 'Halvorsen');
    await user.click(screen.getByLabelText('LLC'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nothing you entered was lost');
    expect(screen.getByText('Halvorsen')).toBeInTheDocument();
  });

  it('has no axe violations with errors showing', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
