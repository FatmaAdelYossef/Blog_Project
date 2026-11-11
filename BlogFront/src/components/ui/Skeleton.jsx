import { cn } from '../../lib/cn';

const variantClasses = {
  text: 'h-4 w-full animate-pulse rounded-sm bg-surface-muted',
  avatar: 'size-10 animate-pulse rounded-full bg-surface-muted',
};

/**
 * Loading placeholder. Mark the surrounding region `aria-busy`; the skeleton
 * itself is hidden from assistive technology.
 *
 * @param {object} props
 * @param {'text' | 'card' | 'avatar'} [props.variant]
 */
export function Skeleton({ variant = 'text', className, ...props }) {
  if (variant === 'card') {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'animate-pulse rounded-lg border border-line bg-surface p-6 shadow-soft',
          className,
        )}
        {...props}
      >
        <div className="h-5 w-1/3 rounded-sm bg-surface-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded-sm bg-surface-muted" />
          <div className="h-3 w-5/6 rounded-sm bg-surface-muted" />
          <div className="h-3 w-2/3 rounded-sm bg-surface-muted" />
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={cn(variantClasses[variant], className)} {...props} />
  );
}
