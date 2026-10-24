import { Link } from 'react-router-dom';
import { Feather } from 'lucide-react';
import { ROUTES } from '../../config/routes';
import { cn } from '../../lib/cn';

/**
 * Editorial brand lockup. The mark is decorative; the link text names the
 * destination so the accessible name stays stable at every size.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {() => void} [props.onClick]
 */
export function Brand({ className, onClick }) {
  return (
    <Link
      to={ROUTES.HOME}
      onClick={onClick}
      className={cn('inline-flex items-center gap-3 rounded-md', className)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-surface">
        <Feather aria-hidden="true" className="size-4" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg font-semibold tracking-tight text-ink">My Blog</span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          Editorial workspace
        </span>
      </span>
    </Link>
  );
}
