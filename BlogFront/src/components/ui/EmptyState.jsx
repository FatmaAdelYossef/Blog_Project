import { Inbox } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Empty placeholder for lists, tables, and search results.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.icon]
 * @param {import('react').ReactNode} [props.title]
 * @param {import('react').ReactNode} [props.description]
 * @param {import('react').ReactNode} [props.action]
 */
export function EmptyState({ icon, title, description, action, className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent [&_svg]:size-6"
      >
        {icon ?? <Inbox />}
      </span>

      {title ? (
        <h3 className="font-serif text-lg font-medium text-ink">{title}</h3>
      ) : null}

      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
