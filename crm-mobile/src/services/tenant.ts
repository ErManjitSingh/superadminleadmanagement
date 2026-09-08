import { apiClient, getApiBaseUrl } from '@/src/lib/apiClient';

export type TenantBranding = {
  companyId: string | null;
  name: string;
  appTitle: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
};

const FALLBACK: TenantBranding = {
  companyId: null,
  name: 'CRM',
  appTitle: 'CRM',
  logo: null,
  primaryColor: '#7C3AED',
  secondaryColor: '#4F46E5',
  tagline: 'Lead Management',
};

export function absolutizeAssetUrl(path: string | null | undefined, apiUrl = getApiBaseUrl()): string | null {
  if (!path || typeof path !== 'string') return null;
  const value = path.trim();
  if (!value) return null;
  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  const origin = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  if (value.startsWith('/')) return `${origin}${value}`;
  return `${origin}/${value}`;
}

export async function fetchTenantBranding(): Promise<TenantBranding> {
  try {
    const { data } = await apiClient.get('/tenant/resolve');
    if (!data?.resolved || !data?.company) {
      return { ...FALLBACK };
    }
    const company = data.company;
    const branding = company.branding || {};
    const appTitle = String(branding.appTitle || company.name || 'CRM').trim() || 'CRM';
    return {
      companyId: company.id ? String(company.id) : null,
      name: String(company.name || appTitle).trim() || 'CRM',
      appTitle,
      logo: absolutizeAssetUrl(branding.logo || company.logo),
      primaryColor: String(branding.primaryColor || '#7C3AED'),
      secondaryColor: String(branding.secondaryColor || '#4F46E5'),
      tagline: String(company.tagline || 'Lead Management').trim() || 'Lead Management',
    };
  } catch {
    return { ...FALLBACK };
  }
}

export { FALLBACK as DEFAULT_TENANT_BRANDING };
