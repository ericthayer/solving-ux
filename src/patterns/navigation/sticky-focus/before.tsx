import { useRef } from 'react';
import { failureTarget } from '../../../types/failure';
import s from '../../before.module.css';
import { useSimulatedViewport } from './viewport';

/** Deliberately broken. Reproduces beforeState.failures in ./pattern.ts; do not copy. */
const FIELDS = [
  'Project name',
  'Project owner',
  'Cost center',
  'Start date',
  'Target end date',
  'Region',
  'Approved budget',
  'Approver email',
  'Next review date',
  'Notes for reviewers',
];

export default function StickyFocusBefore(): JSX.Element {
  const frameRef = useRef<HTMLDivElement>(null);
  const viewportStyle = useSimulatedViewport(frameRef);

  return (
    <div ref={frameRef} className={s.frame}>
      <p className={s.muted}>Tab through the form, then set zoom to 400%.</p>
      <div className={s.stickyPage} style={viewportStyle} {...failureTarget('pinned-at-zoom')}>
        <div className={s.stickyTop} {...failureTarget('hidden-under-header')}>
          Edit project
        </div>
        {/* Save bar markup sits before the form so it "stays on top"; order: 99 moves it visually. */}
        <div className={s.stickyBottom} {...failureTarget('hidden-under-save-bar')}>
          <button type="button" className={s.btn}>
            Cancel
          </button>
          <button type="button" className={s.btnPrimary} {...failureTarget('save-first')}>
            Save
          </button>
        </div>
        <div className={s.stickyBody}>
          {FIELDS.map((label, i) => (
            <div key={label} className={s.field}>
              <label htmlFor={`before-sticky-${i}`}>{label}</label>
              <input id={`before-sticky-${i}`} className={s.input} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
