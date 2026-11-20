import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import styles from './ApprovalWorkflow.module.css';

export type ApprovalStatus = 'in-review' | 'changes-requested' | 'approved' | 'rejected';
export type DecisionKind = 'approve' | 'request-changes' | 'reject';
export type EventKind = 'submitted' | 'resubmitted' | 'approved' | 'changes-requested' | 'rejected';

export type HistoryEvent = { id: string; kind: EventKind; actor: string; role: string; at: string; comment?: string };
export type Approver = { name: string; role: string; decision?: 'approved' | 'rejected' };
export type FieldChange = { field: string; from: string; to: string };

export type ApprovalRequest = {
  id: string;
  title: string;
  requester: string;
  status: ApprovalStatus;
  approvers: Approver[];
  history: HistoryEvent[];
  /** What the requester changed since the current approver last looked. Empty on a first review. */
  changesSinceLastReview: FieldChange[];
};

export type Decision = { kind: DecisionKind; comment: string };

export type ApprovalWorkflowProps = {
  request: ApprovalRequest;
  /** Name of the signed-in user. The decision panel shows only when they are the current approver. */
  currentUser: string;
  /** Persist the decision. Reject the promise to keep the form and show a retry message. */
  onDecide: (decision: Decision) => void | Promise<void>;
  locale?: string;
  timeZone?: string;
};

const STATUS: Record<ApprovalStatus, { label: string; icon: string }> = {
  'in-review': { label: 'In review', icon: '◷' },
  'changes-requested': { label: 'Changes requested', icon: '↺' },
  approved: { label: 'Approved', icon: '✓' },
  rejected: { label: 'Rejected', icon: '✕' },
};

const EVENT_VERB: Record<EventKind, string> = {
  submitted: 'Submitted',
  resubmitted: 'Resubmitted',
  approved: 'Approved',
  'changes-requested': 'Requested changes',
  rejected: 'Rejected',
};

const DECISIONS: { kind: DecisionKind; label: string; button: string; consequence: (r: ApprovalRequest, next?: Approver) => string }[] = [
  { kind: 'approve', label: 'Approve', button: 'Approve request', consequence: (r, next) => (next ? `${r.id} moves to ${next.name} (${next.role}).` : `${r.id} is fully approved and ${r.requester} is notified.`) },
  { kind: 'request-changes', label: 'Request changes', button: 'Send back for changes', consequence: (r) => `${r.id} returns to ${r.requester}. Approvals so far are kept.` },
  { kind: 'reject', label: 'Reject', button: 'Reject request', consequence: (r) => `${r.id} closes and cannot be resubmitted. ${r.requester} sees your reason.` },
];

/** The first approver without a decision, or undefined once the chain is complete. */
export const currentApprover = (request: ApprovalRequest): Approver | undefined =>
  request.status === 'in-review' ? request.approvers.find((a) => !a.decision) : undefined;

/** Pure state transition: returns the request after `actor` records `decision` at `at`. */
export function applyDecision(request: ApprovalRequest, decision: Decision, at: string): ApprovalRequest {
  const actor = currentApprover(request);
  if (!actor) return request;
  const kind: EventKind = decision.kind === 'approve' ? 'approved' : decision.kind === 'reject' ? 'rejected' : 'changes-requested';
  const approvers = request.approvers.map((a) => (a === actor && decision.kind !== 'request-changes' ? { ...a, decision: kind as 'approved' | 'rejected' } : a));
  const status: ApprovalStatus =
    decision.kind === 'reject' ? 'rejected' : decision.kind === 'request-changes' ? 'changes-requested' : approvers.every((a) => a.decision) ? 'approved' : 'in-review';
  const event: HistoryEvent = { id: `${request.id}-${request.history.length + 1}`, kind, actor: actor.name, role: actor.role, at, comment: decision.comment.trim() || undefined };
  return { ...request, approvers, status, history: [...request.history, event], changesSinceLastReview: status === 'in-review' ? request.changesSinceLastReview : [] };
}

