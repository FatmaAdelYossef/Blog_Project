import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Feather, LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useLanguage } from '../../i18n';
import { ROUTES } from '../../config/routes';
import { applySeo } from '../../lib/seo';
import { Button, IconButton } from '../../components/ui';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../../lib/cn';

const NAV_KEYS = [
  { to: ROUTES.HOME, labelKey: 'nav.home', end: true },
  { to: ROUTES.POSTS, labelKey: 'nav.posts' },
  { to: ROUTES.CATEGORIES, labelKey: 'nav.categories' },
];

const getPageTitle = (pathname, t, siteName) => {
  if (pathname === ROUTES.HOME) return t('page.home');
  if (pathname.startsWith(`${ROUTES.POSTS}/`)) return t('page.post');
  if (pathname.startsWith(ROUTES.POSTS)) return t('page.posts');
  if (pathname.startsWith(ROUTES.CATEGORIES)) return t('page.categories');
  return siteName || t('app.name');
};

const navLinkClass = ({ isActive }) =>
  cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent-soft text-accent'
      : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  );

/**
 * Public reader-facing shell: a top navigation bar instead of the workspace
 * sidebar. Rendered for guests; signed-in members get DashboardLayout instead
 * (see SiteShell in App.jsx).
 */
export default function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { settings: siteSettings } = useSiteSettings();
  const siteName = siteSettings?.siteName || t('app.name');
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = getPageTitle(location.pathname, t, siteName);
  const isPostDetailsRoute = /^\/posts\/[^/]+$/.test(location.pathname);

  // Close the mobile menu on navigation by adjusting state during render
  // (React's recommended alternative to setState-in-effect).
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Post detail pages own their SEO meta; the layout provides defaults only.
  useEffect(() => {
    if (isPostDetailsRoute) return undefined;
    applySeo({
      title: `${pageTitle} · ${siteName}`,
      noindex: location.pathname === ROUTES.CHANGE_PASSWORD,
    });
    return undefined;
  }, [pageTitle, isPostDetailsRoute, location.pathname, siteName]);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-surface"
      >
        {t('nav.skipToContent')}
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-10">
          <IconButton
            label={menuOpen ? 'Close navigation' : 'Open navigation'}
            icon={menuOpen ? <X /> : <Menu />}
            variant="secondary"
            className="md:hidden"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          />

          <Link to={ROUTES.HOME} className="inline-flex items-center gap-3 rounded-md">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-surface">
              <Feather aria-hidden="true" className="size-4" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold tracking-tight text-ink">
                {siteName}
              </span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                {t('app.taglinePublic')}
              </span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="ms-6 hidden items-center gap-1 md:flex">
            {NAV_KEYS.map(({ to, labelKey, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                variant="secondary"
                icon={<LayoutDashboard />}
                onClick={() => navigate(ROUTES.HOME)}
              >
                {t('auth.dashboard')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={<LogIn />}
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                {t('auth.signIn')}
              </Button>
            )}
          </div>
        </div>

        {menuOpen ? (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-line bg-surface px-4 py-3 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {NAV_KEYS.map(({ to, labelKey, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-md px-3 py-2.5 text-sm font-medium',
                        isActive
                          ? 'bg-accent-soft text-accent'
                          : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                      )
                    }
                  >
                    {t(labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-xs text-ink-muted sm:px-6 lg:flex-row lg:justify-between lg:px-10 lg:text-left">
          <p>{t('footer.line1', { name: siteName })}</p>
          <p>{t('footer.line2')}</p>
        </div>
      </footer>
    </div>
  );
}
