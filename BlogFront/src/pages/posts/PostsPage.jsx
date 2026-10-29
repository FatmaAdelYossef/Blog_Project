import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { LogIn, Plus, Search } from 'lucide-react';
import { postService } from '../../services/postService';
import { categoryService } from '../../services/categoryService';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../context/AuthContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
} from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';
import { PostCard } from './PostCard';

const PAGE_SIZE = 10;

// The list endpoint includes media objects that this page does not render.
const withoutMedia = ({ medias: _medias, ...post }) => post;

export default function PostsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');

  const [query, setQuery] = useState({ page: 1, categoryId: '', title: '' });
  const [searchInput, setSearchInput] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const requestIdRef = useRef(0);
  const editorContainerRef = useRef(null);

  useEffect(() => {
    if (!isCreateOpen) return undefined;

    const container = editorContainerRef.current;
    if (!container) return undefined;

    // ReactQuill does not forward aria-label, so name its contenteditable root.
    // StrictMode remounts the editor in development, so reapply if replaced.
    const labelEditor = () => {
      const editor = container.querySelector('.ql-editor');
      if (editor && editor.getAttribute('aria-label') !== 'Content') {
        editor.setAttribute('aria-label', 'Content');
      }
    };

    labelEditor();

    const observer = new MutationObserver(labelEditor);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [isCreateOpen]);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const data = await categoryService.getAll();
        if (cancelled) return;

        const list = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
        const nextCategories = Array.isArray(list) ? list : [];
        setCategories(nextCategories);
        setNewCategoryId((current) => current || (nextCategories[0]?.id ? String(nextCategories[0].id) : ''));
      } catch {
        if (!cancelled) {
          setCategoriesError('Could not load categories. Filtering and post creation may be limited.');
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    const loadPosts = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await postService.getAllPosts(
          query.page,
          PAGE_SIZE,
          query.categoryId ? Number(query.categoryId) : '',
          query.title,
        );

        if (cancelled || requestId !== requestIdRef.current) return;

        const payload = data?.data ?? data;
        const items = Array.isArray(payload?.items) ? payload.items : [];

        setPosts(items.map(withoutMedia));
        setTotalPages(payload?.totalPages || 1);
        setTotalCount(typeof payload?.totalCount === 'number' ? payload.totalCount : items.length);
      } catch {
        if (cancelled || requestId !== requestIdRef.current) return;

        setPosts([]);
        setTotalPages(1);
        setTotalCount(0);
        setError('Could not load posts. Please try again.');
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [query, reloadToken]);

  const hasActiveFilters = Boolean(query.categoryId || query.title);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setQuery((current) => ({ ...current, page: 1, title: searchInput.trim() }));
  };

  const handleCategoryFilter = (event) => {
    const { value } = event.target;
    setQuery((current) => ({ ...current, page: 1, categoryId: value }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setQuery({ page: 1, categoryId: '', title: '' });
  };

  const handlePageChange = (page) => {
    setQuery((current) => ({ ...current, page }));
  };

  const openCreateDialog = () => {
    setCreateError('');
    setNewTitle('');
    setNewContent('');
    setNewCategoryId(categories[0]?.id ? String(categories[0].id) : '');
    setIsCreateOpen(true);
  };

  const closeCreateDialog = () => {
    if (saving) return;
    setIsCreateOpen(false);
    setCreateError('');
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) return;

    const title = newTitle.trim();
    const content = newContent.trim();

    if (!title || !content || !newCategoryId) {
      setCreateError('Title, content and category are required.');
      return;
    }

    setSaving(true);
    setCreateError('');

    try {
      await postService.createPost({
        title,
        content,
        categoryId: Number(newCategoryId),
      });

      setIsCreateOpen(false);
      setNewTitle('');
      setNewContent('');
      setQuery((current) => ({ ...current, page: 1 }));
    } catch {
      setCreateError('Could not create the post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;

    setDeleting(true);
    setError('');

    try {
      await postService.deletePost(postToDelete.id);
      setReloadToken((token) => token + 1);
    } catch {
      setError('Could not delete the post. Please try again.');
    } finally {
      setDeleting(false);
      setPostToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Archive"
        title="Posts"
        description={
          hasActiveFilters
            ? `Showing ${totalCount} ${totalCount === 1 ? 'post' : 'posts'} matching your filters.`
            : 'Read the archive, search by title, and manage your writing.'
        }
        actions={
          <>
            {!loading ? (
              <Badge variant="neutral">
                {totalCount} {totalCount === 1 ? 'post' : 'posts'}
              </Badge>
            ) : null}

            {isAuthenticated ? (
              <Button icon={<Plus />} onClick={openCreateDialog}>
                New post
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={<LogIn />}
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                Sign in to write
              </Button>
            )}
          </>
        }
      />

      {categoriesError ? (
        <Alert variant="warning" onDismiss={() => setCategoriesError('')}>
          {categoriesError}
        </Alert>
      ) : null}

      <Card padding="sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Search by title"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search posts by title…"
            className="sm:flex-1"
          />

          <Select
            label="Filter by category"
            value={query.categoryId}
            onChange={handleCategoryFilter}
            className="sm:w-56"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="secondary"
              icon={<Search />}
              className="flex-1 sm:flex-none"
            >
              Search
            </Button>

            {hasActiveFilters ? (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="flex-1 sm:flex-none"
              >
                Clear
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {error ? (
        <Alert variant="danger" onDismiss={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {loading && posts.length === 0 ? (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} variant="card" />
          ))}
          <span className="sr-only" role="status">
            Loading posts…
          </span>
        </div>
      ) : posts.length === 0 ? (
        error ? null : (
          <EmptyState
            title="No posts found"
            description={
              hasActiveFilters
                ? 'Try a different search term or category.'
                : 'There are no posts to read yet.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy={loading || undefined}>
          {posts.map((post) => (
            <li key={post.id} className="min-w-0">
              <PostCard
                post={post}
                canDelete={isAuthenticated}
                onOpen={() => navigate(`/posts/${post.id}`)}
                onDelete={() => setPostToDelete(post)}
              />
            </li>
          ))}
        </ul>
      )}

      {posts.length > 0 && totalPages > 1 ? (
        <div className="space-y-2 pt-2">
          <Pagination page={query.page} totalPages={totalPages} onPageChange={handlePageChange} />
          <p className="sr-only" role="status">
            Page {query.page} of {totalPages}
          </p>
        </div>
      ) : null}

      <Modal
        open={isCreateOpen}
        onClose={closeCreateDialog}
        title="New post"
        size="lg"
        closeDisabled={saving}
        footer={
          <>
            <Button variant="secondary" onClick={closeCreateDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="create-post-form" loading={saving}>
              Create post
            </Button>
          </>
        }
      >
        <form id="create-post-form" onSubmit={handleCreatePost} className="flex flex-col gap-5">
          {createError ? <Alert variant="danger">{createError}</Alert> : null}

          <Select
            label="Category"
            required
            placeholder="Select a category"
            value={newCategoryId}
            onChange={(event) => setNewCategoryId(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Input
            label="Title"
            required
            placeholder="Enter post title…"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />

          <fieldset className="flex min-w-0 flex-col gap-1.5">
            <legend className="text-sm font-medium text-ink">
              Content
              <span aria-hidden="true" className="ml-0.5 text-danger">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </legend>
            <div
              ref={editorContainerRef}
              className="overflow-hidden rounded-md border border-line bg-surface [&_.ql-container]:min-h-40 [&_.ql-container]:border-0 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-line"
            >
              <ReactQuill theme="snow" value={newContent} onChange={setNewContent} />
            </div>
          </fieldset>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(postToDelete)}
        title="Delete this post?"
        description={
          postToDelete
            ? `"${postToDelete.title}" will be permanently deleted. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setPostToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