export function ApprovalWorkflow({ request, currentUser, onDecide, locale = 'en-US', timeZone = 'UTC' }: ApprovalWorkflowProps): JSX.Element {
  const baseId = useId();
  const [kind, setKind] = useState<DecisionKind | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<{ field: 'kind' | 'comment'; message: string } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'pending' | 'failed'>('idle');
  const [announcement, setAnnouncement] = useState('');
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const firstRadioRef = useRef<HTMLInputElement>(null);
  const historyHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusHistory = useRef(false);

  const approver = currentApprover(request);
  const isMyTurn = approver?.name === currentUser;
  const choice = DECISIONS.find((d) => d.kind === kind);
  const nextApprover = approver ? request.approvers[request.approvers.indexOf(approver) + 1] : undefined;
  const needsReason = kind === 'reject' || kind === 'request-changes';
  const when = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone });
  const id = (part: string): string => `${baseId}-${part}`;

  // The decision panel unmounts after a save, so focus moves to the history that now holds the decision.
  useEffect(() => {
    if (!focusHistory.current) return;
    focusHistory.current = false;
    historyHeadingRef.current?.focus();
  }, [request.history.length]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!choice) {
      setError({ field: 'kind', message: 'Choose approve, request changes, or reject.' });
      firstRadioRef.current?.focus();
      return;
    }
    if (needsReason && comment.trim().length < 10) {
      setError({ field: 'comment', message: `Tell ${request.requester} why, in at least 10 characters, so they can act on it.` });
      commentRef.current?.focus();
      return;
    }
    setError(null);
    setSaveState('pending');
    try {
      await onDecide({ kind: choice.kind, comment });
      focusHistory.current = true;
      setAnnouncement(`${choice.label} recorded. ${choice.consequence(request, nextApprover)}`);
      setSaveState('idle');
      setKind(null);
      setComment('');
    } catch {
      setSaveState('failed');
    }
  };

  const status = STATUS[request.status];
  const reasonError = error?.field === 'comment' ? error.message : null;
  const kindError = error?.field === 'kind' ? error.message : null;

  return (
    <article className={styles.root} aria-labelledby={id('title')}>
      <div className={styles.header}>
        <h3 id={id('title')} className={styles.title}>
          {request.id}: {request.title}
        </h3>
        <p className={styles.status} data-status={request.status}>
          <span aria-hidden="true">{status.icon}</span> Status: {status.label}
          {approver && <span className={styles.waiting}>, waiting on {approver.name === currentUser ? 'you' : approver.name}</span>}
        </p>
      </div>

      <section>
        <h4 className={styles.sectionTitle}>Approvers</h4>
        <ol className={styles.chain}>
          {request.approvers.map((a) => (
            <li key={a.name} aria-current={a === approver ? 'step' : undefined} data-decision={a.decision}>
              <span className={styles.chainName}>{a.name}</span> <span className={styles.muted}>{a.role}</span>
              <span className={styles.chainState}>{a.decision ? STATUS[a.decision].label : a === approver ? 'Current' : 'Not yet'}</span>
            </li>
          ))}
        </ol>
      </section>

      {request.changesSinceLastReview.length > 0 && (
        <section className={styles.changes}>
          <h4 className={styles.sectionTitle}>Changed since the last review</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Was</th>
                <th scope="col">Now</th>
              </tr>
            </thead>
            <tbody>
              {request.changesSinceLastReview.map((c) => (
                <tr key={c.field}>
                  <th scope="row">{c.field}</th>
                  <td className={styles.was}>{c.from}</td>
                  <td className={styles.now}>{c.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {isMyTurn && (
        <form className={styles.panel} onSubmit={onSubmit} noValidate>
          <h4 className={styles.sectionTitle}>Your decision</h4>
          <fieldset className={styles.choices} aria-describedby={kindError ? id('kind-error') : undefined}>
            <legend className={styles.legend}>Decision</legend>
            {kindError && <p id={id('kind-error')} className={styles.error}>{kindError}</p>}
            {DECISIONS.map((d, i) => (
              <label key={d.kind} className={styles.choice} data-kind={d.kind}>
                <input ref={i === 0 ? firstRadioRef : undefined} type="radio" name={id('kind')} value={d.kind} checked={kind === d.kind} onChange={() => setKind(d.kind)} />
                {d.label}
              </label>
            ))}
          </fieldset>
          <div className={styles.field}>
            <label htmlFor={id('comment')} className={styles.label}>
              {needsReason ? 'Reason' : 'Comment (optional)'}
            </label>
            <p id={id('comment-hint')} className={styles.hint}>
              {needsReason ? `Required. ${request.requester} sees this in the history.` : 'Shown in the history.'}
            </p>
            {reasonError && <p id={id('comment-error')} className={styles.error}>{reasonError}</p>}
            <textarea
              ref={commentRef}
              id={id('comment')}
              className={styles.textarea}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-required={needsReason || undefined}
              aria-invalid={reasonError ? true : undefined}
              aria-describedby={[id('comment-hint'), reasonError ? id('comment-error') : ''].filter(Boolean).join(' ')}
            />
          </div>
          {choice && <p id={id('consequence')} className={styles.consequence}>{choice.consequence(request, nextApprover)}</p>}
          {saveState === 'failed' && (
            <p role="alert" className={styles.alert}>
              Your decision was not saved. Your comment is still here. Try again.
            </p>
          )}
          <div className={styles.actions}>
            <button type="submit" className={styles.primary} data-kind={kind ?? undefined} disabled={saveState === 'pending'} aria-describedby={choice ? id('consequence') : undefined}>
              {saveState === 'pending' ? 'Saving…' : (choice?.button ?? 'Record decision')}
            </button>
          </div>
        </form>
      )}

      <section>
        <h4 ref={historyHeadingRef} tabIndex={-1} className={styles.sectionTitle}>
          Status history
        </h4>
        <ol className={styles.timeline}>
          {request.history.map((e) => (
            <li key={e.id} data-kind={e.kind}>
              <p className={styles.event}>
                <strong>{EVENT_VERB[e.kind]}</strong> by {e.actor} <span className={styles.muted}>({e.role})</span>
              </p>
              <time className={styles.muted} dateTime={e.at}>{when.format(new Date(e.at))}</time>
              {e.comment && <blockquote className={styles.comment}>{e.comment}</blockquote>}
            </li>
          ))}
        </ol>
      </section>

      <p role="status" className={styles.visuallyHidden}>{announcement}</p>
    </article>
  );
}
