import { Button } from './Button';
import { Modal } from './Modal';

/**
 * Confirmation dialog built on `Modal`. Escape and the backdrop behave like
 * Cancel; while `loading` the dialog cannot be dismissed.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {import('react').ReactNode} props.title
 * @param {import('react').ReactNode} [props.description]
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {() => void} [props.onConfirm]
 * @param {() => void} [props.onCancel]
 * @param {boolean} [props.loading]
 * @param {'danger' | 'primary'} [props.tone]
 * @param {import('react').ReactNode} [props.children]
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  tone = 'danger',
  children,
}) {
  const handleClose = () => {
    if (!loading) onCancel?.();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size="sm"
      closeDisabled={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ??
        (description ? <p className="text-sm text-ink-muted">{description}</p> : null)}
    </Modal>
  );
}
