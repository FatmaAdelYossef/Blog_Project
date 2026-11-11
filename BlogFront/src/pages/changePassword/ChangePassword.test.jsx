import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangePassword from './ChangePassword';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    changePassword: vi.fn(),
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ChangePassword />
    </MemoryRouter>,
  );

const fill = async (user, { current, next, confirm }) => {
  await user.type(screen.getByLabelText(/^Current password/), current);
  await user.type(screen.getByLabelText(/^New password/), next);
  await user.type(screen.getByLabelText(/^Confirm new password/), confirm);
};

beforeEach(() => {
  authService.changePassword.mockReset();
});

describe('ChangePassword', () => {
  it('rejects mismatched passwords without calling the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await fill(user, { current: 'old-password', next: 'new-password', confirm: 'different' });
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByRole('alert')).toHaveTextContent('New passwords do not match.');
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('sends only the contract fields and reports success', async () => {
    authService.changePassword.mockResolvedValue({});

    const user = userEvent.setup();
    renderPage();

    await fill(user, {
      current: 'old-password',
      next: 'new-password',
      confirm: 'new-password',
    });
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Password changed successfully!');
    expect(authService.changePassword).toHaveBeenCalledWith({
      CurrentPassword: 'old-password',
      NewPassword: 'new-password',
    });
  });

  it('surfaces a failed change without losing the form', async () => {
    authService.changePassword.mockRejectedValue(new Error('400'));

    const user = userEvent.setup();
    renderPage();

    await fill(user, {
      current: 'wrong-password',
      next: 'new-password',
      confirm: 'new-password',
    });
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to change password. Please check your current password.',
    );
    expect(screen.getByLabelText(/^Current password/)).toBeInTheDocument();
  });
});
