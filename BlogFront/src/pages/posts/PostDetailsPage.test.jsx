import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PostDetailsPage from './PostDetailsPage';
import { AuthProvider } from '../../context/AuthContext';
import { setToken } from '../../lib/tokenStorage';
import { postService } from '../../services/postService';
import { categoryService } from '../../services/categoryService';
import { uploadService } from '../../services/uploadService';

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
    getPostById: vi.fn(),
    updatePost: vi.fn(),
    addMediaToPost: vi.fn(),
    updateMediaToPost: vi.fn(),
    deleteMedia: vi.fn(),
  },
}));

vi.mock('../../services/categoryService', () => ({
  categoryService: {
    getAll: vi.fn(),
  },
}));

vi.mock('../../services/uploadService', () => ({
  uploadService: {
    uploadImage: vi.fn(),
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
  categoryId: 1,
  categoryName: 'News',
  medias: [
    { id: 11, url: 'https://example.test/one.png', mediaType: 'Image' },
    { id: 12, url: 'https://example.test/song.mp3', mediaType: 'Music' },
  ],
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
    <MemoryRouter initialEntries={['/posts/7']}>
      <AuthProvider>
        <Routes>
          <Route path="/posts/:id" element={<PostDetailsPage />} />
          <Route path="/posts" element={<p>Posts list</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();

  postService.getPostById.mockResolvedValue({ data: post });
  postService.updatePost.mockResolvedValue({});
  postService.addMediaToPost.mockResolvedValue({});
  postService.updateMediaToPost.mockResolvedValue({});
  postService.deleteMedia.mockResolvedValue({});
  categoryService.getAll.mockResolvedValue({
    data: [
      { id: 1, name: 'News' },
      { id: 2, name: 'Essays' },
    ],
  });
  uploadService.uploadImage.mockResolvedValue('stored.png');
});

describe('PostDetailsPage', () => {
  it('shows the post to guests without editing controls', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Warm reading' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit post' })).not.toBeInTheDocument();
  });

  it('shows media attached to the post', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Warm reading' });

    await user.click(screen.getByRole('tab', { name: 'Images' }));
    expect(
      screen.getByRole('img', { name: 'Warm reading image 1' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Music' }));
    expect(screen.getByRole('link', { name: /song\.mp3/ })).toBeInTheDocument();
  });

  it('saves edits from the details form', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByRole('heading', { level: 1, name: 'Warm reading' });

    await user.click(screen.getByRole('button', { name: 'Edit post' }));

    const titleInput = screen.getByLabelText(/^Title/);
    await user.clear(titleInput);
    await user.type(titleInput, '  Updated title  ');

    const contentInput = screen.getByLabelText('Content');
    await user.clear(contentInput);
    await user.type(contentInput, '  Updated body  ');

    await user.selectOptions(screen.getByLabelText(/^Category/), '2');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(postService.updatePost).toHaveBeenCalledWith('7', {
        title: 'Updated title',
        content: 'Updated body',
        categoryId: 2,
      }),
    );
    expect(postService.updatePost).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(postService.getPostById).toHaveBeenCalledTimes(2));
  });

  it('rejects an empty title or content before saving', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByRole('heading', { level: 1, name: 'Warm reading' });

    await user.click(screen.getByRole('button', { name: 'Edit post' }));
    await user.clear(screen.getByLabelText(/^Title/));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Title and content are required.',
    );
    expect(postService.updatePost).not.toHaveBeenCalled();
  });

  it('adds a link from its tab', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByRole('heading', { level: 1, name: 'Warm reading' });

    await user.click(screen.getByRole('button', { name: 'Edit post' }));
    await user.click(screen.getByRole('tab', { name: 'Links' }));

    await user.type(
      screen.getByLabelText(/^Links URL/),
      '  https://example.test/watch  ',
    );
    await user.click(screen.getByRole('button', { name: 'Add link' }));

    await waitFor(() =>
      expect(postService.addMediaToPost).toHaveBeenCalledWith('7', {
        url: 'https://example.test/watch',
        mediaType: 'Link',
      }),
    );
  });

  it('uploads images before attaching them', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByRole('heading', { level: 1, name: 'Warm reading' });

    await user.click(screen.getByRole('button', { name: 'Edit post' }));
    await user.click(screen.getByRole('tab', { name: 'Images' }));

    const file = new File(['image'], 'cover.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Choose images'), file);
    await user.click(screen.getByRole('button', { name: 'Upload and add' }));

    await waitFor(() => expect(uploadService.uploadImage).toHaveBeenCalledWith(file));
    expect(postService.addMediaToPost).toHaveBeenCalledWith('7', {
      url: 'stored.png',
      mediaType: 'Image',
    });
  });

  it('asks for confirmation before deleting media', async () => {
    const user = userEvent.setup();
    renderPage({ authenticated: true });
    await screen.findByRole('heading', { level: 1, name: 'Warm reading' });

    await user.click(screen.getByRole('button', { name: 'Edit post' }));
    await user.click(screen.getByRole('tab', { name: 'Images' }));

    await user.click(screen.getByRole('button', { name: 'Delete image 1' }));
    const cancelDialog = await screen.findByRole('dialog');
    await user.click(within(cancelDialog).getByRole('button', { name: 'Cancel' }));

    expect(postService.deleteMedia).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete image 1' }));
    const confirmDialog = await screen.findByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(postService.deleteMedia).toHaveBeenCalledWith(11));
    expect(postService.deleteMedia).toHaveBeenCalledTimes(1);
  });

  it('shows an alert when the post cannot be loaded', async () => {
    postService.getPostById.mockRejectedValue(new Error('network'));
    renderPage();

    expect(await screen.findByText('Could not load this post')).toBeInTheDocument();
  });
});
