import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useLanguage } from '../../i18n';
import { siteSettingsService } from '../../services/siteSettingsService';
import { Alert, Button, Card, Input } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';

const DEFAULT_LIGHT_ACCENT = '#9a3412';
const DEFAULT_DARK_ACCENT = '#fb923c';

const toHexInput = (value, fallback) => (value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : fallback);
const toApiColor = (value, fallback) => {
  const hex = toHexInput(value, fallback);
  return hex.toLowerCase() === fallback.toLowerCase() ? null : hex;
};

function ColorField({ id, label, hint, value, fallback, onChange, onReset, resetLabel }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-muted/50 p-4 sm:flex-row sm:items-center">
      <input
        type="color"
        id={id}
        aria-label={label}
        value={toHexInput(value, fallback)}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-16 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-1"
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <p className="mt-0.5 font-mono text-xs text-ink-muted">
          {value || fallback} {value ? '' : `(${hint})`}
        </p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={!value}>
        <RotateCcw aria-hidden="true" />
        {resetLabel}
      </Button>
    </div>
  );
}

export default function CustomizePage() {
  const { user } = useAuth();
  const { settings, refresh } = useSiteSettings();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'Admin';

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  // Fill the form once the settings arrive (cached settings count too).
  // Adjusting state during render is React's recommended alternative to a
  // setState-in-effect hydration pass.
  if (form === null && settings?.siteName) {
    setForm({
      siteName: settings.siteName ?? '',
      tagline: settings.tagline ?? '',
      accentLight: settings.accentColorLight ?? '',
      accentDark: settings.accentColorDark ?? '',
    });
  }

  const siteName = form?.siteName ?? '';
  const tagline = form?.tagline ?? '';
  const accentLight = form?.accentLight ?? '';
  const accentDark = form?.accentDark ?? '';
  const patchForm = (patch) => setForm((current) => ({ ...(current ?? {}), ...patch }));

  const previewAccent = accentLight || DEFAULT_LIGHT_ACCENT;
  const previewDarkAccent = accentDark || accentLight || DEFAULT_DARK_ACCENT;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      await siteSettingsService.update({
        siteName: siteName.trim(),
        tagline: tagline.trim() || null,
        accentColorLight: toApiColor(accentLight, DEFAULT_LIGHT_ACCENT),
        accentColorDark: toApiColor(accentDark, DEFAULT_DARK_ACCENT),
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message || t('customize.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow={t('nav.workspace')} title={t('customize.title')} />
        <Alert variant="warning">{t('customize.adminOnly')}</Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t('nav.workspace')}
        title={t('customize.title')}
        description={t('customize.desc')}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card padding="lg">
          <h2 className="font-serif text-xl font-semibold text-ink">{t('customize.identity')}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t('customize.identityHint')}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              label={t('customize.nameLabel')}
              value={siteName}
              onChange={(event) => {
                patchForm({ siteName: event.target.value });
                setSaved(false);
              }}
              placeholder={t('customize.namePlaceholder')}
              required
              minLength={2}
              maxLength={80}
            />
            <Input
              label={t('customize.taglineLabel')}
              value={tagline}
              onChange={(event) => {
                patchForm({ tagline: event.target.value });
                setSaved(false);
              }}
              placeholder={t('customize.taglinePlaceholder')}
              maxLength={160}
            />
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="font-serif text-xl font-semibold text-ink">{t('customize.colors')}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t('customize.colorsHint')}</p>

          <div className="mt-5 grid gap-4">
            <ColorField
              id="accent-light"
              label={t('customize.lightAccent')}
              hint={t('customize.default')}
              value={accentLight}
              fallback={DEFAULT_LIGHT_ACCENT}
              onChange={(value) => {
                patchForm({ accentLight: value });
                setSaved(false);
              }}
              onReset={() => patchForm({ accentLight: '' })}
              resetLabel={t('customize.useDefault')}
            />
            <ColorField
              id="accent-dark"
              label={t('customize.darkAccent')}
              hint={t('customize.default')}
              value={accentDark}
              fallback={previewDarkAccent}
              onChange={(value) => {
                patchForm({ accentDark: value });
                setSaved(false);
              }}
              onReset={() => patchForm({ accentDark: '' })}
              resetLabel={t('customize.useDefault')}
            />
          </div>

          <div className="mt-6 rounded-lg border border-line bg-surface-muted/60 p-5">
            <p className="font-mono text-2xs font-medium uppercase tracking-[0.18em] text-ink-muted">
              {t('customize.preview')}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: previewAccent }}
              >
                <Check aria-hidden="true" className="size-4" />
                {t('customize.previewButton')}
              </span>
              <span
                className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, ${previewAccent} 12%, white)`,
                  color: previewAccent,
                }}
              >
                {t('customize.previewBadge')}
              </span>
              <span
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: previewAccent, color: previewAccent }}
              >
                {t('customize.previewLink')}
              </span>
            </div>
            <p className="mt-4 font-serif text-lg font-semibold text-ink">
              {siteName.trim() || t('customize.previewFallbackName')}
            </p>
            {tagline.trim() ? (
              <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-ink-muted">{tagline.trim()}</p>
            ) : null}
          </div>
        </Card>

        {error ? <Alert variant="danger">{error}</Alert> : null}
        {saved ? <Alert variant="success">{t('customize.saved')}</Alert> : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !siteName.trim()}>
            {saving ? t('customize.saving') : t('customize.save')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => {
              patchForm({ accentLight: '', accentDark: '' });
              setSaved(false);
            }}
          >
            {t('customize.resetColors')}
          </Button>
        </div>
      </form>
    </div>
  );
}
