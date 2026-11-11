import { cn } from '../lib/cn';

/**
 * Consistent page-level header. The page owns its `h1`; the app shell only
 * labels the current section, so headings stay unique per route.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.eyebrow]
 * @param {import('react').ReactNode} props.title
 * @param {import('react').ReactNode} [props.description]
 * @param {import('react').ReactNode} [props.actions]
 */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title mt-2">{title}</h1>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}
