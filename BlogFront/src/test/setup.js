import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest runs with `globals: false`, so Testing Library's automatic cleanup
// hook is not registered and has to be wired up explicitly.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
