import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { siteSettingsService } from '../services/siteSettingsService';
import { useTheme } from './ThemeContext';
import {
  applySiteSettings,
  cacheSiteSettings,
  getCachedSiteSettings,
} from '../lib/siteTheme';

const SiteSettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  siteName: null,
  tagline: null,
  accentColorLight: null,
  accentColorDark: null,
};

export function SiteSettingsProvider({ children }) {
  // Seed from the localStorage cache so returning visitors get the custom
  // branding on first paint; the network refresh corrects it a moment later.
  const [settings, setSettings] = useState(() => getCachedSiteSettings() ?? DEFAULT_SETTINGS);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const refresh = useCallback(async () => {
    try {
      const data = await siteSettingsService.get();
      const next = {
        siteName: data?.siteName ?? null,
        tagline: data?.tagline ?? null,
        accentColorLight: data?.accentColorLight ?? null,
        accentColorDark: data?.accentColorDark ?? null,
      };
      cacheSiteSettings(next);
      setSettings(next);
      return next;
    } catch {
      // API unreachable: keep the cached/default branding.
      return settings;
    }
  }, [settings]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applySiteSettings(settings, isDark);
  }, [settings, isDark]);

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

const FALLBACK = { settings: DEFAULT_SETTINGS, refresh: async () => DEFAULT_SETTINGS };

// The hook is co-located with its provider; this only affects fast refresh.
// Components rendered outside the provider (isolated tests) get the default
// branding instead of throwing, mirroring the language fallback in i18n.
// oxlint-disable-next-line react/only-export-components
export const useSiteSettings = () => useContext(SiteSettingsContext) ?? FALLBACK;
