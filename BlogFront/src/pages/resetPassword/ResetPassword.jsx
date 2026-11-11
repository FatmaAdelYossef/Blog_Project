import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useLanguage } from '../../i18n';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { ROUTES } from '../../config/routes';
import { applySeo } from '../../lib/seo';
import { AuthShell } from '../../components/layout/AuthShell';
import { Alert, Button, PasswordInput } from '../../components/ui';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const siteName = settings?.siteName || t('app.name');

  useEffect(() => {
    // Private route: keep crawlers out of the head.
    applySeo({ title: `${t('reset.submit')} · ${siteName}`, noindex: true });
  }, [t, siteName]);

  const emailFromUrl = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';
  const missingParams = !emailFromUrl || !tokenFromUrl;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return undefined;

    const timer = setTimeout(() => navigate(ROUTES.LOGIN), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('reset.mismatch'));
      return;
    }

    if (newPassword.length < 2) {
      setError(t('reset.tooShort'));
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        Email: emailFromUrl,
        Token: tokenFromUrl,
        NewPassword: newPassword,
      });
      setSuccess(true);
    } catch {
      setError(t('reset.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={success ? t('reset.titleSuccess') : t('reset.title')}
      description={success ? t('reset.descSuccess') : t('reset.desc')}
      footer={
        <p>
          {t('reset.needLink')}{' '}
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('reset.requestAnother')}
          </Link>
        </p>
      }
    >
      {success ? (
        <div className="space-y-5">
          <Alert variant="success" title={t('reset.allSet')}>
            {t('reset.successBody')}
          </Alert>

          <Button size="lg" className="w-full" onClick={() => navigate(ROUTES.LOGIN)}>
            {t('reset.goToSignIn')}
          </Button>
        </div>
      ) : missingParams ? (
        <div className="space-y-5">
          <Alert variant="danger" title={t('reset.invalidLink')}>
            {t('reset.invalidLinkBody')}
          </Alert>

          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          >
            {t('reset.requestNewLink')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput
            label={t('reset.newPassword')}
            name="new-password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />

          <PasswordInput
            label={t('reset.confirmPassword')}
            name="confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            loadingLabel={t('reset.resetting')}
          >
            {t('reset.submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
