import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthShell } from './AuthShell';
import { ThemeProvider } from '../../context/ThemeContext';

const renderShell = (props = {}) =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthShell title="Welcome back" description="Sign in to continue." {...props}>
          <p>form body</p>
        </AuthShell>
      </ThemeProvider>
    </MemoryRouter>,
  );

describe('AuthShell', () => {
  it('renders the page heading, description, and children', () => {
    renderShell();

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to continue.')).toBeInTheDocument();
    expect(screen.getByText('form body')).toBeInTheDocument();
  });

  it('sets the document title from the page title', () => {
    renderShell();

    expect(document.title).toBe('Welcome back · My Blog');
  });

  it('renders the footer only when provided', () => {
    const { unmount } = renderShell();
    expect(screen.queryByText('footer note')).not.toBeInTheDocument();
    unmount();

    renderShell({ footer: <p>footer note</p> });
    expect(screen.getByText('footer note')).toBeInTheDocument();
  });

  it('offers a way back to the blog', () => {
    renderShell();

    expect(screen.getByRole('link', { name: /back to blog/i })).toHaveAttribute('href', '/');
  });
});
