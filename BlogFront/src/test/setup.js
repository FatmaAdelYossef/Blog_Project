import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Node 23+ ships an experimental global `localStorage`/`sessionStorage` accessor that
// returns undefined when --localstorage-file is not provided. Because the name exists
// on the Node global, vitest's jsdom environment drops jsdom's real storage from its
// global population, and every `localStorage` reference resolves to undefined.
// This machine runs Node 26; bind the tests back to the real jsdom storage.
// (CI and production browsers keep a native localStorage — this shim is test-only.)
for (const storageName of ['localStorage', 'sessionStorage']) {
  if (typeof globalThis[storageName] === 'undefined') {
    const real = window.jsdom?.window?.[storageName];
    if (real) {
      Object.defineProperty(globalThis, storageName, {
        value: real,
        configurable: true,
        writable: true,
      });
    }
  }
}

// Vitest runs with `globals: false`, so Testing Library's automatic cleanup
// hook is not registered and has to be wired up explicitly.
afterEach(() => {
  cleanup();
  if (typeof localStorage !== 'undefined') localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = '';
});
