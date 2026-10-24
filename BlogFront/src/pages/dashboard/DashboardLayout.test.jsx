import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import DashboardLayout from './DashboardLayout';
import { AuthProvider } from '../../context/AuthContext';
import { setToken } from '../../lib/tokenStorage';

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

const base64url = (value) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeToken = (payload) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<p>overview content</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

describe('DashboardLayout', () => {
  it('renders the workspace navigation, page heading, and outlet', () => {
    renderLayout();

    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Posts' })).toHaveAttribute('href', '/posts');
    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(screen.getByText('overview content')).toBeInTheDocument();
  });

  it('sets the document title from the current route', () => {
    renderLayout();

    expect(document.title).toBe('Overview · My Blog');
  });

  it('offers a skip link to the main content', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });

  it('opens the mobile drawer, focuses it, and closes on Escape', async () => {
    const user = userEvent.setup();
    renderLayout();

    const openButton = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(openButton);

    const drawer = screen.getByRole('dialog', { name: 'Main navigation' });
    const closeButton = within(drawer).getByRole('button', { name: 'Close navigation' });
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });

  it('wraps Tab focus inside the open mobile drawer', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    const drawer = screen.getByRole('dialog', { name: 'Main navigation' });
    const closeButton = within(drawer).getByRole('button', { name: 'Close navigation' });
    const links = within(drawer).getAllByRole('link');
    const lastLink = links[links.length - 1];

    lastLink.focus();
    expect(lastLink).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(closeButton).toHaveFocus();
  });

  it('shows the guest prompt when signed out', () => {
    renderLayout();

    expect(screen.getByText('Reading as a guest')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('opens the account disclosure for a signed-in user and closes it on Escape', async () => {
    setToken(
      makeToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'writer@example.test',
        role: 'Author',
      }),
    );

    const user = userEvent.setup();
    renderLayout();

    const accountButton = screen.getByRole('button', { name: /writer@example\.test/ });
    await user.click(accountButton);

    expect(accountButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(accountButton).toHaveAttribute('aria-expanded', 'false');
    expect(accountButton).toHaveFocus();
  });
});
