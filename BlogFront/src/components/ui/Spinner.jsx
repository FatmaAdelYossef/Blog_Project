import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

const sizeClasses = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

/**
 * Inline loading indicator. The visible label is screen-reader only.
 *
 * @param {object} props
 * @param {'sm' | 'md' | 'lg'} [props.size]
 * @param {string} [props.label]
 * @param {string} [props.className]
 */
export function Spinner({ size = 'md', label = 'Loading', className, ...props }) {
  return (
    <span role="status" className={cn('inline-flex items-center justify-center text-current', className)} {...props}>
      <LoaderCircle aria-hidden="true" className={cn('animate-spin', sizeClasses[size])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
