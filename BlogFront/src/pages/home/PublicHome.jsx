import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { postService } from '../../services/postService';
import { useLanguage } from '../../i18n';
import { ROUTES } from '../../config/routes';
import { Alert, Button, EmptyState, Skeleton } from '../../components/ui';
import { PostCard } from '../posts/PostCard';

const PAGE_SIZE = 6;

// The list endpoint includes media objects that the cards do not render.
const withoutMedia = ({ medias: _medias, ...post }) => post;

export default function PublicHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    const loadPosts = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await postService.getAllPosts(1, PAGE_SIZE);
        if (cancelled || requestId !== requestIdRef.current) return;

        const payload = data?.data ?? data;
        const items = Array.isArray(payload?.items) ? payload.items : [];
        setPosts(items.map(withoutMedia));
      } catch {
        if (cancelled || requestId !== requestIdRef.current) return;
        setPosts([]);
        setError(t('home.loadError'));
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [reloadToken, t]);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-xl border border-line bg-surface px-6 py-12 shadow-soft sm:px-10 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full border border-line"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-10 size-44 rounded-full border border-accent/20"
        />

        <div className="relative max-w-2xl">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
            {t('home.title')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
            {t('home.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button icon={<BookOpen />} onClick={() => navigate(ROUTES.POSTS)}>
              {t('home.browsePosts')}
            </Button>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {t('home.signInToWrite')}
              <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="latest-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t('home.latest')}</p>
            <h2 id="latest-heading" className="mt-2 font-serif text-2xl font-medium text-ink">
              {t('home.latestTitle')}
            </h2>
          </div>
          <Link
            to={ROUTES.POSTS}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('home.viewAll')}
            <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </Link>
        </div>

        {error ? (
          <div className="mt-6">
            <Alert variant="danger" onDismiss={() => setError('')}>
              {error}
            </Alert>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => setReloadToken((token) => token + 1)}
            >
              {t('home.tryAgain')}
            </Button>
          </div>
        ) : null}

        {loading && posts.length === 0 ? (
          <div aria-busy="true" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} variant="card" />
            ))}
            <span className="sr-only" role="status">
              {t('home.loading')}
            </span>
          </div>
        ) : posts.length === 0 ? (
          error ? null : (
            <div className="mt-6">
              <EmptyState
                title={t('home.emptyTitle')}
                description={t('home.emptyDesc')}
              />
            </div>
          )
        ) : (
          <ul
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-busy={loading || undefined}
          >
            {posts.map((post) => (
              <li key={post.id} className="min-w-0">
                <PostCard
                  post={post}
                  canDelete={false}
                  onOpen={() => navigate(`/posts/${post.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
