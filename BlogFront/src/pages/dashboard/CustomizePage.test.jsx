import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomizePage from './CustomizePage';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { SiteSettingsProvider } from '../../context/SiteSettingsContext';
import { setToken } from '../../lib/tokenStorage';
import { siteSettingsService } from '../../services/siteSettingsService';

vi.mock('../../services/siteSettingsService', () => ({
  siteSettingsService: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

const base64url = (value) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeToken = (payload) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;

const settings = {
  siteName: 'Old Name',
  tagline: 'Old tagline',
  accentColorLight: '#336699',
  accentColorDark: null,
};

const renderPage = ({ role = 'Admin' } = {}) => {
  setToken(
    makeToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: 'admin@example.test',
      role,
    }),
  );

  return render(
    <MemoryRouter>
      <ThemeProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <CustomizePage />
          </AuthProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  siteSettingsService.get.mockResolvedValue(settings);
  siteSettingsService.update.mockResolvedValue(settings);
});

describe('CustomizePage', () => {
  it('hydrates the form from the current settings', async () => {
    renderPage();

    expect(await screen.findByDisplayValue('Old Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old tagline')).toBeInTheDocument();
  });

  it('saves edited identity and colors', async () => {
    const user = userEvent.setup();
    renderPage();

    const nameInput = await screen.findByDisplayValue('Old Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Blog');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(siteSettingsService.update).toHaveBeenCalledWith(
        expect.objectContaining({ siteName: 'New Blog' }),
      ),
    );
    expect(await screen.findByText(/saved/i)).toBeInTheDocument();
  });

  it('shows an admin-only notice for non-admin roles', async () => {
    renderPage({ role: 'Author' });

    expect(await screen.findByText(/only admins/i)).toBeInTheDocument();
    expect(siteSettingsService.update).not.toHaveBeenCalled();
  });
});
