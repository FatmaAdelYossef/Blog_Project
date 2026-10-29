import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CategoriesPage from './CategoriesPage';
import { AuthProvider } from '../../context/AuthContext';
import { setToken } from '../../lib/tokenStorage';
import { categoryService } from '../../services/categoryService';

vi.mock('../../services/categoryService', () => ({
  categoryService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const base64url = (value) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeToken = (payload) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;

const categories = [
  { id: 1, name: 'News' },
  { id: 2, name: 'Essays' },
];

const renderPage = ({ authenticated = false } = {}) => {
  if (authenticated) {
    setToken(
      makeToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'writer@example.test',
      }),
    );
  }

  return render(
    <MemoryRouter>
      <AuthProvider>
        <CategoriesPage />
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();

  categoryService.getAll.mockResolvedValue(categories);
  categoryService.create.mockResolvedValue({});
  categoryService.update.mockResolvedValue({});
  categoryService.delete.mockResolvedValue({});
});

describe('CategoriesPage', () => {
  it('lists categories to guests without management actions', async () => {
    renderPage();

    expect(await screen.findByText('News')).toBeInTheDocument();
    expect(screen.getByText('Essays')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Category name/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit News' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete News' })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no categories', async () => {
    categoryService.getAll.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('No categories yet')).toBeInTheDocument();
  });

  it('creates a category with a trimmed name', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByText('News');

    await user.type(screen.getByLabelText(/^Category name/), '  Interviews  ');
    await user.click(screen.getByRole('button', { name: 'Add category' }));

    await waitFor(() =>
      expect(categoryService.create).toHaveBeenCalledWith({ name: 'Interviews' }),
    );
    expect(categoryService.create).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(categoryService.getAll).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByLabelText(/^Category name/)).toHaveValue(''));
  });

  it('edits an existing category', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByText('News');

    await user.click(screen.getByRole('button', { name: 'Edit News' }));

    const input = screen.getByLabelText(/^Category name/);
    expect(input).toHaveValue('News');

    await user.clear(input);
    await user.type(input, 'Updates');
    await user.click(screen.getByRole('button', { name: 'Update category' }));

    await waitFor(() =>
      expect(categoryService.update).toHaveBeenCalledWith(1, { name: 'Updates' }),
    );
    expect(categoryService.update).toHaveBeenCalledTimes(1);
    expect(categoryService.create).not.toHaveBeenCalled();
    await waitFor(() => expect(categoryService.getAll).toHaveBeenCalledTimes(2));
  });

  it('asks for confirmation before deleting a category', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByText('News');

    await user.click(screen.getByRole('button', { name: 'Delete News' }));
    const cancelDialog = await screen.findByRole('dialog');
    await user.click(within(cancelDialog).getByRole('button', { name: 'Cancel' }));

    expect(categoryService.delete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete News' }));
    const confirmDialog = await screen.findByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(categoryService.delete).toHaveBeenCalledWith(1));
    expect(categoryService.delete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(categoryService.getAll).toHaveBeenCalledTimes(2));
  });

  it('shows the backend message when deleting fails', async () => {
    const user = userEvent.setup();
    categoryService.delete.mockRejectedValue({
      response: { data: { message: 'Category still has posts.' } },
    });
    renderPage({ authenticated: true });
    await screen.findByText('News');

    await user.click(screen.getByRole('button', { name: 'Delete News' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Category still has posts.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an alert when categories fail to load', async () => {
    categoryService.getAll.mockRejectedValue(new Error('network'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load categories. Please try again.',
    );
  });
});
