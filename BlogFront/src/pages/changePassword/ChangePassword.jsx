import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import { ROUTES } from '../../config/routes';
import { Alert, Button, Card, Input } from '../../components/ui';

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
      setError('New passwords do not match.');
      return;
    }

    if (formData.NewPassword.length < 2) {
      setError('Password must be at least 2 characters long.');
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
      setSuccess('Password changed successfully!');
    } catch {
      setError('Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Account</p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          Change password
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Confirm your current password, then choose a new one.
        </p>
      </header>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Current password"
            type="password"
            name="current-password"
            autoComplete="current-password"
            value={formData.CurrentPassword}
            onChange={handleChange('CurrentPassword')}
            required
          />

          <Input
            label="New password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={formData.NewPassword}
            onChange={handleChange('NewPassword')}
            required
          />

          <Input
            label="Confirm new password"
            type="password"
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
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to overview
            </Link>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              loadingLabel="Updating password"
            >
              Update password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
