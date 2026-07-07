import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import API from '../api/axios';
import { getTenantSubdomain, setTenantSubdomain } from '../lib/tenantContext';
import { APP_PLATFORM_DOMAIN } from '../config/branding';
import TenantNotFoundPage from '../pages/TenantNotFoundPage';

const TenantContext = createContext(null);

function isTenantHost() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return Boolean(localStorage.getItem('tenant_subdomain'));
  }
  if (hostname === APP_PLATFORM_DOMAIN || hostname === `www.${APP_PLATFORM_DOMAIN}`) {
    return false;
  }
  if (hostname.endsWith(`.${APP_PLATFORM_DOMAIN}`)) {
    const sub = hostname.split('.')[0];
    return sub && !['www', 'api', 'admin', 'app', 'testing'].includes(sub);
  }
  return true;
}

function applyBranding(branding) {
  if (!branding || typeof document === 'undefined') return;
  const root = document.documentElement;
  if (branding.primaryColor) root.style.setProperty('--tenant-primary', branding.primaryColor);
  if (branding.secondaryColor) root.style.setProperty('--tenant-secondary', branding.secondaryColor);
  if (branding.sidebarColor) root.style.setProperty('--tenant-sidebar', branding.sidebarColor);
  if (branding.favicon) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.favicon;
  }
  if (branding.appTitle) {
    document.title = branding.appTitle;
  }
}

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tenantHost = useMemo(() => isTenantHost(), []);

  const bootstrap = useCallback(async () => {
    if (!tenantHost) {
      setLoading(false);
      return;
    }
    try {
      const res = await API.get('/tenant/resolve', { skipSuccessToast: true, skipErrorToast: true });
      const data = res.data || {};
      if (data.resolved) {
        setTenant(data);
        if (data.company?.subdomain) setTenantSubdomain(data.company.subdomain);
        applyBranding(data.company?.branding);
        setError(null);
      } else {
        setTenant(null);
        setError(data.reason || 'not_found');
      }
    } catch {
      setError('network');
    } finally {
      setLoading(false);
    }
  }, [tenantHost]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const value = useMemo(
    () => ({
      tenant,
      company: tenant?.company || null,
      onboarding: tenant?.onboarding || null,
      loading,
      error,
      tenantHost,
      requiresTenant: tenantHost,
      refresh: bootstrap,
    }),
    [tenant, loading, error, tenantHost, bootstrap],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}

export function useTenantBranding() {
  const { company } = useTenant();
  return {
    appTitle: company?.branding?.appTitle || company?.name || null,
    logo: company?.branding?.logo || company?.logo || null,
    primaryColor: company?.branding?.primaryColor,
    secondaryColor: company?.branding?.secondaryColor,
    sidebarColor: company?.branding?.sidebarColor,
  };
}

export function useTenantFeatures() {
  const { company } = useTenant();
  return company?.features || null;
}

export function TenantGate({ children }) {
  const { loading, requiresTenant, error } = useTenant();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }
  if (requiresTenant && error) {
    return <TenantNotFoundPage reason={error} />;
  }
  return children;
}
