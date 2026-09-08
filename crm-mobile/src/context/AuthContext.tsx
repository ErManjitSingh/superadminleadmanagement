import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  initApiClient,
  setApiBaseUrl,
  setUnauthorizedHandler,
} from '@/src/lib/apiClient';
import { authStorage } from '@/src/lib/storage';
import { fetchCurrentUser, loginRequest, logoutRequest } from '@/src/services/auth';
import { isMobileRoleSupported } from '@/src/constants/roles';
import type { AuthSession, User, UserRole } from '@/src/types';
import { getErrorMessage } from '@/src/lib/apiClient';
import { useBranding } from '@/src/context/BrandingContext';
import { clearCrmQueryCache } from '@/src/lib/queryClient';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  apiUrl: string;
  tenantSubdomain: string;
  login: (email: string, password: string, tenant?: string) => Promise<void>;
  logout: () => Promise<void>;
  setApiUrl: (url: string) => Promise<void>;
  setTenantSubdomain: (subdomain: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshBranding, clearBranding } = useBranding();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiUrl, setApiUrlState] = useState(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api');
  const [tenantSubdomain, setTenantSubdomainState] = useState('');

  const clearSession = useCallback(async () => {
    await authStorage.clearSession();
    setUser(null);
    setToken(null);
    clearCrmQueryCache();
  }, []);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      await initApiClient();
      const [storedUrl, storedTenant, storedToken, storedUser] = await Promise.all([
        authStorage.getApiUrl(),
        authStorage.getTenantSubdomain(),
        authStorage.getToken(),
        authStorage.getUser(),
      ]);

      if (storedUrl) {
        setApiUrlState(storedUrl);
        setApiBaseUrl(storedUrl);
      }
      if (storedTenant) setTenantSubdomainState(storedTenant);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        try {
          const fresh = await fetchCurrentUser();
          setUser(fresh);
        } catch {
          await clearSession();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession().then(() => router.replace('/login'));
    });
    bootstrap();
  }, [bootstrap, clearSession]);

  const login = useCallback(
    async (email: string, password: string, tenant?: string) => {
      clearCrmQueryCache();
      const session: AuthSession = await loginRequest(email, password, tenant || tenantSubdomain);
      if (!isMobileRoleSupported(session.role as UserRole)) {
        throw new Error('This role is not supported on mobile yet. Use Sales Executive, Manager, Team Leader, or Admin.');
      }
      await authStorage.saveSession(session, tenant ?? tenantSubdomain);
      setToken(session.token);
      setUser(session);
      await refreshBranding();
      router.replace('/(tabs)');
    },
    [tenantSubdomain, refreshBranding]
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    await clearSession();
    router.replace('/login');
  }, [clearSession]);

  const setApiUrl = useCallback(async (url: string) => {
    const trimmed = url.trim();
    await authStorage.setApiUrl(trimmed);
    setApiBaseUrl(trimmed);
    setApiUrlState(trimmed);
    clearCrmQueryCache();
    await clearBranding();
    await refreshBranding();
  }, [clearBranding, refreshBranding]);

  const setTenantSubdomain = useCallback(async (subdomain: string) => {
    const trimmed = subdomain.trim().toLowerCase();
    setTenantSubdomainState(trimmed);
    await authStorage.saveSession(
      { ...(user as AuthSession), token: token || '' },
      trimmed
    );
    clearCrmQueryCache();
    await refreshBranding();
  }, [token, user, refreshBranding]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      apiUrl,
      tenantSubdomain,
      login,
      logout,
      setApiUrl,
      setTenantSubdomain,
    }),
    [user, token, isLoading, apiUrl, tenantSubdomain, login, logout, setApiUrl, setTenantSubdomain]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { getErrorMessage };
