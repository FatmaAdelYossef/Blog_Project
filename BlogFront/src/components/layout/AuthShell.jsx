import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { ROUTES } from '../../config/routes';
import { Brand } from './Brand';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Shared frame for the signed-out pages. On wide screens it pairs the form with
 * an editorial panel; on narrow screens the panel drops away and the brand
 * moves above the form.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.title
 * @param {import('react').ReactNode} props.description
 * @param {import('react').ReactNode} props.children
 * @param {import('react').ReactNode} [props.footer]
 */
export function AuthShell({ title, description, children, footer }) {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${title} · ${t('app.name')}`;
  }, [title, t]);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[1.1fr_1fr]">
        <aside className="paper-texture relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-paper lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-accent text-surface">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                <path d="M16 8 2 22" />
                <path d="M17.5 15H9" />
              </svg>
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight">
              {t('app.name')}
            </span>
          </div>

          <div className="max-w-sm">
            <p className="eyebrow">{t('shell.tagline')}</p>
            <p className="mt-5 font-serif text-4xl leading-tight">{t('shell.hero')}</p>
            <div className="mt-8 h-px w-16 bg-accent" />
            <p className="mt-6 text-sm leading-relaxed text-paper/70">{t('shell.heroSub')}</p>
          </div>

          <p className="text-xs text-paper/50">© {CURRENT_YEAR} {t('app.name')}</p>
        </aside>

        <main className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Brand tagline={t('app.taglinePublic')} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Link
                to={ROUTES.HOME}
                className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
                {t('shell.backToBlog')}
              </Link>

              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>

            <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>

            <div className="mt-8">{children}</div>

            {footer ? (
              <div className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">{footer}</div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
