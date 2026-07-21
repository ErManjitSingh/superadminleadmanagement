import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { canAccess } from '../lib/permissions';
import { authService, AuthError } from '../auth';
import { authStorage } from '../auth/authStorage';
import { goToLogin } from '../auth/paths';
import store from '../store';
import { setCredentials, clearCredentials } from '../store/slices/authSlice';
import { useRestrictedSessionTimeout } from '../hooks/useRestrictedSessionTimeout';
import { useJwtExpiryLogout } from '../hooks/useJwtExpiryLogout';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async ({ redirect = false, skipRequest = false } = {}) => {
    try {
      if (skipRequest) authStorage.clearSession();
      else await authService.logout();
    } finally {
      setUser(null);
      store.dispatch(clearCredentials());
      if (redirect) goToLogin();
    }
  }, []);

  useRestrictedSessionTimeout(user, logout);
  useJwtExpiryLogout(user, logout);

  useEffect(() => {
    const bootstrap = async () => {
      if (authStorage.isTokenExpired() || authStorage.isRestrictedSessionExpired()) {
        authStorage.clearSession();
        setUser(null);
        setLoading(false);
        return;
      }

      const stored = authService.getCurrentUser();
      if (stored && authStorage.getToken()) {
        try {
          const fresh = await authService.fetchCurrentUser();
          setUser(fresh);
        } catch {
          authStorage.clearSession();
          setUser(null);
        }
      } else {
        setUser(stored);
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const sessionUser = await authService.login(email, password);
    setUser(sessionUser);
    store.dispatch(setCredentials({ user: sessionUser, token: authStorage.getToken() }));
    return sessionUser;
  }, []);

  const getCurrentUser = useCallback(() => {
    const current = authService.getCurrentUser();
    if (current && !user) setUser(current);
    return current ?? user;
  }, [user]);

  const hasPermission = useCallback(
    (module, action = 'view') => canAccess(user, module, action),
    [user]
  );

  const getDashboardPath = useCallback(
    (role = user?.role) => authService.getDashboardPath(role),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        getCurrentUser,
        hasPermission,
        getDashboardPath,
        AuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
