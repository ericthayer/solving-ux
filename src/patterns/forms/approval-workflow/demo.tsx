import { useEffect, useId, useState } from 'react';
import { ApprovalWorkflow, applyDecision } from './ApprovalWorkflow';
import type { ApprovalRequest, Decision } from './ApprovalWorkflow';
import { sampleRequest } from './data';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const USERS = ['Marcus Lee', 'Ana Ruiz', 'Priya Shah'];

export default function ApprovalWorkflowDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const selectId = useId();
  const [request, setRequest] = useState<ApprovalRequest>(() => sampleRequest(stress.text));
  const [user, setUser] = useState(USERS[0]!);

  useEffect(() => setRequest(sampleRequest(stress.text)), [stress.text]);

  const onDecide = async (decision: Decision): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setRequest((r) => applyDecision(r, decision, new Date().toISOString()));
  };

  return (
    <div className={demo.stack}>
      <div className={demo.row}>
        <label htmlFor={selectId}>Signed in as</label>
        <select id={selectId} className={demo.button} value={user} onChange={(e) => setUser(e.target.value)}>
          {USERS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
        <button type="button" className={demo.button} onClick={() => setRequest(sampleRequest(stress.text))}>
          Reset request
        </button>
      </div>
      <ApprovalWorkflow request={request} currentUser={user} onDecide={onDecide} />
    </div>
  );
}
