import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Field } from './Field';

/**
 * Password field with an accessible show/hide control. The toggle keeps the
 * field's label, hint, and error wiring intact.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {import('react').ReactNode} [props.label]
 * @param {import('react').ReactNode} [props.hint]
 * @param {import('react').ReactNode} [props.error]
 * @param {boolean} [props.required]
 */
export function PasswordInput({
  id,
  label,
  hint,
  error,
  required,
  className,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const externalDescribedBy = props['aria-describedby'];

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(field) => (
        <div className="relative">
          <input
            {...props}
            type={visible ? 'text' : 'password'}
            className={cn(
              'h-10 w-full rounded-md border border-line bg-surface px-3 py-2 pr-12 text-sm text-ink transition-colors max-sm:h-11',
              'placeholder:text-ink-muted/70 hover:border-ink-muted/40',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60',
              'aria-invalid:border-danger aria-invalid:focus-visible:outline-danger',
              className,
            )}
            id={field.id}
            required={field.required || undefined}
            aria-invalid={field.invalid || undefined}
            aria-describedby={
              [externalDescribedBy, field.describedBy].filter(Boolean).join(' ') || undefined
            }
          />

          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
          >
            {visible ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      )}
    </Field>
  );
}
