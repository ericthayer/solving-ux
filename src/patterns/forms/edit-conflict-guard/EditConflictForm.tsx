import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import styles from './EditConflictForm.module.css';

export type FieldDef = { name: string; label: string; multiline?: boolean };
export type Values = Record<string, string>;
export type VersionedRecord = { version: number; values: Values; updatedBy?: string };
export type SaveResult = { status: 'saved'; record: VersionedRecord } | { status: 'conflict'; latest: VersionedRecord };

export type EditConflictFormProps = {
  title: string;
  fields: FieldDef[];
  /** Server copy at load time. Re-key the component to load a different record. */
  record: VersionedRecord;
  /** Send baseVersion so the server can refuse a stale write instead of overwriting it. */
  onSave: (values: Values, baseVersion: number) => Promise<SaveResult>;
  /** Where the user is trying to go (in-app route change). null when nothing is pending. */
  pendingNavigation?: string | null;
  /** true: let the navigation happen. false: stay on the form. */
  onNavigationResolved?: (allow: boolean) => void;
};

type Choice = 'mine' | 'theirs';
type Conflict = { by: string; mine: Values; theirs: Values; fields: string[]; merged: string[]; choices: Record<string, Choice> };

/** A field is in conflict only when both sides changed it and ended up with different text. */
function diffAgainst(base: Values, draft: Values, latest: Values, names: string[]): Omit<Conflict, 'by' | 'choices'> & { next: Values } {
  const next = { ...draft };
  const fields: string[] = [];
  const merged: string[] = [];
  for (const name of names) {
    const mineChanged = draft[name] !== base[name];
    const theirsChanged = latest[name] !== base[name];
    if (mineChanged && theirsChanged && draft[name] !== latest[name]) fields.push(name);
    else if (theirsChanged && !mineChanged) {
      next[name] = latest[name] ?? '';
      merged.push(name);
    }
  }
  return { next, fields, merged, mine: { ...draft }, theirs: { ...latest } };
}

const listLabels = (labels: string[]): string =>
  labels.length < 2 ? (labels[0] ?? '') : `${labels.slice(0, -1).join(', ')} and ${labels.at(-1) ?? ''}`;

