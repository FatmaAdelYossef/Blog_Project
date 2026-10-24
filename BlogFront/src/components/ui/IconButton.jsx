import { cn } from '../../lib/cn';

const variantClasses = {
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  primary: 'bg-accent text-surface hover:bg-accent-hover',
  danger: 'text-danger hover:bg-danger/10',
};

const sizeClasses = {
  sm: 'size-8 [&_svg]:size-4',
  md: 'size-10 [&_svg]:size-5',
  lg: 'size-12 [&_svg]:size-6',
};

/**
 * Square icon-only button. `label` is required and becomes the accessible name.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {import('react').ReactNode} [props.icon]
 * @param {'ghost' | 'secondary' | 'primary' | 'danger'} [props.variant]
 * @param {'sm' | 'md' | 'lg'} [props.size]
 */
export function IconButton({
  label,
  icon,
  children,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  ref,
  ...props
}) {
  if (import.meta.env.DEV && !label) {
    console.warn('IconButton requires a non-empty `label` prop for its accessible name.');
  }

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon ?? children}
    </button>
  );
}
