import { cloneElement, isValidElement, useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * Form field wrapper that owns the label, hint, error, and the ids/ARIA wiring.
 *
 * `children` may be a render function that receives `{ id, describedBy, invalid,
 * required }`, or a single element which is cloned with those props. Prefer the
 * render function when the control already sets its own props.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {import('react').ReactNode} [props.label]
 * @param {import('react').ReactNode} [props.hint]
 * @param {import('react').ReactNode} [props.error]
 * @param {boolean} [props.required]
 * @param {string} [props.className]
 * @param {import('react').ReactNode | ((field: { id: string, describedBy?: string, invalid: boolean, required: boolean }) => import('react').ReactNode)} props.children
 */
export function Field({ id, label, hint, error, required = false, className, children }) {
  const generatedId = useId();
  const fieldId = id || `field-${generatedId}`;
  const invalid = Boolean(error);
  const hintId = hint && !error ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = errorId || hintId;

  let control = children;

  if (typeof children === 'function') {
    control = children({ id: fieldId, describedBy, invalid, required });
  } else if (isValidElement(children)) {
    const child = children;
    const childDescribedBy =
      [child.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined;

    control = cloneElement(child, {
      id: child.props.id || fieldId,
      required: child.props.required ?? required,
      'aria-invalid': child.props['aria-invalid'] ?? (invalid || undefined),
      'aria-describedby': childDescribedBy,
    });
  }

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="ml-0.5 text-danger">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          ) : null}
        </label>
      ) : null}

      {control}

      {hintId ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}

      {errorId ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
