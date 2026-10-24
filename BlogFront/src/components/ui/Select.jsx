import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Field } from './Field';

/**
 * Native single-select with optional label, hint, error, and placeholder.
 * Pass `<option>` elements as children.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {import('react').ReactNode} [props.label]
 * @param {import('react').ReactNode} [props.hint]
 * @param {import('react').ReactNode} [props.error]
 * @param {boolean} [props.required]
 * @param {string} [props.placeholder]
 */
export function Select({
  id,
  label,
  hint,
  error,
  required,
  placeholder,
  className,
  children,
  ref,
  ...props
}) {
  const externalDescribedBy = props['aria-describedby'];

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(field) => (
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'h-10 w-full appearance-none rounded-md border border-line bg-surface pl-3 pr-9 text-sm text-ink transition-colors',
              'hover:border-ink-muted/40',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60',
              'aria-invalid:border-danger aria-invalid:focus-visible:outline-danger',
              className,
            )}
            {...props}
            id={field.id}
            required={field.required || undefined}
            aria-invalid={field.invalid || undefined}
            aria-describedby={
              [externalDescribedBy, field.describedBy].filter(Boolean).join(' ') || undefined
            }
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {children}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
        </div>
      )}
    </Field>
  );
}
