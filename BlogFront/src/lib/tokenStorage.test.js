import { describe, expect, it, vi } from 'vitest';
import { TOKEN_KEY, clearToken, getToken, setToken } from './tokenStorage';

describe('tokenStorage', () => {
  it('round-trips a token through localStorage', () => {
    setToken('abc.def.ghi');

    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc.def.ghi');
    expect(getToken()).toBe('abc.def.ghi');
  });

  it('overwrites a previous token', () => {
    setToken('first');
    setToken('second');

    expect(getToken()).toBe('second');
  });

  it('clears only the token key', () => {
    localStorage.setItem('other', 'keep');
    setToken('abc');

    clearToken();

    expect(getToken()).toBeNull();
    expect(localStorage.getItem('other')).toBe('keep');
  });

  it('returns null when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(getToken()).toBeNull();
  });

  it('swallows write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => setToken('abc')).not.toThrow();
  });

  it('swallows removal failures', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => clearToken()).not.toThrow();
  });
});
