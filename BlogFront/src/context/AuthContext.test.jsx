import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { clearToken, setToken } from '../lib/tokenStorage';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const NAME_IDENTIFIER_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const base64url = (value) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeToken = (payload) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;

const futureExp = () => Math.floor(Date.now() / 1000) + 3600;

function AuthProbe() {
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <div>
      <p data-testid="status">{isAuthenticated ? 'authenticated' : 'anonymous'}</p>
      <p data-testid="user">
        {user ? `${user.id}|${user.email}|${user.role}` : 'no-user'}
      </p>
      <button type="button" onClick={() => login({ email: 'a@example.test', password: 'pw' })}>
        Log in
      </button>
      <button type="button" onClick={() => logout()}>
        Log out
      </button>
    </div>
  );
}

const renderAuth = () =>
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

beforeEach(() => {
  authService.login.mockReset();
  authService.logout.mockReset();
  authService.logout.mockResolvedValue(undefined);
});

describe('AuthProvider', () => {
  it('starts anonymous when no token is stored', () => {
    renderAuth();

    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('maps full .NET claim URIs onto the user object', () => {
    setToken(
      makeToken({
        exp: futureExp(),
        [NAME_IDENTIFIER_CLAIM]: 'user-1',
        [EMAIL_CLAIM]: 'writer@example.test',
        [ROLE_CLAIM]: 'Admin',
      }),
    );

    renderAuth();

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('user-1|writer@example.test|Admin');
  });

  it('also reads short claim names', () => {
    setToken(
      makeToken({
        exp: futureExp(),
        sub: 'user-2',
        email: 'author@example.test',
        role: 'Author',
      }),
    );

    renderAuth();

    expect(screen.getByTestId('user')).toHaveTextContent('user-2|author@example.test|Author');
  });

  it('ignores an expired token', () => {
    setToken(makeToken({ exp: Math.floor(Date.now() / 1000) - 60, sub: 'user-1' }));

    renderAuth();

    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('becomes authenticated after a successful login', async () => {
    authService.login.mockImplementation(async () => {
      setToken(makeToken({ exp: futureExp(), sub: 'user-3', email: 'new@example.test' }));
      return { data: 'token' };
    });

    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    );
    expect(authService.login).toHaveBeenCalledWith({
      email: 'a@example.test',
      password: 'pw',
    });
    expect(screen.getByTestId('user')).toHaveTextContent('user-3|new@example.test');
  });

  it('clears the session on logout', async () => {
    setToken(makeToken({ exp: futureExp(), sub: 'user-1' }));
    authService.logout.mockImplementation(async () => {
      clearToken();
    });

    const user = userEvent.setup();
    renderAuth();

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous'),
    );
    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('drops the session when the axios layer emits auth:logout', () => {
    setToken(makeToken({ exp: futureExp(), sub: 'user-1' }));

    renderAuth();

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');

    act(() => {
      window.dispatchEvent(new Event('auth:logout'));
    });

    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
  });
});
