# UI Kit — Warm Editorial

Shared React components for BlogFront. The system is warm, paper-toned, and
editorial: serif headings, a rust accent, generous radii, and a soft elevation
token. Everything is built with the dependencies already present in this
project (React, `lucide-react`, Tailwind CSS v4).

Import from the barrel:

```jsx
import { Button, Card, Input } from '../components/ui';
```

Every component is a named export. There are no default exports and no new
runtime dependencies.

## Rules

- **No inline styles.** Use Tailwind utilities, design tokens, or `cn()`.
- **Use tokens, not raw values.** `bg-surface`, `text-ink`, `border-line`,
  `rounded-lg`, `shadow-soft`. Raw hex values belong only in the token
  definitions in `src/index.css`.
- **No new font packages.** `font-sans` resolves to Inter when available and
  falls back to the platform UI stack; `font-serif` resolves to Newsreader when
  available and falls back to Georgia.
- **Do not hand-roll focus styles.** The base layer provides a visible accent
  outline on `:focus-visible`, and every interactive component keeps it.
- **`cn()` is additive, not a Tailwind conflict resolver.** Do not pass a
  utility that contradicts a component's own utility (for example
  `className="bg-danger"` on a `secondary` Button). Use the variant API
  instead. Padding on `Card` is controlled by its `padding` prop for the same
  reason.

## Tokens

Defined as Tailwind v4 theme variables in `src/index.css`, so utilities such as
`bg-paper`, `text-ink-muted`, and `border-accent` are generated automatically.

| Token | Light | Dark |
| --- | --- | --- |
| `paper` | `#FAF8F4` | `#12100E` |
| `surface` | `#FFFFFF` | `#1C1917` |
| `surface-muted` | `#F3EFE8` | `#24201C` |
| `ink` | `#1C1917` | `#F5F0E8` |
| `ink-muted` | `#6B6560` | `#A8A29E` |
| `line` | `#E5DED3` | `#2E2A26` |
| `accent` | `#9A3412` | `#FB923C` |
| `accent-hover` | `#7C2D12` | `#FDBA74` |
| `accent-soft` | `#FDF0E7` | `#2A1A12` |
| `success` | `#15803D` | — |
| `warning` | `#B45309` | — |
| `danger` | `#B91C1C` | — |
| `info` | `#1D4ED8` | — |

Also available: `font-sans`, `font-serif`, `rounded-sm|md|lg|xl`, and
`shadow-soft`.

### Dark mode

Dark mode is class based. Put `class="dark"` on `<html>` (top-level element
recommended so native controls and scrollbars follow `color-scheme`):

```html
<html class="dark">
```

Use the `dark:` variant for one-off adjustments. Tokens above already flip, so
most components need no dark-specific classes.

## Components

### Button

```jsx
<Button>Save post</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Preview</Button>
<Button variant="danger" icon={<Trash2 />}>Delete</Button>
<Button variant="link">Read more</Button>
<Button loading loadingLabel="Saving">Save</Button>
```

`variant`: `primary` (default), `secondary`, `ghost`, `danger`, `link`.
`size`: `sm`, `md` (default), `lg`. Loading disables the button and sets
`aria-busy`. Defaults to `type="button"`.

### IconButton

`label` is required and becomes `aria-label`.

```jsx
<IconButton label="Edit post" icon={<Pencil />} />
<IconButton label="Delete post" icon={<Trash2 />} variant="danger" size="sm" />
```

`variant`: `ghost` (default), `secondary`, `primary`, `danger`.
`size`: `sm`, `md` (default), `lg`.

### Field, Input, Textarea, Select

`Input`, `Textarea`, and `Select` accept `label`, `hint`, `error`, and
`required` and wire up `id`, `htmlFor`, `aria-describedby`, and `aria-invalid`
for you.

```jsx
<Input
  label="Email"
  type="email"
  hint="We never share your address."
  required
/>

<Input label="Title" error={errors.title} />
<Textarea label="Excerpt" rows={5} />
<Select label="Category" placeholder="Choose a category">
  <option value="design">Design</option>
  <option value="engineering">Engineering</option>
</Select>
```

