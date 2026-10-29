import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routes';
import { AuthShell } from '../../components/layout/AuthShell';
import { Alert, Button, Input, PasswordInput } from '../../components/ui';

export default function Login() {
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
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to write, edit, and organize your posts."
      footer={
        <p>
          Forgot your password?{' '}
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Reset it
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
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
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
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
          loadingLabel="Signing in"
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
