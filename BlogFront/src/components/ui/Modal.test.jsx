import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

const renderModal = (props = {}) =>
  render(
    <Modal open onClose={() => {}} title="Delete post" description="This cannot be undone." {...props}>
      <button type="button">Cancel</button>
      <button type="button">Delete</button>
    </Modal>,
  );

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Delete post">
        body
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('labels the dialog with its title and description', () => {
    renderModal();

    const dialog = screen.getByRole('dialog', { name: 'Delete post' });

    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement.firstElementChild;

    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves focus into the dialog and restores it on close', () => {
    const trigger = <button type="button">Open</button>;
    const { rerender } = render(
      <>
        {trigger}
        <Modal open={false} onClose={() => {}} title="Focus test">
          body
        </Modal>
      </>,
    );

    const openButton = screen.getByRole('button', { name: 'Open' });
    openButton.focus();

    rerender(
      <>
        {trigger}
        <Modal open onClose={() => {}} title="Focus test">
          body
        </Modal>
      </>,
    );
    expect(screen.getByRole('dialog')).toHaveFocus();

    rerender(
      <>
        {trigger}
        <Modal open={false} onClose={() => {}} title="Focus test">
          body
        </Modal>
      </>,
    );
    expect(openButton).toHaveFocus();
  });

  it('traps Tab focus inside the dialog', async () => {
    const user = userEvent.setup();
    renderModal();

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    deleteButton.focus();

    await user.tab();

    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('locks body scroll while open and restores it on unmount', () => {
    const { unmount } = renderModal();

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });
});
