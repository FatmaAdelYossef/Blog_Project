import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { jwtService } from '../services/jwtService';
import { getToken } from '../lib/tokenStorage';

const AuthContext = createContext(null);

const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const NAME_IDENTIFIER_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const toUser = (token) => {
  const decoded = jwtService.decodeToken(token);
  if (!decoded) return null;

  return {
    email: decoded.email ?? decoded[EMAIL_CLAIM] ?? null,
    id: decoded.nameidentifier ?? decoded.sub ?? decoded[NAME_IDENTIFIER_CLAIM] ?? null,
    role: decoded.role ?? decoded[ROLE_CLAIM] ?? null,
  };
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getToken());

  const isAuthenticated = Boolean(token) && !jwtService.isTokenExpired(token);
  const user = useMemo(() => (isAuthenticated ? toUser(token) : null), [isAuthenticated, token]);

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    setToken(getToken());
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
  }, []);

  useEffect(() => {
    const handleForcedLogout = () => setToken(null);
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const value = useMemo(
    () => ({ token, isAuthenticated, user, login, logout }),
    [token, isAuthenticated, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// The hook is intentionally co-located with its provider; this only affects
// fast refresh for this module.
// oxlint-disable-next-line react/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
