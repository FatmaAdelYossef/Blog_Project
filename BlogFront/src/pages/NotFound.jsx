import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useLanguage } from '../i18n';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { ROUTES } from '../config/routes';
import { applySeo } from '../lib/seo';
import { AuthShell } from '../components/layout/AuthShell';
import { Button } from '../components/ui';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const siteName = settings?.siteName || t('app.name');

  useEffect(() => {
    // Do not let crawlers index a dead URL.
    applySeo({ title: `${t('notFound.title')} · ${siteName}`, noindex: true });
  }, [t, siteName]);

  return (
    <AuthShell
      title={t('notFound.title')}
      description={t('notFound.desc')}
      footer={
        <p>
          Looking for something to read?{' '}
          <Link
            to={ROUTES.POSTS}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('home.browsePosts')}
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <p className="font-serif text-7xl font-semibold leading-none text-accent">404</p>

        <p className="text-sm leading-relaxed text-ink-muted">{t('notFound.desc')}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:w-auto" icon={<Home />} onClick={() => navigate(ROUTES.HOME)}>
            {t('notFound.backHome')}
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            icon={<ArrowLeft className="rtl:-scale-x-100" />}
            onClick={() => navigate(-1)}
          >
            {t('post.back')}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
