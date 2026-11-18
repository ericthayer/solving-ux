import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NestedNav, findPath } from './NestedNav';
import type { NavItem } from './NestedNav';

expect.extend(toHaveNoViolations);

const items: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  {
    id: 'lending',
    label: 'Lending',
    href: '/lending',
    children: [
      {
        id: 'applications',
        label: 'Applications',
        children: [
          { id: 'pending', label: 'Pending', href: '/lending/applications/pending' },
          { id: 'approved', label: 'Approved', href: '/lending/applications/approved' },
        ],
      },
      { id: 'servicing', label: 'Servicing', href: '/lending/servicing' },
    ],
  },
  { id: 'reports', label: 'Reports', children: [{ id: 'monthly', label: 'Monthly', href: '/reports/monthly' }] },
];

function setup(currentId = 'pending', onNavigate = jest.fn()) {
  const user = userEvent.setup();
  render(<NestedNav label="Main" items={items} currentId={currentId} onNavigate={onNavigate} />);
  return { user, onNavigate };
}

describe('NestedNav', () => {
  it('renders the navigation landmark with the current page marked', () => {
    setup();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Pending' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens ancestors of the current page and keeps unrelated groups closed', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Lending' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Applications' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Reports' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Monthly' })).not.toBeInTheDocument();
  });

  it('builds a breadcrumb trail with only linkable ancestors as links', () => {
    setup();
    const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getAllByRole('listitem');
    expect(crumbs.map((li) => li.textContent)).toEqual(['Lending', 'Applications', 'Pending']);
    expect(within(crumbs[0]!).getByRole('link')).toHaveAttribute('href', '/lending');
    expect(within(crumbs[1]!).queryByRole('link')).not.toBeInTheDocument();
    expect(within(crumbs[2]!).getByText('Pending')).toHaveAttribute('aria-current', 'page');
  });

  it('expands a group with the keyboard and links aria-controls to the revealed list', async () => {
    const { user } = setup();
    const reports = screen.getByRole('button', { name: 'Reports' });
    reports.focus();
    await user.keyboard('{Enter}');
    expect(reports).toHaveAttribute('aria-expanded', 'true');
    const list = document.getElementById(reports.getAttribute('aria-controls') ?? '');
    expect(list).toContainElement(screen.getByRole('link', { name: 'Monthly' }));
  });

  it('collapses the enclosing group on Escape and returns focus to its toggle', async () => {
    const { user } = setup();
    screen.getByRole('link', { name: 'Approved' }).focus();
    await user.keyboard('{Escape}');
    const toggle = screen.getByRole('button', { name: 'Applications' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('calls onNavigate instead of following the link', async () => {
    const { user, onNavigate } = setup();
    await user.click(screen.getByRole('link', { name: 'Servicing' }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'servicing' }));
  });

  it('renders no breadcrumb when the current id is unknown (edge case)', () => {
    setup('missing');
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lending' })).toHaveAttribute('aria-expanded', 'false');
    expect(findPath(items, 'missing')).toBeNull();
  });

  it('has no axe violations', async () => {
    setup();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
