import { useMemo, useState } from 'react';
import { TransferList } from './TransferList';
import type { TransferItem } from './TransferList';
import { LARGE_DATA_COUNT, useStressTest } from '../../stress';

const FIRST = ['Avery', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Quinn', 'Reese', 'Skyler', 'Rowan', 'Emerson', 'Harper'];
const LAST = ['Patel', 'Nguyen', 'Garcia', 'Okafor', 'Lindqvist', 'Moreau', 'Kim', 'Haddad', 'Silva', 'Novak'];
const TEAMS = ['Operations', 'Finance', 'Procurement', 'Customer Support', 'Engineering', 'Legal'];

const BASE_COUNT = 48;

function buildPeople(count: number, text: (value: string) => string): TransferItem[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length] ?? 'Avery';
    const last = LAST[Math.floor(i / FIRST.length) % LAST.length] ?? 'Patel';
    const suffix = i >= FIRST.length * LAST.length ? ` ${Math.floor(i / (FIRST.length * LAST.length)) + 1}` : '';
    return {
      id: `U${(1000 + i).toString()}`,
      label: text(`${first} ${last}${suffix}`),
      description: `${TEAMS[i % TEAMS.length] ?? 'Operations'} · ${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    };
  });
}

export default function TransferListDemo(): JSX.Element {
  const stress = useStressTest(['longText', 'largeData']);
  const people = useMemo(() => buildPeople(stress.largeData ? LARGE_DATA_COUNT : BASE_COUNT, stress.text), [stress.largeData, stress.text]);
  const [assigned, setAssigned] = useState<string[]>(['U1002', 'U1005', 'U1013']);

  return (
    <TransferList
      label="Reviewer role members"
      hint="Reviewers can approve requests for their team."
      items={people}
      value={assigned}
      onChange={setAssigned}
      noun={{ one: 'person', other: 'people' }}
    />
  );
}
