import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPassword from './ResetPassword';
import { ThemeProvider } from '../../context/ThemeContext';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

const renderPage = (url = '/reset-password') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <ThemeProvider>
        <ResetPassword />
      </ThemeProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  authService.resetPassword.mockReset();
});

describe('ResetPassword', () => {
  it('refuses to render the form when the email or token is missing', () => {
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid reset link');
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request a new link' })).toBeInTheDocument();
  });

  it('submits the credentials from the reset link', async () => {
    authService.resetPassword.mockResolvedValue({ succeeded: true });

    const user = userEvent.setup();
    renderPage('/reset-password?email=writer%40example.test&token=reset-token');

    await user.type(screen.getByLabelText(/^New password/), 'new-password');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(authService.resetPassword).toHaveBeenCalledWith({
      Email: 'writer@example.test',
      Token: 'reset-token',
      NewPassword: 'new-password',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('All set');
  });

  it('reports an invalid or expired link when the API rejects the reset', async () => {
    authService.resetPassword.mockRejectedValue(new Error('400'));

    const user = userEvent.setup();
    renderPage('/reset-password?email=writer%40example.test&token=stale-token');

    await user.type(screen.getByLabelText(/^New password/), 'new-password');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to reset password. The link may have expired or is invalid.',
    );
  });
});
