import { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, Card, ConfirmDialog, EmptyState, Input, Spinner } from '../../components/ui';

export default function CategoriesPage() {
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async (silent = false) => {
    try {
      const data = await categoryService.getAll();
      const list = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      setError('Could not load categories. Please try again.');
      if (!silent) setCategories([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      await fetchCategories();
    };

    loadCategories();
  }, [fetchCategories]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await categoryService.update(editingId, { name: trimmedName });
      } else {
        await categoryService.create({ name: trimmedName });
      }

      setName('');
      setEditingId(null);
      await fetchCategories(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save the category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.name);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    setDeleting(true);
    setError('');

    try {
      await categoryService.delete(pendingDelete.id);
      await fetchCategories(true);
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Could not delete the category. It may still have posts.',
      );
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="sr-only">Manage categories</h2>

      {error ? (
        <Alert variant="danger" onDismiss={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {isAuthenticated ? (
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Category name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New category name..."
              className="sm:flex-1"
            />

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                loading={saving}
                disabled={!name.trim()}
                className="sm:shrink-0"
              >
                {editingId ? 'Update category' : 'Add category'}
              </Button>

              {editingId ? (
                <Button variant="ghost" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <div aria-busy="true" className="flex justify-center py-10">
          <Spinner label="Loading categories" />
        </div>
      ) : categories.length === 0 ? (
        error ? null : (
          <EmptyState
            title="No categories yet"
            description="Categories group posts so readers can browse by topic."
          />
        )
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-line">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0 break-words text-ink">{category.name}</span>

                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Pencil />}
                      onClick={() => handleEdit(category)}
                      aria-label={`Edit ${category.name}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={<Trash2 />}
                      onClick={() => setPendingDelete(category)}
                      aria-label={`Delete ${category.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this category?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently deleted. Categories that still have posts cannot be deleted.`
            : undefined
        }
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
