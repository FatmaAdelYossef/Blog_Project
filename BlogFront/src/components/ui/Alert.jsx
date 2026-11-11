import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './IconButton';

const variantConfig = {
  info: {
    Icon: Info,
    container: 'border-info/30 bg-info/10',
    icon: 'text-info',
  },
  success: {
    Icon: CircleCheck,
    container: 'border-success/30 bg-success/10',
    icon: 'text-success',
  },
  warning: {
    Icon: TriangleAlert,
    container: 'border-warning/30 bg-warning/10',
    icon: 'text-warning',
  },
  danger: {
    Icon: CircleAlert,
    container: 'border-danger/30 bg-danger/10',
    icon: 'text-danger',
  },
};

/**
 * Inline status message. Warnings and errors use `role="alert"`; informational
 * and success messages use `role="status"`.
 *
 * @param {object} props
 * @param {'info' | 'success' | 'warning' | 'danger'} [props.variant]
 * @param {import('react').ReactNode} [props.title]
 * @param {() => void} [props.onDismiss]
 * @param {string} [props.dismissLabel]
 */
export function Alert({
  variant = 'info',
  title,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  children,
  ...props
}) {
  const { Icon, container, icon } = variantConfig[variant];
  const assertive = variant === 'warning' || variant === 'danger';

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border p-4 text-sm', container, className)}
      {...props}
    >
      <span aria-hidden="true" className={cn('mt-0.5 shrink-0 [&_svg]:size-5', icon)}>
        <Icon />
      </span>

      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium text-ink">{title}</p> : null}
        {children ? (
          <div className={cn('text-ink-muted', title && 'mt-1')}>{children}</div>
        ) : null}
      </div>

      {onDismiss ? (
        <IconButton
          label={dismissLabel}
          icon={<X />}
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="-mr-2 -mt-1"
        />
      ) : null}
    </div>
  );
}
