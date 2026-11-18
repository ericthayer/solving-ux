import type { PropDoc } from '../types/pattern';

export function PropsTable({ props }: { props: PropDoc[] }): JSX.Element {
  if (props.length === 0) return <p className="text-sm text-muted">No props documented yet.</p>;
  return (
    <div className="overflow-x-auto rounded-md border border-line" tabIndex={0} role="region" aria-label="Props table">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Component props</caption>
        <thead className="bg-sunken">
          <tr>
            {['Prop', 'Type', 'Default', 'Description'].map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap border-b border-line px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name} className="align-top">
              <th scope="row" className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs font-medium">
                {p.name}
                {p.required && (
                  <span className="ml-1 text-danger">
                    <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </span>
                )}
              </th>
              <td className="border-b border-line px-3 py-2 font-mono text-xs text-muted">{p.type}</td>
              <td className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs">{p.defaultValue ?? '–'}</td>
              <td className="border-b border-line px-3 py-2">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
