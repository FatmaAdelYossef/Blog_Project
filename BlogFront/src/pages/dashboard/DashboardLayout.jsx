import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  FileText,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routes';
import { Avatar, Badge, Button, IconButton } from '../../components/ui';
import { Brand } from '../../components/layout/Brand';
import { cn } from '../../lib/cn';
import { getFocusableElements } from '../../lib/focusable';

const NAV_ITEMS = [
  { to: ROUTES.HOME, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: ROUTES.POSTS, label: 'Posts', icon: FileText },
  { to: ROUTES.CATEGORIES, label: 'Categories', icon: FolderOpen },
];

const getPageTitle = (pathname) => {
  if (pathname === ROUTES.HOME) return 'Overview';
  if (pathname.startsWith(`${ROUTES.POSTS}/`)) return 'Post';
  if (pathname.startsWith(ROUTES.POSTS)) return 'Posts';
  if (pathname.startsWith(ROUTES.CATEGORIES)) return 'Categories';
  if (pathname.startsWith(ROUTES.CHANGE_PASSWORD)) return 'Change password';
  return 'My Blog';
};

const navLinkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent-soft text-accent'
      : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  );

function SidebarContent({ onNavigate }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex h-full flex-col gap-8 p-5">
      <Brand onClick={onNavigate} />

      <nav aria-label="Main navigation" className="flex flex-col gap-1">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          Workspace
        </p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={navLinkClass}>
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        {isAuthenticated ? (
          <div className="rounded-lg border border-line bg-surface-muted p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user?.email} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {user?.email ?? 'Signed in'}
                </p>
                {user?.role ? (
                  <Badge variant="accent" className="mt-1">
                    {user.role}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line p-4">
            <p className="text-sm font-medium text-ink">Reading as a guest</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Sign in to write and manage posts.
            </p>
            <Link
              to={ROUTES.LOGIN}
              onClick={onNavigate}
              className="mt-3 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const drawerRef = useRef(null);
  const closeNavButtonRef = useRef(null);
  const openNavButtonRef = useRef(null);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);

  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    document.title = `${pageTitle} · My Blog`;
  }, [pageTitle]);

  // Mobile navigation: lock the page, trap focus, close on Escape, and return
  // focus to the button that opened the drawer.
  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeNavButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMobileNavOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = drawerRef.current;
      if (!panel) return;

      const focusable = getFocusableElements(panel);

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [isMobileNavOpen]);

  // Account disclosure: close on outside pointer press and on Escape.
  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      setIsAccountMenuOpen(false);
      accountButtonRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const closeMobileNav = () => setIsMobileNavOpen(false);

  const handleLogout = async () => {
    setIsAccountMenuOpen(false);
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const goToChangePassword = () => {
    setIsAccountMenuOpen(false);
    navigate(ROUTES.CHANGE_PASSWORD);
  };

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-surface"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
            <IconButton
              ref={openNavButtonRef}
              label="Open navigation"
              icon={<Menu />}
              variant="secondary"
              className="lg:hidden"
              onClick={() => setIsMobileNavOpen(true)}
            />

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                My Blog
              </p>
              <h1 className="truncate font-serif text-lg font-semibold tracking-tight text-ink">
                {pageTitle}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    ref={accountButtonRef}
                    type="button"
                    aria-expanded={isAccountMenuOpen}
                    onClick={() => setIsAccountMenuOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-full border border-line bg-surface p-1 pr-2.5 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <Avatar name={user?.email} size="sm" />
                    <span className="hidden max-w-48 truncate text-sm font-medium text-ink sm:block">
                      {user?.email ?? 'Account'}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        'size-4 text-ink-muted transition-transform',
                        isAccountMenuOpen && 'rotate-180',
                      )}
                    />
                  </button>

                  {isAccountMenuOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-soft">
                      <div className="border-b border-line px-4 py-3">
                        <p className="truncate text-sm font-medium text-ink">{user?.email}</p>
                        {user?.role ? (
                          <Badge variant="accent" className="mt-1.5">
                            {user.role}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={goToChangePassword}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                        >
                          <KeyRound aria-hidden="true" className="size-4" />
                          Change password
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                        >
                          <LogOut aria-hidden="true" className="size-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Button icon={<LogIn />} onClick={() => navigate(ROUTES.LOGIN)}>
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-line px-4 py-5 text-center text-xs text-ink-muted sm:px-6 lg:px-10">
          My Blog · A quiet place to write and publish.
        </footer>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            tabIndex={-1}
            onClick={closeMobileNav}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/40"
          />

          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-soft outline-none"
          >
            <div className="flex justify-end p-3">
              <IconButton
                ref={closeNavButtonRef}
                label="Close navigation"
                icon={<X />}
                onClick={closeMobileNav}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidebarContent onNavigate={closeMobileNav} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
