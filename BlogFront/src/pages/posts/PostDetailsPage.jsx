import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ArrowLeft, ExternalLink, FileQuestion, ImageIcon, LinkIcon, Music, Pencil, Plus, Trash2 } from 'lucide-react';
import { postService } from '../../services/postService';
import { uploadService } from '../../services/uploadService';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import { sanitizeHtml } from '../../lib/sanitize';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Select,
  Spinner,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
} from '../../components/ui';

const TABS = [
  { value: 'details', label: 'Details', singular: 'detail' },
  { value: 'Image', label: 'Images', singular: 'image' },
  { value: 'Music', label: 'Music', singular: 'track' },
  { value: 'Link', label: 'Links', singular: 'link' },
];

const MEDIA_TABS = TABS.filter((tab) => tab.value !== 'details');

const MEDIA_ICONS = {
  Image: <ImageIcon />,
  Music: <Music />,
  Link: <LinkIcon />,
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function PostDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');

  const [newFiles, setNewFiles] = useState([]);
  const [newTextUrl, setNewTextUrl] = useState('');
  const [editingMediaId, setEditingMediaId] = useState(null);
  const [editTextUrl, setEditTextUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [mediaToDelete, setMediaToDelete] = useState(null);

  const editorContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const data = await postService.getPostById(id);
      const postData = data?.data ?? data;

      setPost(postData);
      setTitle(postData?.title ?? '');
      setContent(postData?.content ?? '');
      setCategoryId(postData?.categoryId ? String(postData.categoryId) : '');
    } catch {
      setPost(null);
      setLoadError('Could not load this post. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      await loadPost();
    };

    load();
  }, [loadPost]);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const data = await categoryService.getAll();
        if (cancelled) return;

        const list = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
        setCategories(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) {
          setCategoriesError('Could not load categories. The category selector may be incomplete.');
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;

    const container = editorContainerRef.current;
    if (!container) return;

    // ReactQuill does not forward aria-label, so name its contenteditable root.
    // StrictMode remounts the editor in development, so reapply if it is replaced.
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
  }, [isEditing, activeTab]);

  const getMedias = (mediaType) =>
    (post?.medias ?? []).filter((media) => media.mediaType === mediaType);

  const closeEditMode = () => {
    if (saving) return;

    setIsEditing(false);
    setActionError('');
    setTitle(post?.title ?? '');
    setContent(post?.content ?? '');
    setCategoryId(post?.categoryId ? String(post.categoryId) : '');
    setNewFiles([]);
    setNewTextUrl('');
    setEditingMediaId(null);
    setEditTextUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setActionError('');
    setNewFiles([]);
    setNewTextUrl('');
    setEditingMediaId(null);
    setEditTextUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdatePost = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) return;

    const nextTitle = title.trim();
    const nextContent = content.trim();

    if (!nextTitle || !nextContent) {
      setActionError('Title and content are required.');
      return;
    }

    setSaving(true);
    setActionError('');

    try {
      await postService.updatePost(id, {
        title: nextTitle,
        content: nextContent,
        categoryId: categoryId ? Number(categoryId) : null,
      });

      setIsEditing(false);
      await loadPost();
    } catch {
      setActionError('Could not save the post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files ?? []);
    setNewFiles(files);
    setActionError('');
  };

  const handleAddMedia = async (mediaType) => {
    if (!isAuthenticated) return;

    if (mediaType === 'Image' && newFiles.length === 0) {
      setActionError('Choose at least one image to upload.');
      return;
    }

    const textUrl = newTextUrl.trim();
    if (mediaType !== 'Image' && !textUrl) {
      setActionError('Enter a URL first.');
      return;
    }

    setSaving(true);
    setActionError('');

    try {
      if (mediaType === 'Image') {
        for (const file of newFiles) {
          const uploadedFileName = await uploadService.uploadImage(file);
          await postService.addMediaToPost(id, {
            url: uploadedFileName,
            mediaType,
          });
        }

        setNewFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        await postService.addMediaToPost(id, { url: textUrl, mediaType });
        setNewTextUrl('');
      }

      await loadPost();
    } catch {
      setActionError('Could not add the media item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMediaItem = async (mediaId, mediaType) => {
    if (!isAuthenticated) return;

    const nextUrl = editTextUrl.trim();
    if (!nextUrl) {
      setActionError('Enter a URL first.');
      return;
    }

    setSaving(true);
    setActionError('');

    try {
      await postService.updateMediaToPost(mediaId, { url: nextUrl, mediaType });
      setEditingMediaId(null);
      setEditTextUrl('');
      await loadPost();
    } catch {
      setActionError('Could not update the media item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteMedia = async () => {
    if (!mediaToDelete) return;

    setSaving(true);
    setActionError('');

    try {
      await postService.deleteMedia(mediaToDelete.id);
      await loadPost();
    } catch {
      setActionError('Could not delete the media item. Please try again.');
    } finally {
      setSaving(false);
      setMediaToDelete(null);
    }
  };

  if (loading && !post) {
    return (
      <div className="flex min-h-64 items-center justify-center" aria-busy="true">
        <Spinner size="lg" label="Loading post details…" />
      </div>
    );
  }

  if (!post) {
    return (
      <EmptyState
        icon={<FileQuestion />}
        title={loadError ? 'Could not load this post' : 'Post not found'}
        description={loadError || 'The post you are looking for does not exist or was removed.'}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft />}
              onClick={() => navigate('/posts')}
            >
              Back to posts
            </Button>
            {loadError ? (
              <Button onClick={loadPost} loading={loading}>
                Try again
              </Button>
            ) : null}
          </div>
        }
      />
    );
  }

  const publishedAt = formatDate(post.createdAt);
  const mediaToDeleteTab = MEDIA_TABS.find((tab) => tab.value === mediaToDelete?.mediaType);

  const renderMediaList = (tab) => {
    const medias = getMedias(tab.value);

    if (medias.length === 0) {
      return (
        <EmptyState
          icon={MEDIA_ICONS[tab.value]}
          title={`No ${tab.label.toLowerCase()} yet`}
          description={`This post does not have any ${tab.label.toLowerCase()} attached.`}
        />
      );
    }

    return (
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {medias.map((media, index) => (
          <li key={media.id}>
            <Card padding="sm" className="h-full">
              {tab.value === 'Image' ? (
                <img
                  src={media.url}
                  alt={`${post.title} image ${index + 1}`}
                  loading="lazy"
                  className="h-40 w-full rounded-md border border-line object-cover"
                />
              ) : (
                <a
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 break-all text-sm text-accent underline-offset-4 hover:underline"
                >
                  <ExternalLink aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{media.url}</span>
                </a>
              )}
            </Card>
          </li>
        ))}
      </ul>
    );
  };

  const renderMediaEditor = (tab) => {
    const medias = getMedias(tab.value);

    return (
      <div className="flex flex-col gap-8">
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-ink">
            Current {tab.label.toLowerCase()}
          </h3>

          {medias.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Nothing attached yet. Add the first {tab.singular} below.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {medias.map((media, index) => (
                <li key={media.id}>
                  <Card padding="sm" className="h-full">
                    <div className="flex h-full flex-col gap-3">
                      {tab.value === 'Image' ? (
                        <img
                          src={media.url}
                          alt={`${post.title} image ${index + 1}`}
                          loading="lazy"
                          className="h-36 w-full rounded-md border border-line object-cover"
                        />
                      ) : editingMediaId === media.id ? (
                        <Input
                          aria-label={`Edit ${tab.singular} URL`}
                          value={editTextUrl}
                          onChange={(event) => setEditTextUrl(event.target.value)}
                          placeholder="https://…"
                        />
                      ) : (
                        <p className="flex-1 break-all text-sm text-ink-muted">{media.url}</p>
                      )}

                      {tab.value !== 'Image' && editingMediaId === media.id ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            loading={saving}
                            onClick={() => handleUpdateMediaItem(media.id, tab.value)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={saving}
                            onClick={() => {
                              setEditingMediaId(null);
                              setEditTextUrl('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-auto flex flex-wrap gap-2">
                          {tab.value !== 'Image' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Pencil />}
                              aria-label={`Edit ${tab.singular} URL`}
                              onClick={() => {
                                setEditingMediaId(media.id);
                                setEditTextUrl(media.url);
                              }}
                            >
                              Edit URL
                            </Button>
                          ) : null}

                          <Button
                            size="sm"
                            variant="danger"
                            icon={<Trash2 />}
                            aria-label={`Delete ${tab.singular} ${index + 1}`}
                            onClick={() => setMediaToDelete(media)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3" aria-labelledby={`add-${tab.value}-heading`}>
          <h3 id={`add-${tab.value}-heading`} className="text-sm font-medium text-ink">
            {tab.value === 'Image' ? 'Add images' : `Add a ${tab.singular} URL`}
          </h3>

          {tab.value === 'Image' ? (
            <div className="flex flex-col gap-4 rounded-lg border border-dashed border-line bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <label htmlFor="new-media-files" className="text-sm font-medium text-ink">
                  Choose images
                </label>
                <input
                  id="new-media-files"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-sm text-ink-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-surface hover:file:bg-accent-hover"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Select one or more images to upload to this post.
                </p>
              </div>

              <Button
                icon={<Plus />}
                loading={saving}
                disabled={newFiles.length === 0}
                onClick={() => handleAddMedia(tab.value)}
              >
                Upload and add
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                label={`${tab.label} URL`}
                value={newTextUrl}
                onChange={(event) => setNewTextUrl(event.target.value)}
                placeholder="https://…"
                className="sm:flex-1"
              />
              <Button
                icon={<Plus />}
                loading={saving}
                onClick={() => handleAddMedia(tab.value)}
              >
                Add {tab.singular}
              </Button>
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderDetailsView = () => (
    <article className="space-y-4">
      <h2 className="break-words font-serif text-3xl font-semibold tracking-tight text-ink">
        {post.title}
      </h2>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        {publishedAt ? (
          <time dateTime={post.createdAt}>Published {publishedAt}</time>
        ) : null}
        {post.categoryName ? <Badge variant="accent">{post.categoryName}</Badge> : null}
      </div>

      <hr className="border-line" />

      {post.content ? (
        <div
          className="text-base leading-relaxed text-ink [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-ink-muted [&_h1]:my-4 [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:my-4 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-4 [&_img]:rounded-md [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-3 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      ) : (
        <p className="text-sm text-ink-muted">This post has no content yet.</p>
      )}
    </article>
  );

  const renderDetailsEditor = () => (
    <form onSubmit={handleUpdatePost} className="flex flex-col gap-5" noValidate>
      <Input
        label="Title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Enter post title…"
      />

      <Select
        label="Category"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        <option value="">No category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>

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
          <ReactQuill theme="snow" value={content} onChange={setContent} />
        </div>
      </fieldset>

      <div>
        <Button type="submit" loading={saving} loadingLabel="Saving">
          Save changes
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" icon={<ArrowLeft />} onClick={() => navigate(-1)}>
          Back
        </Button>

        {isAuthenticated && !isEditing ? (
          <Button
            icon={<Pencil />}
            onClick={() => {
              setActionError('');
              setIsEditing(true);
            }}
          >
            Edit post
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <Alert variant="danger" onDismiss={() => setActionError('')}>
          {actionError}
        </Alert>
      ) : null}

      {categoriesError ? (
        <Alert variant="warning" onDismiss={() => setCategoriesError('')}>
          {categoriesError}
        </Alert>
      ) : null}

      <Card padding="md" aria-busy={loading || undefined}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <TabsList aria-label="Post content">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsPanel value="details">
            {isEditing ? renderDetailsEditor() : renderDetailsView()}
          </TabsPanel>

          {MEDIA_TABS.map((tab) => (
            <TabsPanel key={tab.value} value={tab.value}>
              {isEditing ? renderMediaEditor(tab) : renderMediaList(tab)}
            </TabsPanel>
          ))}
        </Tabs>

        {isEditing ? (
          <div className="mt-6 border-t border-line pt-5">
            <Button variant="secondary" onClick={closeEditMode} disabled={saving}>
              Close edit mode
            </Button>
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={Boolean(mediaToDelete)}
        title={`Remove this ${mediaToDeleteTab?.singular ?? 'media item'}?`}
        description="It will be detached from this post. This action cannot be undone."
        confirmLabel="Remove"
        loading={saving}
        onCancel={() => setMediaToDelete(null)}
        onConfirm={handleConfirmDeleteMedia}
      />
    </div>
  );
}
