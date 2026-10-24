import { cn } from '../../lib/cn';

const variantClasses = {
  neutral: 'border border-line bg-surface-muted text-ink-muted',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

/**
 * Small status label.
 *
 * @param {object} props
 * @param {'neutral' | 'accent' | 'success' | 'warning' | 'danger'} [props.variant]
 */
export function Badge({ variant = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
