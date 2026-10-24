import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, FolderOpen, KeyRound, PenLine } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routes';
import { categoryService } from '../../services/categoryService';
import { postService } from '../../services/postService';
import { Badge, Card, Skeleton } from '../../components/ui';

const unwrap = (payload) => payload?.data ?? payload;

const ACTIONS = [
  {
    to: ROUTES.POSTS,
    title: 'Posts',
    description: 'Read the archive, search by title, and manage your writing.',
    icon: FileText,
  },
  {
    to: ROUTES.CATEGORIES,
    title: 'Categories',
    description: 'Shape the sections that organize the blog.',
    icon: FolderOpen,
  },
  {
    to: ROUTES.CHANGE_PASSWORD,
    title: 'Account security',
    description: 'Update the password that protects your account.',
    icon: KeyRound,
  },
];

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState({ posts: null, categories: null, loading: true });

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        const [postsResponse, categoriesResponse] = await Promise.all([
          postService.getAllPosts(1, 1),
          categoryService.getAll(),
        ]);

        if (!active) return;

        const paged = unwrap(postsResponse);
        const categories = unwrap(categoriesResponse);

        setStats({
          posts: typeof paged?.totalCount === 'number' ? paged.totalCount : null,
          categories: Array.isArray(categories) ? categories.length : null,
          loading: false,
        });
      } catch {
        if (active) {
          setStats({ posts: null, categories: null, loading: false });
        }
      }
    };

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Overview</p>
        <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          {isAuthenticated ? 'Your writing desk' : 'Welcome to My Blog'}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          {isAuthenticated
            ? `Signed in as ${user?.email ?? 'a member'}. Pick up where you left off or start something new.`
            : 'Read the latest posts, browse the archive, or sign in to start writing.'}
        </p>
        {isAuthenticated && user?.role ? (
          <Badge variant="accent" className="mt-4">
            {user.role}
          </Badge>
        ) : null}
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Workspace totals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <p className="text-sm text-ink-muted">Posts</p>
            <p className="mt-2 font-serif text-4xl text-ink" aria-busy={stats.loading || undefined}>
              {stats.loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <>
                  {stats.posts ?? '—'}
                  {stats.posts === null ? <span className="sr-only"> unavailable</span> : null}
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-ink-muted">Across every category</p>
          </Card>

          <Card>
            <p className="text-sm text-ink-muted">Categories</p>
            <p className="mt-2 font-serif text-4xl text-ink" aria-busy={stats.loading || undefined}>
              {stats.loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <>
                  {stats.categories ?? '—'}
                  {stats.categories === null ? (
                    <span className="sr-only"> unavailable</span>
                  ) : null}
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-ink-muted">Sections in the archive</p>
          </Card>

          <Card>
            <p className="text-sm text-ink-muted">Your access</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={isAuthenticated ? 'accent' : 'neutral'}>
                {isAuthenticated ? (user?.role ?? 'Member') : 'Guest'}
              </Badge>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              {isAuthenticated
                ? 'You can write and manage the posts you own.'
                : 'Sign in to write and manage posts.'}
            </p>
            {!isAuthenticated ? (
              <Link
                to={ROUTES.LOGIN}
                className="mt-3 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            ) : null}
          </Card>
        </div>
      </section>

      <section aria-labelledby="actions-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="actions-heading" className="font-serif text-2xl font-medium text-ink">
              Start here
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Three places to pick up the thread.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {ACTIONS.map(({ to, title, description, icon: Icon }) => (
            <Card
              key={to}
              as={Link}
              to={to}
              className="group flex flex-col transition-colors hover:border-accent/40"
            >
              <span className="mb-5 inline-flex size-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="font-serif text-lg font-medium text-ink">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                Open
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="note-heading">
        <Card padding="lg" className="bg-surface-muted/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <PenLine aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 id="note-heading" className="font-serif text-xl font-medium text-ink">
                A small editorial note
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                Posts you create belong to your account. Admins can still see and manage everything,
                including posts created before ownership was introduced.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
