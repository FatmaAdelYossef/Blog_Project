import { cn } from '../../lib/cn';
import { Field } from './Field';

/**
 * Multiline text input with optional label, hint, and error wiring.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {import('react').ReactNode} [props.label]
 * @param {import('react').ReactNode} [props.hint]
 * @param {import('react').ReactNode} [props.error]
 * @param {boolean} [props.required]
 * @param {number} [props.rows]
 */
export function Textarea({
  id,
  label,
  hint,
  error,
  required,
  rows = 4,
  className,
  ref,
  ...props
}) {
  const externalDescribedBy = props['aria-describedby'];

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(field) => (
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'min-h-24 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors',
            'placeholder:text-ink-muted/70 hover:border-ink-muted/40',
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
        />
      )}
    </Field>
  );
}
