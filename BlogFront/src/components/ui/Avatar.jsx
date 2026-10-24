import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { cn } from '../../lib/cn';

const sizeClasses = {
  sm: 'size-8 text-xs [&_svg]:size-4',
  md: 'size-10 text-sm [&_svg]:size-5',
  lg: 'size-12 text-base [&_svg]:size-6',
};

function getInitials(name) {
  if (!name) return '';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || '')
    .join('')
    .toUpperCase();
}

/**
 * User avatar with an image and an initials fallback. The root carries the
 * accessible name so the image itself can stay decorative.
 *
 * @param {object} props
 * @param {string} [props.src]
 * @param {string} [props.name]
 * @param {string} [props.alt]
 * @param {'sm' | 'md' | 'lg'} [props.size]
 */
export function Avatar({ src, name, alt, size = 'md', className, ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const accessibleName = alt || name;
  const initials = getInitials(name);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      {...props}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-line bg-accent-soft font-medium text-accent',
        sizeClasses[size],
        className,
      )}
      {...(accessibleName
        ? { role: 'img', 'aria-label': accessibleName }
        : { 'aria-hidden': 'true' })}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <UserRound aria-hidden="true" />
      )}
    </span>
  );
}
