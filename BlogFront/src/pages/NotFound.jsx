import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { ROUTES } from '../config/routes';
import { AuthShell } from '../components/layout/AuthShell';
import { Button } from '../components/ui';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <AuthShell
      title="Page not found"
      description="The page you are looking for may have moved, been renamed, or never existed."
      footer={
        <p>
          Looking for something to read?{' '}
          <Link
            to={ROUTES.POSTS}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Browse the posts
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <p className="font-serif text-7xl font-semibold leading-none text-accent">404</p>

        <p className="text-sm leading-relaxed text-ink-muted">
          Check the address, or head back to the overview and start from there.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:w-auto" icon={<Home />} onClick={() => navigate(ROUTES.HOME)}>
            Back to overview
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            icon={<ArrowLeft />}
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
