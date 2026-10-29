import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ROUTES } from '../../config/routes';
import { AuthShell } from '../../components/layout/AuthShell';
import { Alert, Button, Input } from '../../components/ui';

export default function ForgotPassword() {
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
      setError('We could not send the reset email. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={isSubmitted ? 'Check your inbox' : 'Reset your password'}
      description={
        isSubmitted
          ? 'If the address matches an account, a recovery link is on its way.'
          : 'Enter the email address you use to sign in and we will send recovery instructions.'
      }
      footer={
        <p>
          Remembered it?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      {isSubmitted ? (
        <div className="space-y-5">
          <Alert variant="success" title="Recovery email sent">
            If an account exists for <span className="font-medium text-ink">{email}</span>, the
            reset link is on its way.
          </Alert>

          <p className="text-sm leading-relaxed text-ink-muted">
            The link is time-limited for your protection. If it does not arrive, check your spam
            folder or request a new one.
          </p>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
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
            loadingLabel="Sending instructions"
          >
            Send reset instructions
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
