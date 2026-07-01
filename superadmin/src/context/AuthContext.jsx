import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { superAdminApi } from '../api/superadmin';
import { superAdminStorage } from '../auth/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(superAdminStorage.getUser());
  const [loading, setLoading] = useState(!!superAdminStorage.getToken());

  useEffect(() => {
    if (!superAdminStorage.getToken()) {
      setLoading(false);
      return;
    }
    superAdminApi
      .getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => superAdminStorage.clearSession())
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user && superAdminStorage.isAuthenticated(),
      async login(email, password) {
        const res = await superAdminApi.login(email, password);
        superAdminStorage.saveSession(res.data.user, res.data.token);
        setUser(res.data.user);
        return res.data.user;
      },
      async logout() {
        try {
          await superAdminApi.logout();
        } catch {
          /* ignore */
        }
        superAdminStorage.clearSession();
        setUser(null);
      },
      async refreshUser() {
        const res = await superAdminApi.getMe();
        setUser(res.data.user);
        superAdminStorage.saveSession(res.data.user, superAdminStorage.getToken());
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
