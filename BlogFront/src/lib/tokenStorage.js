export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// localStorage can throw (private browsing, blocked storage, quota), so every
// access is guarded and the app degrades to an unauthenticated state instead.

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable: the in-memory auth state still works for this tab.
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing else to clear.
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setRefreshToken = (token) => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // Storage unavailable: refresh simply won't be possible after reload.
  }
};

export const clearRefreshToken = () => {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing else to clear.
  }
};

export const clearTokens = () => {
  clearToken();
  clearRefreshToken();
};
