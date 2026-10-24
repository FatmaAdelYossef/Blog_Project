import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ROUTES } from '../../config/routes';
import { AuthShell } from '../../components/layout/AuthShell';
import { Alert, Button, Input } from '../../components/ui';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 2) {
      setError('Password must be at least 2 characters long.');
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
      setError('Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={success ? 'Password updated' : 'Choose a new password'}
      description={
        success
          ? 'You can sign in with the new password in a moment.'
          : 'Pick a password you have not used elsewhere.'
      }
      footer={
        <p>
          Need a fresh link?{' '}
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Request another
          </Link>
        </p>
      }
    >
      {success ? (
        <div className="space-y-5">
          <Alert variant="success" title="All set">
            Your password has been changed. Redirecting you to sign in…
          </Alert>

          <Button size="lg" className="w-full" onClick={() => navigate(ROUTES.LOGIN)}>
            Go to sign in
          </Button>
        </div>
      ) : missingParams ? (
        <div className="space-y-5">
          <Alert variant="danger" title="Invalid reset link">
            This link is missing its email or token. Request a new email and open the newest link.
          </Alert>

          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          >
            Request a new link
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />

          <Input
            label="Confirm new password"
            type="password"
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
            loadingLabel="Resetting password"
          >
            Reset password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
