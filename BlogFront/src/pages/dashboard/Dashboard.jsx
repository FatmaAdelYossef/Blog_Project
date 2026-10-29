import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  FolderOpen,
  KeyRound,
  PenLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routes';
import { categoryService } from '../../services/categoryService';
import { postService } from '../../services/postService';
import { Badge, Card, Skeleton } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';

const unwrap = (payload) => payload?.data ?? payload;

const ACTIONS = [
  {
    to: ROUTES.POSTS,
    title: 'Posts',
    description: 'Read the archive, search by title, and manage your writing.',
    icon: FileText,
    meta: 'Read & edit',
  },
  {
    to: ROUTES.CATEGORIES,
    title: 'Categories',
    description: 'Shape the sections that organize the blog.',
    icon: FolderOpen,
    meta: 'Organize',
  },
  {
    to: ROUTES.CHANGE_PASSWORD,
    title: 'Account security',
    description: 'Update the password that protects your account.',
    icon: KeyRound,
    meta: 'Protect',
  },
];

const STATS = [
  {
    key: 'posts',
    label: 'Posts',
    description: 'Across every category',
    icon: FileText,
  },
  {
    key: 'categories',
    label: 'Categories',
    description: 'Sections in the archive',
    icon: FolderOpen,
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
      <Card
        padding="lg"
        className="relative overflow-hidden bg-gradient-to-br from-surface via-surface to-surface-muted/70"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full border border-line"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-10 size-44 rounded-full border border-accent/20"
        />

        <PageHeader
          eyebrow="Overview"
          title={isAuthenticated ? 'Your writing desk' : 'Welcome to My Blog'}
          description={
            isAuthenticated
              ? `Signed in as ${user?.email ?? 'a member'}. Pick up where you left off or start something new.`
              : 'Read the latest posts, browse the archive, or sign in to start writing.'
          }
          actions={
            isAuthenticated && user?.role ? (
              <Badge variant="accent">{user.role}</Badge>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-surface transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Start writing
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            )
          }
        />

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-2">
            <PenLine aria-hidden="true" className="size-3.5 text-accent" />
            Notes, stories, and ideas worth keeping.
          </span>
          <span className="inline-flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-3.5 text-accent" />
            A calm place to publish.
          </span>
        </div>
      </Card>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Workspace totals
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map(({ key, label, description, icon: Icon }) => (
            <Card key={key} className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="eyebrow text-ink-muted">Total</span>
              </div>

              <div>
                <p className="text-sm text-ink-muted">{label}</p>
                <p
                  className="mt-1 font-serif text-4xl leading-none text-ink"
                  aria-busy={stats.loading || undefined}
                >
                  {stats.loading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    <>
                      {stats[key] ?? '—'}
                      {stats[key] === null ? <span className="sr-only"> unavailable</span> : null}
                    </>
                  )}
                </p>
                <p className="mt-2 text-xs text-ink-muted">{description}</p>
              </div>
            </Card>
          ))}

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
              <span className="eyebrow text-ink-muted">Session</span>
            </div>

            <div>
              <p className="text-sm text-ink-muted">Your access</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={isAuthenticated ? 'accent' : 'neutral'}>
                  {isAuthenticated ? (user?.role ?? 'Member') : 'Guest'}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                {isAuthenticated
                  ? 'You can write and manage the posts you own.'
                  : 'Sign in to write and manage posts.'}
              </p>
              {!isAuthenticated ? (
                <Link
                  to={ROUTES.LOGIN}
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
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
          {ACTIONS.map(({ to, title, description, icon: Icon, meta }, index) => (
            <Card
              key={to}
              as={Link}
              to={to}
              className="group flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="font-mono text-2xs uppercase tracking-[0.18em] text-ink-muted">
                  {String(index + 1).padStart(2, '0')} · {meta}
                </span>
              </div>

              <h3 className="font-serif text-lg font-medium text-ink">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                Open
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
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
