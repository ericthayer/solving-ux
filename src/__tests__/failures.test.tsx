import { render } from '@testing-library/react';
import { builtInPatterns } from '../patterns/registry';
import { FAILURE_ATTR, HEURISTICS, WCAG_CRITERIA, failureKey, refLabel, refTitle } from '../types/failure';
import { failuresFromText, normalizeFailures } from '../utils/failures';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('structured failures', () => {
  it.each(builtInPatterns.map((p) => [p.id, p] as const))('%s documents every failure with an id, refs, and a target', (_, p) => {
    const ids = p.beforeState.failures.map((f) => f.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of p.beforeState.failures) {
      expect(f.id).toMatch(KEBAB);
      expect(f.description.trim()).not.toBe('');
      expect(f.target.label.trim()).not.toBe('');
      expect(f.refs.length).toBeGreaterThan(0);
      for (const ref of f.refs) {
        if (ref.kind === 'wcag') expect(WCAG_CRITERIA).toHaveProperty([ref.criterion]);
        else expect(HEURISTICS.map((h) => h.id)).toContain(ref.id);
      }
    }
  });

  it.each(builtInPatterns.map((p) => [p.id, p] as const))('%s Before demo marks every immediate target and only known ids', (_, p) => {
    const Before = p.beforeComponent;
    expect(Before).not.toBeNull();
    if (!Before) return;
    const { container, unmount } = render(<Before />);
    const known = new Set(p.beforeState.failures.map((f) => f.id));
    for (const f of p.beforeState.failures.filter((x) => !x.target.revealedBy)) {
      expect(container.querySelector(`[${FAILURE_ATTR}="${f.id}"]`)).not.toBeNull();
    }
    for (const el of container.querySelectorAll(`[${FAILURE_ATTR}]`)) {
      expect(known).toContain(el.getAttribute(FAILURE_ATTR));
    }
    unmount();
  });

  it('formats references and global keys', () => {
    expect(refLabel({ kind: 'wcag', criterion: '1.4.1' })).toBe('WCAG 1.4.1');
    expect(refTitle({ kind: 'wcag', criterion: '1.4.1' })).toBe('1.4.1 Use of Color (A)');
    expect(refTitle({ kind: 'heuristic', id: 'H5' })).toBe('H5 Error prevention');
    expect(failureKey('forms.wizard-validation', 'clears-data')).toBe('forms.wizard-validation#clears-data');
  });

  it('upgrades v1 string failures from localStorage (edge case)', () => {
    const upgraded = normalizeFailures(['Errors vanish.', '', 'Errors vanish.', 42]);
    expect(upgraded.map((f) => f.id)).toEqual(['errors-vanish', 'errors-vanish-2']);
    expect(upgraded[0]).toEqual({ id: 'errors-vanish', description: 'Errors vanish.', refs: [], target: { label: '' } });
    expect(normalizeFailures(undefined)).toEqual([]);
  });

  it('keeps ids and refs for unchanged lines when editing failures as text', () => {
    const previous = [{ id: 'kept', description: 'Old one', refs: [{ kind: 'heuristic', id: 'H1' } as const], target: { label: 'Thing' } }];
    const next = failuresFromText('Old one\n\n New one ', previous);
    expect(next[0]).toEqual(previous[0]);
    expect(next[1]).toEqual({ id: 'new-one', description: 'New one', refs: [], target: { label: '' } });
  });
});
