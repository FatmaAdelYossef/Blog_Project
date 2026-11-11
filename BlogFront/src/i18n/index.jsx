import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import ar from './ar';

const DICTIONARIES = { en, ar };
const STORAGE_KEY = 'blog-language';

const LanguageContext = createContext(null);

const readStoredLang = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
};

const interpolate = (template, vars) => {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    vars[name] !== undefined ? String(vars[name]) : match,
  );
};

// Fallback used when a component renders outside LanguageProvider (tests,
// isolated mounts): always English so existing tests stay stable.
const fallbackT = (key, vars) => interpolate(en[key] ?? key, vars);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((next) => {
    const value = next === 'ar' ? 'ar' : 'en';
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage unavailable (private mode); the choice just won't persist.
    }
    setLangState(value);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next = current === 'ar' ? 'en' : 'ar';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = DICTIONARIES[lang] ?? en;
      const template = dict[key] ?? en[key] ?? key;
      return interpolate(template, vars);
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return { lang: 'en', dir: 'ltr', setLang: () => {}, toggleLang: () => {}, t: fallbackT };
  }
  return context;
};
