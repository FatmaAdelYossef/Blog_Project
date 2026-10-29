import { Trash2 } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { htmlToText } from '../../lib/sanitize';

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

  return (
    <Card as="article" className="flex h-full min-w-0 flex-col transition-colors hover:border-accent/40">
      <h3 className="break-words font-serif text-lg font-medium text-ink">{post.title}</h3>

      {excerpt ? (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{excerpt}</p>
      ) : (
        <div className="flex-1" />
      )}

      {publishedAt ? (
        <time dateTime={post.createdAt} className="mt-4 block text-xs text-ink-muted">
          {publishedAt}
        </time>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
