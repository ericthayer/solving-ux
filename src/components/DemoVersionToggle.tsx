import { useId } from 'react';

export const DEMO_VERSIONS = ['before', 'after'] as const;
export type DemoVersion = (typeof DEMO_VERSIONS)[number];

const LABELS: Record<DemoVersion, string> = { before: 'Before · broken', after: 'After · fixed' };

export const isDemoVersion = (value: string | null): value is DemoVersion => DEMO_VERSIONS.includes(value as DemoVersion);

type DemoVersionToggleProps = {
  value: DemoVersion;
  onChange: (version: DemoVersion) => void;
};

/** Segmented radio group that swaps the live demo between the broken Before and the fixed After. */
export function DemoVersionToggle({ value, onChange }: DemoVersionToggleProps): JSX.Element {
  const name = useId();
  return (
    <fieldset className="m-0 inline-flex rounded-md border border-line bg-surface p-0.5 text-sm">
      <legend className="sr-only">Demo version</legend>
      {DEMO_VERSIONS.map((version) => (
        <label
          key={version}
          className={`cursor-pointer rounded px-3 py-1 font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--sux-focus)] ${
            value === version ? (version === 'before' ? 'bg-danger text-surface' : 'bg-ink text-surface') : 'text-muted hover:text-ink'
          }`}
        >
          <input type="radio" name={name} value={version} checked={value === version} onChange={() => onChange(version)} className="sr-only" />
          {LABELS[version]}
        </label>
      ))}
    </fieldset>
  );
}
