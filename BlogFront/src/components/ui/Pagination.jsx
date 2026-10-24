import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getPageItems(page, totalPages, siblingCount) {
  const totalSlots = siblingCount * 2 + 5;

  if (totalPages <= totalSlots) return range(1, totalPages);

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);
  const showLeftGap = leftSibling > 2;
  const showRightGap = rightSibling < totalPages - 1;

  if (!showLeftGap && showRightGap) {
    return [...range(1, siblingCount * 2 + 3), 'gap-end', totalPages];
  }

  if (showLeftGap && !showRightGap) {
    return [1, 'gap-start', ...range(totalPages - (siblingCount * 2 + 3) + 1, totalPages)];
  }

  return [1, 'gap-start', ...range(leftSibling, rightSibling), 'gap-end', totalPages];
}

const pageButtonClasses =
  'inline-flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const navButtonClasses = cn(
  pageButtonClasses,
  'text-ink-muted enabled:hover:bg-surface-muted enabled:hover:text-ink disabled:pointer-events-none disabled:opacity-40',
);

/**
 * Page navigation with previous/next controls and a windowed page list.
 *
 * @param {object} props
 * @param {number} props.page
 * @param {number} props.totalPages
 * @param {(page: number) => void} props.onPageChange
 * @param {number} [props.siblingCount]
 * @param {string} [props.label]
 */
export function Pagination({
  page = 1,
  totalPages,
  onPageChange,
  siblingCount = 1,
  label = 'Pagination',
  className,
  ...props
}) {
  const pageCount = Math.floor(totalPages);

  if (!Number.isFinite(pageCount) || pageCount < 1) return null;

  const currentPage = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const items = getPageItems(currentPage, pageCount, Math.max(0, Math.floor(siblingCount)));

  return (
    <nav aria-label={label} className={cn('flex items-center justify-center', className)} {...props}>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={navButtonClasses}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
        </li>

        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  pageButtonClasses,
                  item === currentPage
                    ? 'bg-accent text-surface'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                )}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true">
              <span className="inline-flex size-9 items-center justify-center text-sm text-ink-muted">
                &hellip;
              </span>
            </li>
          ),
        )}

        <li>
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
            className={navButtonClasses}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
