import { useRef, useState } from 'react';
import { StickyFocusLayout } from './StickyFocusLayout';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';
import { useSimulatedViewport } from './viewport';

const FIELDS = [
  { id: 'name', label: 'Project name', value: 'Riverside facility upgrade' },
  { id: 'owner', label: 'Project owner', value: 'Jordan Lee' },
  { id: 'cost-center', label: 'Cost center', value: 'CC-4410' },
  { id: 'start', label: 'Start date', value: '2027-01-11' },
  { id: 'end', label: 'Target end date', value: '2027-06-30' },
  { id: 'region', label: 'Region', value: 'North' },
  { id: 'budget', label: 'Approved budget', value: '240,000' },
  { id: 'approver', label: 'Approver email', value: 'approvals@example.com' },
  { id: 'review', label: 'Next review date', value: '2027-03-01' },
  { id: 'notes', label: 'Notes for reviewers', value: 'Phase two depends on the permit decision.' },
] as const;

export default function StickyFocusDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewportStyle = useSimulatedViewport(frameRef);
  const [pinned, setPinned] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <div className={demo.stack}>
      <p className={demo.panelText}>
        Tab through the form: every field stops clear of the header and the save bar. Set zoom to 400% to see both bars
        let go and scroll with the page. Bars are {pinned ? 'pinned' : 'scrolling with the content'}.
      </p>
      <div ref={frameRef} className={demo.viewport} style={viewportStyle}>
        <StickyFocusLayout
          label="Edit project"
          onPinnedChange={setPinned}
          header={
            <>
              <h3 className={demo.panelTitle}>{stress.text('Edit project')}</h3>
              <span role="status" className={demo.panelText}>
                {saved}
              </span>
            </>
          }
          actions={
            <>
              <button type="button" className={demo.button} onClick={() => setSaved(null)}>
                {stress.text('Cancel')}
              </button>
              <button type="submit" form="sticky-focus-form" className={demo.buttonPrimary}>
                {stress.text('Save changes')}
              </button>
            </>
          }
        >
          <form
            id="sticky-focus-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved('Changes saved.');
            }}
          >
            <fieldset className={demo.formGrid}>
              {FIELDS.map((field) => (
                <div key={field.id} className={demo.formField}>
                  <label htmlFor={`sticky-${field.id}`} className={demo.formLabel}>
                    {stress.text(field.label)}
                  </label>
                  <input id={`sticky-${field.id}`} className={demo.formInput} defaultValue={field.value} />
                </div>
              ))}
            </fieldset>
          </form>
        </StickyFocusLayout>
      </div>
    </div>
  );
}
