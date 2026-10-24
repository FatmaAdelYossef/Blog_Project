import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import { AuthProvider } from '../../context/AuthContext';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<p>home page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

const submit = async (user, email = 'writer@example.test', password = 'secret-password') => {
  await user.type(screen.getByLabelText(/^Email address/), email);
  await user.type(screen.getByLabelText(/^Password/), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
};

beforeEach(() => {
  authService.login.mockReset();
});

describe('Login', () => {
  it('renders the sign-in form', () => {
    renderLogin();

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows a generic error and stays on the page when credentials are rejected', async () => {
    authService.login.mockRejectedValue(new Error('401'));

    const user = userEvent.setup();
    renderLogin();

    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.queryByText('home page')).not.toBeInTheDocument();
  });

  it('navigates to the overview after a successful sign-in', async () => {
    authService.login.mockResolvedValue({ data: 'token' });

    const user = userEvent.setup();
    renderLogin();

    await submit(user);

    expect(await screen.findByText('home page')).toBeInTheDocument();
    expect(authService.login).toHaveBeenCalledWith({
      email: 'writer@example.test',
      password: 'secret-password',
    });
  });
});
