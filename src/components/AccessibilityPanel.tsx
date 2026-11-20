import type { ReactNode } from 'react';
import type { AccessibilityNote, WcagLevel } from '../types/pattern';

type Of<K extends AccessibilityNote['kind']> = Extract<AccessibilityNote, { kind: K }>;
const pick = <K extends AccessibilityNote['kind']>(notes: AccessibilityNote[], kind: K): Of<K>[] =>
  notes.filter((n): n is Of<K> => n.kind === kind);

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="grid gap-3">
      <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function AccessibilityPanel({ notes, level }: { notes: AccessibilityNote[]; level: WcagLevel }): JSX.Element {
  if (notes.length === 0) return <p className="text-sm text-muted">No accessibility notes recorded yet.</p>;
  const wcag = pick(notes, 'wcag');
  const keyboard = pick(notes, 'keyboard');
  const aria = pick(notes, 'aria');
  const sr = pick(notes, 'screen-reader');

  return (
    <div className="grid gap-8">
      <p className="m-0 text-sm text-muted">
        Target: WCAG 2.2 <strong className="text-ink">{level}</strong>. Verified with jest-axe in the test suite; manual checks cover keyboard
        paths and NVDA, JAWS, and VoiceOver announcements described below.
      </p>
      {wcag.length > 0 && (
        <Section title="Success criteria">
          <ul className="m-0 grid list-none gap-2 p-0">
            {wcag.map((n) => (
              <li key={n.criterion} className="grid grid-cols-[5.5rem_1fr] gap-3 rounded-md border border-line bg-surface p-3 text-sm">
                <span className="font-mono text-xs font-semibold">
                  {n.criterion} <span className="text-muted">({n.level})</span>
                </span>
                <span>
                  <strong className="font-semibold">{n.title}.</strong> {n.detail}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {keyboard.length > 0 && (
        <Section title="Keyboard">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Keyboard interactions</caption>
            <thead>
              <tr>
                <th scope="col" className="w-48 border-b border-line py-2 pr-4 font-semibold">Keys</th>
                <th scope="col" className="border-b border-line py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {keyboard.map((n) => (
                <tr key={n.keys} className="align-top">
                  <th scope="row" className="border-b border-line py-2 pr-4 font-normal">
                    <kbd className="rounded border border-line bg-sunken px-1.5 py-0.5 font-mono text-xs">{n.keys}</kbd>
                  </th>
                  <td className="border-b border-line py-2">{n.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
      {aria.length > 0 && (
        <Section title="ARIA">
          <dl className="m-0 grid gap-2 text-sm">
            {aria.map((n) => (
              <div key={n.attribute} className="grid gap-1 sm:grid-cols-[14rem_1fr] sm:gap-3">
                <dt className="font-mono text-xs font-medium">{n.attribute}</dt>
                <dd className="m-0">{n.detail}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      {sr.length > 0 && (
        <Section title="Screen reader behavior">
          <dl className="m-0 grid gap-2 text-sm">
            {sr.map((n) => (
              <div key={n.title} className="grid gap-1 sm:grid-cols-[14rem_1fr] sm:gap-3">
                <dt className="font-semibold">{n.title}</dt>
                <dd className="m-0">{n.detail}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  );
}
