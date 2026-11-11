import { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n';
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, Input, Spinner } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';

export default function CategoriesPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

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
      setError(t('cat.loadError'));
      if (!silent) setCategories([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t]);

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
      setError(err?.response?.data?.message || t('cat.saveError'));
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
        err?.response?.data?.message || t('cat.deleteError'),
      );
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        eyebrow={t('cat.eyebrow')}
        title={t('cat.title')}
        description={t('cat.desc')}
        actions={
          !loading ? (
            <Badge variant="neutral">
              {t(categories.length === 1 ? 'cat.countOne' : 'cat.count', {
                count: categories.length,
              })}
            </Badge>
          ) : null
        }
      />

      {error ? (
        <Alert variant="danger" onDismiss={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {isAuthenticated ? (
        <Card>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-lg font-medium text-ink">
              {editingId ? t('cat.editCategory') : t('cat.newCategory')}
            </h2>
            <span className="eyebrow text-ink-muted">
              {editingId ? t('cat.editing') : t('cat.add')}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label={t('cat.nameLabel')}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('cat.namePlaceholder')}
              className="sm:flex-1"
            />

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                loading={saving}
                disabled={!name.trim()}
                className="sm:shrink-0"
              >
                {editingId ? t('cat.update') : t('cat.addSubmit')}
              </Button>

              {editingId ? (
                <Button variant="ghost" onClick={handleCancelEdit} disabled={saving}>
                  {t('cat.cancel')}
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <div aria-busy="true" className="flex justify-center py-10">
          <Spinner label={t('cat.loading')} />
        </div>
      ) : categories.length === 0 ? (
        error ? null : (
          <EmptyState
            title={t('cat.emptyTitle')}
            description={t('cat.emptyDesc')}
          />
        )
      ) : (
        <Card padding="none" className="overflow-hidden">
          <ul className="divide-y divide-line">
            {categories.map((category, index) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface-muted/60 sm:px-5"
              >
                <span className="flex min-w-0 items-baseline gap-3">
                  <span
                    aria-hidden="true"
                    className="font-mono text-2xs tracking-[0.18em] text-ink-muted"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 break-words font-serif text-lg text-ink">
                    {category.name}
                  </span>
                </span>

                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Pencil />}
                      onClick={() => handleEdit(category)}
                      aria-label={`${t('cat.edit')} ${category.name}`}
                    >
                      {t('cat.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={<Trash2 />}
                      onClick={() => setPendingDelete(category)}
                      aria-label={`${t('cat.delete')} ${category.name}`}
                    >
                      {t('cat.delete')}
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
        title={t('cat.deleteTitle')}
        description={
          pendingDelete
            ? t('cat.deleteDesc', { name: pendingDelete.name })
            : undefined
        }
        confirmLabel={t('cat.deleteConfirm')}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
