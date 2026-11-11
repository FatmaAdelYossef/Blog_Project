import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import { useLanguage } from '../../i18n';
import { ROUTES } from '../../config/routes';
import { Alert, Button, Card, PasswordInput } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    CurrentPassword: '',
    NewPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!success) return undefined;

    const timer = setTimeout(() => navigate(ROUTES.HOME), 2000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleChange = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (formData.NewPassword !== formData.confirmPassword) {
      setError(t('reset.mismatch'));
      return;
    }

    if (formData.NewPassword.length < 2) {
      setError(t('reset.tooShort'));
      return;
    }

    setLoading(true);

    try {
      // The API contract only accepts the current and new password; the
      // confirmation field is a client-side check and must not be sent.
      await authService.changePassword({
        CurrentPassword: formData.CurrentPassword,
        NewPassword: formData.NewPassword,
      });
      setSuccess(t('cp.success'));
    } catch {
      setError(t('cp.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <PageHeader
        eyebrow={t('cp.eyebrow')}
        title={t('cp.title')}
        description={t('cp.desc')}
      />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput
            label={t('cp.current')}
            name="current-password"
            autoComplete="current-password"
            value={formData.CurrentPassword}
            onChange={handleChange('CurrentPassword')}
            required
          />

          <PasswordInput
            label={t('cp.new')}
            name="new-password"
            autoComplete="new-password"
            value={formData.NewPassword}
            onChange={handleChange('NewPassword')}
            required
          />

          <PasswordInput
            label={t('cp.confirm')}
            name="confirm-password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
          />

          {error ? <Alert variant="danger">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              {t('cp.back')}
            </Link>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              loadingLabel={t('cp.updating')}
            >
              {t('cp.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