export function EditConflictForm({ title, fields, record, onSave, pendingNavigation = null, onNavigationResolved }: EditConflictFormProps): JSX.Element {
  const id = useId();
  const [base, setBase] = useState<VersionedRecord>(record);
  const [draft, setDraft] = useState<Values>(record.values);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [saving, setSaving] = useState(false);
  // Transient messages (saved, conflict, nothing to save). Cleared on the next edit.
  const [notice, setNotice] = useState<string | null>(null);
  const conflictHeadingRef = useRef<HTMLHeadingElement>(null);
  const leaveRef = useRef<HTMLDialogElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const focusConflictRef = useRef(false);

  const labelOf = (name: string): string => fields.find((f) => f.name === name)?.label ?? name;
  const changed = fields.filter((f) => draft[f.name] !== base.values[f.name]).map((f) => f.name);
  // Dirty means "differs from the server copy", not "was touched". Typing then undoing is clean.
  const dirty = changed.length > 0 || conflict !== null;
  const count = `${changed.length} unsaved ${changed.length === 1 ? 'change' : 'changes'}.`;
  // The text only changes when the count changes, so typing does not re-announce on every key.
  const status = saving ? 'Saving…' : (notice ?? (changed.length ? count : 'No unsaved changes.'));

  useEffect(() => {
    if (!dirty) return undefined;
    // Only registered while dirty, so a clean form never triggers the browser's leave prompt.
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Move focus to the conflict heading once it has rendered, so the user lands on the explanation.
  useEffect(() => {
    if (!conflict || !focusConflictRef.current) return;
    focusConflictRef.current = false;
    conflictHeadingRef.current?.focus();
  }, [conflict]);

  useEffect(() => {
    if (pendingNavigation === null) return;
    if (!dirty) {
      onNavigationResolved?.(true);
      return;
    }
    const dialog = leaveRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      keepEditingRef.current?.focus();
    }
  }, [pendingNavigation]);

  const closeLeave = (allow: boolean): void => {
    leaveRef.current?.close();
    onNavigationResolved?.(allow);
  };

  const save = async (): Promise<boolean> => {
    if (conflict && conflict.fields.some((name) => !conflict.choices[name])) {
      setNotice('Choose which version to keep for every field in conflict.');
      conflictHeadingRef.current?.focus();
      return false;
    }
    if (!dirty) {
      setNotice('No changes to save.');
      return true;
    }
    setSaving(true);
    try {
      const result = await onSave(draft, base.version);
      if (result.status === 'saved') {
        setBase(result.record);
        setDraft(result.record.values);
        setConflict(null);
        setNotice('All changes saved.');
        return true;
      }
      const names = fields.map((f) => f.name);
      const diff = diffAgainst(base.values, draft, result.latest.values, names);
      const by = result.latest.updatedBy ?? 'Someone';
      // Their version becomes the new base, so the next save is checked against it.
      setBase(result.latest);
      setDraft(diff.next);
      setConflict({ by, mine: diff.mine, theirs: diff.theirs, fields: diff.fields, merged: diff.merged, choices: {} });
      setNotice(
        diff.fields.length
          ? `${by} changed this record while you were editing. ${diff.fields.length} ${diff.fields.length === 1 ? 'field needs' : 'fields need'} your decision.`
          : `${by} changed this record while you were editing. Their changes were merged in. Save again to keep yours.`,
      );
      focusConflictRef.current = true;
      return false;
    } catch {
      setNotice('Could not save. Your changes are still here. Try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const choose = (name: string, choice: Choice): void => {
    if (!conflict) return;
    setNotice(null);
    setConflict({ ...conflict, choices: { ...conflict.choices, [name]: choice } });
    setDraft((d) => ({ ...d, [name]: (choice === 'mine' ? conflict.mine[name] : conflict.theirs[name]) ?? '' }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!saving) void save();
  };

  const conflictFields = conflict?.fields ?? [];

  return (
    <form className={styles.root} onSubmit={onSubmit} aria-labelledby={`${id}-title`} noValidate>
      <header className={styles.header}>
        <h3 id={`${id}-title`} className={styles.title}>
          {title}
        </h3>
        <p role="status" className={styles.status} data-dirty={dirty || undefined}>
          {status}
        </p>
      </header>

      {conflict && (
        <section className={styles.conflict} aria-labelledby={`${id}-conflict`}>
          <h4 id={`${id}-conflict`} ref={conflictHeadingRef} tabIndex={-1} className={styles.conflictTitle}>
            {conflict.by} saved changes while you were editing
          </h4>
          {conflict.merged.length > 0 && (
            <p className={styles.note}>Merged from {conflict.by}: {listLabels(conflict.merged.map(labelOf))}. Your other edits are kept.</p>
          )}
          {conflictFields.map((name) => (
            <fieldset key={name} className={styles.choice}>
              <legend className={styles.legend}>{labelOf(name)}</legend>
              {(['mine', 'theirs'] as const).map((side) => (
                <label key={side} className={styles.option}>
                  <input type="radio" name={`${id}-${name}`} checked={conflict.choices[name] === side} onChange={() => choose(name, side)} />
                  <span>
                    <strong>{side === 'mine' ? 'Keep mine' : `Keep ${conflict.by}'s`}</strong>
                    <span className={styles.value}>{(side === 'mine' ? conflict.mine[name] : conflict.theirs[name]) || '(empty)'}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          ))}
        </section>
      )}

      {fields.map((field) => {
        const inputId = `${id}-${field.name}`;
        const isChanged = changed.includes(field.name);
        const shared = {
          id: inputId,
          className: styles.input,
          value: draft[field.name] ?? '',
          'aria-describedby': isChanged ? `${inputId}-changed` : undefined,
          onChange: (event: { target: { value: string } }) => {
            setNotice(null);
            setDraft((d) => ({ ...d, [field.name]: event.target.value }));
          },
        };
        return (
          <div key={field.name} className={styles.field} data-changed={isChanged || undefined}>
            <label htmlFor={inputId} className={styles.label}>
              {field.label}
            </label>
            {field.multiline ? <textarea rows={3} {...shared} /> : <input type="text" {...shared} />}
            {isChanged && (
              <span id={`${inputId}-changed`} className={styles.changed}>
                Unsaved change
              </span>
            )}
          </div>
        );
      })}

      <div className={styles.footer}>
        <button type="submit" className={styles.primary} disabled={saving}>
          {saving ? 'Saving…' : conflict ? 'Save merged version' : 'Save changes'}
        </button>
      </div>

      <dialog
        ref={leaveRef}
        className={styles.dialog}
        aria-labelledby={`${id}-leave`}
        aria-describedby={`${id}-leave-desc`}
        onCancel={(event) => {
          event.preventDefault();
          closeLeave(false);
        }}
      >
        <h4 id={`${id}-leave`} className={styles.conflictTitle}>
          Leave with unsaved changes?
        </h4>
        <p id={`${id}-leave-desc`} className={styles.note}>
          You changed {listLabels(changed.map(labelOf)) || 'this record'}. {pendingNavigation ? `Going to ${pendingNavigation} will discard them.` : ''}
        </p>
        <div className={styles.footer}>
          <button ref={keepEditingRef} type="button" className={styles.secondary} onClick={() => closeLeave(false)}>
            Keep editing
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setDraft(base.values);
              setConflict(null);
              setNotice(null);
              closeLeave(true);
            }}
          >
            Discard changes
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={saving}
            onClick={() => {
              void save().then((ok) => closeLeave(ok));
            }}
          >
            Save and leave
          </button>
        </div>
      </dialog>
    </form>
  );
}
