import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useLanguage } from '../../i18n';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { ROUTES } from '../../config/routes';
import { applySeo } from '../../lib/seo';
import { AuthShell } from '../../components/layout/AuthShell';
import { Alert, Button, Input } from '../../components/ui';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const siteName = settings?.siteName || t('app.name');

  useEffect(() => {
    // Private route: keep crawlers out of the head.
    applySeo({ title: `${t('forgot.title')} · ${siteName}`, noindex: true });
  }, [t, siteName]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword({ Email: email });
      setIsSubmitted(true);
    } catch {
      setError(t('forgot.sendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={isSubmitted ? t('forgot.titleSent') : t('forgot.title')}
      description={isSubmitted ? t('forgot.descSent') : t('forgot.desc')}
      footer={
        <p>
          {t('forgot.remembered')}{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('auth.backToSignIn')}
          </Link>
        </p>
      }
    >
      {isSubmitted ? (
        <div className="space-y-5">
          <Alert variant="success" title={t('forgot.sentTitle')}>
            {t('forgot.sentBody', { email })}
          </Alert>

          <p className="text-sm leading-relaxed text-ink-muted">{t('forgot.sentHint')}</p>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            {t('auth.backToSignIn')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('auth.emailLabel')}
            type="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            loadingLabel={t('forgot.sendingInstructions')}
          >
            {t('forgot.sendInstructions')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
