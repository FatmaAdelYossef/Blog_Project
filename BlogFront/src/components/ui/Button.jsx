import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

const variantClasses = {
  primary: 'bg-accent text-surface hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger/90',
  link: 'text-accent underline-offset-4 hover:underline',
};

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

const iconSizeClasses = {
  sm: '[&_svg]:size-4',
  md: '[&_svg]:size-4',
  lg: '[&_svg]:size-5',
};

/**
 * Text button. Defaults to `type="button"` so it never submits a form unless
 * explicitly asked to.
 *
 * @param {object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger' | 'link'} [props.variant]
 * @param {'sm' | 'md' | 'lg'} [props.size]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.disabled]
 * @param {import('react').ReactNode} [props.icon]
 * @param {string} [props.loadingLabel]
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  loadingLabel = 'Loading',
  type = 'button',
  className,
  children,
  ref,
  ...props
}) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:opacity-60',
        variant !== 'link' && sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" label={loadingLabel} />
      ) : icon ? (
        <span aria-hidden="true" className={cn('shrink-0', iconSizeClasses[size])}>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
