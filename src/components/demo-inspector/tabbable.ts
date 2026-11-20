/**
 * Tab-order resolution for the demo inspector. Pure DOM utilities, no React.
 * Mirrors the browser's sequential focus navigation closely enough to audit a demo:
 * positive tabindex first (ascending, ties in DOM order), then tabindex 0 / native focusables in DOM order.
 */

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

export type TabStop = {
  /** 1-based position in the sequential focus order. */
  order: number;
  element: HTMLElement;
  /** Accessible-ish name for status text; best effort, not a full accname computation. */
  label: string;
  /** True when the stop uses tabindex > 0, which breaks the natural reading order. */
  positiveTabIndex: boolean;
};

function isDisabled(el: HTMLElement): boolean {
  if ('disabled' in el && (el as HTMLButtonElement).disabled) return true;
  // Controls inside a disabled fieldset are disabled, except those in its first legend.
  const fieldset = el.closest('fieldset:disabled');
  if (!fieldset) return false;
  const legend = fieldset.querySelector(':scope > legend');
  return !(legend && legend.contains(el));
}

function isHidden(el: HTMLElement, root: HTMLElement): boolean {
  if (el.closest('[inert]') || el.closest('[hidden]')) return true;
  // Content of a closed <details> is not focusable, except its own <summary>.
  const details = el.parentElement?.closest('details:not([open])');
  if (details && root.contains(details)) {
    const summary = details.querySelector(':scope > summary');
    if (!(summary && (summary === el || summary.contains(el)))) return true;
  }
  if (typeof el.checkVisibility === 'function') {
    return !el.checkVisibility({ visibilityProperty: true } as CheckVisibilityOptions);
  }
  return false;
}

function isModal(el: Element): boolean {
  try {
    return el.matches(':modal');
  } catch {
    return false;
  }
}

/** The element focus is currently confined to: an open modal dialog inside root, else root. */
export function resolveFocusScope(root: HTMLElement): HTMLElement {
  const modal = Array.from(root.querySelectorAll<HTMLElement>('dialog[open]')).find(isModal);
  return modal ?? root;
}

export function labelFor(el: HTMLElement): string {
  const aria = el.getAttribute('aria-label');
  if (aria) return aria.trim();
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const text = labelledby
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
    if (text) return text;
  }
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    const label = el.labels?.[0]?.textContent?.trim();
    if (label) return label;
    if ('placeholder' in el && el.placeholder) return el.placeholder;
  }
  const text = el.textContent?.replace(/\s+/g, ' ').trim();
  if (text) return text.length > 48 ? `${text.slice(0, 47)}…` : text;
  return el.tagName.toLowerCase();
}

/** Ordered list of sequential-focus stops within the active focus scope of root. */
export function getTabStops(root: HTMLElement): TabStop[] {
  const scope = resolveFocusScope(root);
  const candidates = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !isDisabled(el) && !isHidden(el, scope),
  );

  // A radio group contributes one stop: the checked radio, else the first in the group.
  const seenRadioGroups = new Set<string>();
  const filtered = candidates.filter((el) => {
    if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) return true;
    const key = `${el.form?.id ?? ''}::${el.name}`;
    if (seenRadioGroups.has(key)) return false;
    const group = candidates.filter(
      (c): c is HTMLInputElement => c instanceof HTMLInputElement && c.type === 'radio' && c.name === el.name && c.form === el.form,
    );
    const checked = group.find((r) => r.checked);
    if (checked && checked !== el) return false;
    seenRadioGroups.add(key);
    return true;
  });

  const positive = filtered
    .map((element, index) => ({ element, index }))
    .filter(({ element }) => element.tabIndex > 0)
    .sort((a, b) => a.element.tabIndex - b.element.tabIndex || a.index - b.index)
    .map(({ element }) => element);
  const natural = filtered.filter((el) => el.tabIndex === 0);

  return [...positive, ...natural].map((element, i) => ({
    order: i + 1,
    element,
    label: labelFor(element),
    positiveTabIndex: element.tabIndex > 0,
  }));
}