For custom controls, `Field` exposes the generated ids through a render
function, or clones a single child element and adds the ARIA props:

```jsx
<Field label="Cover image" hint="PNG or JPG, up to 2 MB">
  {({ id, describedBy }) => (
    <input id={id} type="file" aria-describedby={describedBy} />
  )}
</Field>
```

### Card, Badge, Avatar

```jsx
<Card>
  <h3 className="font-serif text-lg">Warm reading</h3>
  <p className="mt-2 text-sm text-ink-muted">…</p>
</Card>

<Card as="article" padding="lg">…</Card>

<Badge variant="success">Published</Badge>
<Badge variant="accent">Draft</Badge>

<Avatar name="Fatma Adel" />
<Avatar src="/avatar.jpg" name="Fatma Adel" size="lg" />
```

`Card` supports `as` (default `div`) and `padding`: `none`, `sm`, `md`
(default), `lg`. `Badge` variants: `neutral`, `accent`, `success`, `warning`,
`danger`. `Avatar` falls back to initials, then a user icon, if the image is
missing or fails to load.

### Modal and ConfirmDialog

```jsx
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Publish post"
  description="This will make the post visible to everyone."
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={publish}>Publish</Button>
    </>
  }
>
  <Input label="Slug" />
</Modal>
```

The modal renders in a portal, sets `role="dialog"` and `aria-modal`, links
`aria-labelledby` to `title`, closes on Escape or a backdrop click, traps Tab
focus, restores focus to the trigger, locks body scroll, and becomes a bottom
sheet below the `sm` breakpoint. `title` is required.

`ConfirmDialog` is the common confirmation case:

```jsx
<ConfirmDialog
  open={confirming}
  title="Delete this post?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  loading={deleting}
  onCancel={() => setConfirming(false)}
  onConfirm={handleDelete}
/>
```

`tone` can be `danger` (default) or `primary`. While `loading` is true the
dialog cannot be dismissed.

### Tabs

```jsx
<Tabs defaultValue="published">
  <TabsList aria-label="Post status">
    <TabsTrigger value="published">Published</TabsTrigger>
    <TabsTrigger value="drafts">Drafts</TabsTrigger>
  </TabsList>
  <TabsPanel value="published">…</TabsPanel>
  <TabsPanel value="drafts">…</TabsPanel>
</Tabs>
```

Implements `tablist`/`tab`/`tabpanel` roles, `aria-selected`, `aria-controls`,
roving `tabIndex`, and Arrow/Home/End navigation with automatic activation.
Use `value` + `onChange` for controlled tabs. Panels stay mounted and are
hidden with the `hidden` attribute, so local state is preserved.

### Alert, EmptyState, Skeleton, Spinner

```jsx
<Alert variant="warning" title="Unsaved changes" onDismiss={dismiss}>
  Your draft has not been saved yet.
</Alert>

<EmptyState
  title="No posts yet"
  description="Write your first post to see it here."
  action={<Button>New post</Button>}
/>

<Skeleton variant="card" />
<Skeleton variant="text" className="w-2/3" />
<Skeleton variant="avatar" />

<Spinner label="Loading posts" />
```

Alert variants: `info`, `success`, `warning`, `danger`. Warnings and errors use
`role="alert"`; the others use `role="status"`. Skeletons are `aria-hidden`;
mark their container with `aria-busy="true"` and include a status message such
as `Spinner`.

### Pagination

```jsx
<Pagination page={page} totalPages={24} onPageChange={setPage} />
```

Renders previous/next controls and a windowed page list. The active page has
`aria-current="page"`; previous/next are disabled at the bounds. Adjust the
window with `siblingCount` (default `1`) and name the landmark with `label`
(default `"Pagination"`).

## Accessibility checklist

- Icon-only controls need a `label` (`IconButton`) or `aria-label` (`Button`).
- Every field should have a visible `label` unless an equivalent accessible
  name is provided by surrounding context.
- Modals need a `title`; do not nest dialogs unless necessary.
- Keep the global `:focus-visible` outline intact.
- Motion is reduced globally when `prefers-reduced-motion: reduce` is set.
