export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Visible focusable descendants of `container`, in DOM order.
 *
 * @param {HTMLElement | null | undefined} container
 * @returns {HTMLElement[]}
 */
export function getFocusableElements(container) {
  if (!container) return [];

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}
