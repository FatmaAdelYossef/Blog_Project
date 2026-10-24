/**
 * Combine class names, ignoring falsy values.
 *
 * Supports strings, numbers, arrays, and objects whose keys are enabled when
 * their value is truthy. No dependency, no class-name conflict resolution —
 * later utilities are only additive, so pass mutually exclusive utilities from
 * a single place.
 *
 * @param {...(string | number | false | null | undefined | Array<unknown> | Record<string, unknown>)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  const classes = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
      continue;
    }

    if (typeof input === 'object') {
      for (const [className, enabled] of Object.entries(input)) {
        if (enabled) classes.push(className);
      }
    }
  }

  return classes.join(' ');
}
