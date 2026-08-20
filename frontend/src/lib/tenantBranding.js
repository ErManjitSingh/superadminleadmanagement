const TENANT_COMPANY_KEY = 'tenant_company';

export function cacheTenantCompany(company) {
  if (typeof window === 'undefined') return;
  try {
    if (!company) {
      localStorage.removeItem(TENANT_COMPANY_KEY);
      return;
    }
    localStorage.setItem(TENANT_COMPANY_KEY, JSON.stringify(company));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getCachedTenantCompany() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TENANT_COMPANY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCachedTenantCompany() {
  cacheTenantCompany(null);
}

/** Tenant company name for emails, WhatsApp, sidebar fallbacks — never platform defaults on custom domains. */
export function resolveBrandName(fallback = 'CRM') {
  const company = getCachedTenantCompany();
  return company?.branding?.appTitle || company?.name || fallback;
}

export function resolveBrandEmail(fallback = '') {
  const company = getCachedTenantCompany();
  return company?.email || fallback;
}

export function resolveBrandWebsite(fallback = '') {
  const company = getCachedTenantCompany();
  const site = String(company?.website || '').trim();
  if (!site) return fallback;
  return site.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function resolveBrandTagline(fallback = 'Lead Management') {
  const company = getCachedTenantCompany();
  return company?.tagline || fallback;
}
