import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { applyTheme, getInitialTheme, getStoredTheme, storeTheme } from '../lib/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [hasExplicitChoice, setHasExplicitChoice] = useState(() => Boolean(getStoredTheme()));

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (hasExplicitChoice) storeTheme(theme);
  }, [theme, hasExplicitChoice]);

  // Follow the OS preference until the reader picks a theme explicitly.
  useEffect(() => {
    if (hasExplicitChoice || typeof window.matchMedia !== 'function') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setThemeState(event.matches ? 'dark' : 'light');

    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, [hasExplicitChoice]);

  const setTheme = useCallback((next) => {
    setHasExplicitChoice(true);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setHasExplicitChoice(true);
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// The hook is co-located with its provider; this only affects fast refresh.
// oxlint-disable-next-line react/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
