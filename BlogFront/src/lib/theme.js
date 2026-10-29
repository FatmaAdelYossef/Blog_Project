export const THEME_KEY = 'theme';

const isTheme = (value) => value === 'light' || value === 'dark';

export function getStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getInitialTheme() {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable: the theme still applies for this tab.
  }
}
