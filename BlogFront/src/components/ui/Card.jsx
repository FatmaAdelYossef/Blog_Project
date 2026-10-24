import { cn } from '../../lib/cn';

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Surface container used for grouped content.
 *
 * @param {object} props
 * @param {import('react').ElementType} [props.as]
 * @param {'none' | 'sm' | 'md' | 'lg'} [props.padding]
 */
export function Card({ as: Component = 'div', padding = 'md', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-lg border border-line bg-surface shadow-soft',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
