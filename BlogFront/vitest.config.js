import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest 3 bundles its own Vite, so the test runner gets a separate config
// rather than sharing vite.config.js with the Vite 8 production build.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    restoreMocks: true,
  },
});
