import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PostsPage from './PostsPage';
import { AuthProvider } from '../../context/AuthContext';
import { setToken } from '../../lib/tokenStorage';
import { postService } from '../../services/postService';
import { categoryService } from '../../services/categoryService';

vi.mock('react-quill-new', () => ({
  default: ({ value = '', onChange }) => (
    <textarea
      aria-label="Content"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../../services/postService', () => ({
  postService: {
    getAllPosts: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
  },
}));

vi.mock('../../services/categoryService', () => ({
  categoryService: {
    getAll: vi.fn(),
  },
}));

const base64url = (value) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeToken = (payload) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;

const post = {
  id: 7,
  title: 'Warm reading',
  content: '<p>Hello <strong>world</strong></p>',
  createdAt: '2026-10-01T10:00:00.000Z',
};

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
    <MemoryRouter initialEntries={['/posts']}>
      <AuthProvider>
        <Routes>
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:id" element={<p>Post details</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();

  postService.getAllPosts.mockResolvedValue({ items: [post], totalPages: 1 });
  postService.createPost.mockResolvedValue({});
  postService.deletePost.mockResolvedValue({});
  categoryService.getAll.mockResolvedValue([{ id: 1, name: 'News' }]);
});

describe('PostsPage', () => {
  it('shows posts to guests without management actions', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Warm reading' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New post' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Delete / })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no posts', async () => {
    postService.getAllPosts.mockResolvedValue({ items: [], totalPages: 1 });
    renderPage();

    expect(await screen.findByText('No posts found')).toBeInTheDocument();
  });

  it('searches by title and resets to the first page', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { level: 3, name: 'Warm reading' });

    postService.getAllPosts.mockClear();

    await user.type(screen.getByLabelText(/^Search by title/), '  warm  ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() =>
      expect(postService.getAllPosts).toHaveBeenCalledWith(1, 10, '', 'warm'),
    );
    expect(postService.getAllPosts).toHaveBeenCalledTimes(1);
  });

  it('filters by category and resets to the first page', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { level: 3, name: 'Warm reading' });

    postService.getAllPosts.mockClear();

    await user.selectOptions(screen.getByLabelText(/^Filter by category/), '1');

    await waitFor(() => expect(postService.getAllPosts).toHaveBeenCalledWith(1, 10, 1, ''));
    expect(postService.getAllPosts).toHaveBeenCalledTimes(1);
  });

  it('requests the next page from the pagination controls', async () => {
    const user = userEvent.setup();
    postService.getAllPosts.mockResolvedValue({ items: [post], totalPages: 3 });
    renderPage();
    await screen.findByRole('heading', { level: 3, name: 'Warm reading' });

    postService.getAllPosts.mockClear();

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(postService.getAllPosts).toHaveBeenCalledWith(2, 10, '', ''));
  });

  it('creates a post from the dialog', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByRole('heading', { level: 3, name: 'Warm reading' });

    await user.click(screen.getByRole('button', { name: 'New post' }));

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText(/^Category/), '1');
    await user.type(within(dialog).getByLabelText(/^Title/), '  Fresh post  ');
    await user.type(within(dialog).getByLabelText('Content'), '  Body text  ');
    await user.click(within(dialog).getByRole('button', { name: 'Create post' }));

    await waitFor(() =>
      expect(postService.createPost).toHaveBeenCalledWith({
        title: 'Fresh post',
        content: 'Body text',
        categoryId: 1,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('asks for confirmation before deleting a post', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByRole('heading', { level: 3, name: 'Warm reading' });

    await user.click(screen.getByRole('button', { name: 'Delete Warm reading' }));
    const cancelDialog = await screen.findByRole('dialog');
    await user.click(within(cancelDialog).getByRole('button', { name: 'Cancel' }));

    expect(postService.deletePost).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete Warm reading' }));
    const confirmDialog = await screen.findByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(postService.deletePost).toHaveBeenCalledWith(7));
    expect(postService.deletePost).toHaveBeenCalledTimes(1);
  });

  it('shows an alert when posts fail to load', async () => {
    postService.getAllPosts.mockRejectedValue(new Error('network'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load posts. Please try again.',
    );
  });
});
