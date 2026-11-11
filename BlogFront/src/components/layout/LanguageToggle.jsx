import { useLanguage } from '../../i18n';

/**
 * Toggles the UI language between English (LTR) and Arabic (RTL). The label
 * always shows the *other* language so the action is unambiguous.
 */
export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();
  const isArabic = lang === 'ar';

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
      className="inline-flex min-h-10 items-center rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
    >
      {isArabic ? 'EN' : 'عربي'}
    </button>
  );
}
