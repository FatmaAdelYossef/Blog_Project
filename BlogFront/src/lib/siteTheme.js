// Applies the blog owner's accent colors on top of the design tokens in
// index.css. Custom values are set as inline custom properties on <html>,
// which outrank both the :root and .dark stylesheet rules, so the same code
// path serves light and dark mode — the caller picks which accent applies.

export const SITE_SETTINGS_KEY = 'site-settings';

const ACCENT_VARS = ['--color-accent', '--color-accent-hover', '--color-accent-soft'];

export function getCachedSiteSettings() {
  try {
    const raw = localStorage.getItem(SITE_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function cacheSiteSettings(settings) {
  try {
    if (settings) {
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
    } else {
      localStorage.removeItem(SITE_SETTINGS_KEY);
    }
  } catch {
    // Storage unavailable (private mode): theming still works in-memory.
  }
}

function accentVars(hex, isDark) {
  return {
    '--color-accent': hex,
    '--color-accent-hover': isDark
      ? `color-mix(in srgb, ${hex} 85%, white)`
      : `color-mix(in srgb, ${hex} 78%, black)`,
    '--color-accent-soft': isDark
      ? `color-mix(in srgb, ${hex} 16%, #12100e)`
      : `color-mix(in srgb, ${hex} 10%, #ffffff)`,
  };
}

/**
 * Sets or clears the accent custom properties for the active theme.
 * Dark mode prefers accentColorDark and falls back to the light accent;
 * light mode only uses accentColorLight so a dark-only choice never leaks
 * into the light palette.
 */
export function applySiteSettings(settings, isDark) {
  const root = document.documentElement;
  const accent = isDark
    ? settings?.accentColorDark || settings?.accentColorLight
    : settings?.accentColorLight;

  if (!accent) {
    ACCENT_VARS.forEach((name) => root.style.removeProperty(name));
    return;
  }

  for (const [name, value] of Object.entries(accentVars(accent, isDark))) {
    root.style.setProperty(name, value);
  }
}
