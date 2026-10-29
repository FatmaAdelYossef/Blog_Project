import { CalendarDays, Clock3, Trash2 } from 'lucide-react';
import { Badge, Button, Card } from '../../components/ui';
import { htmlToText } from '../../lib/sanitize';
import { formatReadingTime, getReadingTime } from '../../lib/readingTime';

const EXCERPT_LENGTH = 120;

const getExcerpt = (html) => {
  const text = htmlToText(html).replace(/\s+/g, ' ').trim();
  return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function PostCard({ post, canDelete, onOpen, onDelete }) {
  const excerpt = getExcerpt(post.content);
  const publishedAt = formatDate(post.createdAt);
  const readingTime = formatReadingTime(getReadingTime(post.content));

  return (
    <Card
      as="article"
      className="group flex h-full min-w-0 flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="flex flex-wrap items-center gap-2">
        {post.categoryName ? <Badge variant="accent">{post.categoryName}</Badge> : null}

        {readingTime ? (
          <span className="inline-flex items-center gap-1 font-mono text-2xs uppercase tracking-[0.14em] text-ink-muted">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {readingTime}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 break-words font-serif text-xl font-medium leading-snug text-ink">
        {post.title}
      </h3>

      {excerpt ? (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{excerpt}</p>
      ) : (
        <div className="flex-1" />
      )}

      {publishedAt ? (
        <time
          dateTime={post.createdAt}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-muted"
        >
          <CalendarDays aria-hidden="true" className="size-3.5" />
          {publishedAt}
        </time>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button size="sm" onClick={onOpen}>
          Read post
        </Button>

        {canDelete ? (
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 />}
            onClick={onDelete}
            aria-label={`Delete ${post.title}`}
          >
            Delete
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
