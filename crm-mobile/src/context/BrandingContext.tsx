import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl, initApiClient } from '@/src/lib/apiClient';
import {
  DEFAULT_TENANT_BRANDING,
  fetchTenantBranding,
  type TenantBranding,
} from '@/src/services/tenant';

const CACHE_KEY = 'crm_tenant_branding_v1';

type BrandingContextValue = {
  branding: TenantBranding;
  isReady: boolean;
  refreshBranding: () => Promise<TenantBranding>;
  clearBranding: () => Promise<void>;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

async function readCache(apiUrl: string): Promise<TenantBranding | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { apiUrl?: string; branding?: TenantBranding };
    if (parsed.apiUrl !== apiUrl || !parsed.branding) return null;
    return parsed.branding;
  } catch {
    return null;
  }
}

async function writeCache(apiUrl: string, branding: TenantBranding) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ apiUrl, branding }));
  } catch {
    /* ignore */
  }
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_TENANT_BRANDING);
  const [isReady, setIsReady] = useState(false);

  const refreshBranding = useCallback(async () => {
    await initApiClient();
    const apiUrl = getApiBaseUrl();
    const next = await fetchTenantBranding();
    setBranding(next);
    await writeCache(apiUrl, next);
    setIsReady(true);
    return next;
  }, []);

  const clearBranding = useCallback(async () => {
    setBranding(DEFAULT_TENANT_BRANDING);
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initApiClient();
      const apiUrl = getApiBaseUrl();
      const cached = await readCache(apiUrl);
      if (!cancelled && cached) {
        setBranding(cached);
        setIsReady(true);
      }
      const next = await fetchTenantBranding();
      if (cancelled) return;
      setBranding(next);
      await writeCache(apiUrl, next);
      setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ branding, isReady, refreshBranding, clearBranding }),
    [branding, isReady, refreshBranding, clearBranding]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}
