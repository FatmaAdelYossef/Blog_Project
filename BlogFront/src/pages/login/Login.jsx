import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { ROUTES } from '../../config/routes';
import { applySeo } from '../../lib/seo';
import { AuthShell } from '../../components/layout/AuthShell';
import { Alert, Button, Input, PasswordInput } from '../../components/ui';

export default function Login() {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const siteName = settings?.siteName || t('app.name');

  useEffect(() => {
    // Private route: keep crawlers out of the head.
    applySeo({ title: `${t('auth.signInPage')} · ${siteName}`, noindex: true });
  }, [t, siteName]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData);
      navigate(ROUTES.HOME);
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      description={t('auth.loginDesc')}
      footer={
        <p>
          {t('auth.forgotPassword')}{' '}
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('auth.resetIt')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label={t('auth.emailLabel')}
          type="email"
          name="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange('email')}
          required
        />

        <PasswordInput
          label={t('auth.passwordLabel')}
          name="password"
          autoComplete="current-password"
          placeholder={t('auth.passwordPlaceholder')}
          value={formData.password}
          onChange={handleChange('password')}
          required
        />

        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          loadingLabel={t('auth.signingIn')}
        >
          {t('auth.signIn')}
        </Button>
      </form>
    </AuthShell>
  );
}
