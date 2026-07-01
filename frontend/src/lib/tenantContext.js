const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN || 'indiaholidaydestination.com';

export function getTenantSubdomain() {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('tenant_subdomain') || null;
  }
  if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const sub = hostname.split('.')[0];
    if (sub && !['www', 'api', 'admin', 'app', 'testing'].includes(sub)) return sub;
  }
  return localStorage.getItem('tenant_subdomain') || null;
}

export function setTenantSubdomain(subdomain) {
  if (subdomain) localStorage.setItem('tenant_subdomain', subdomain);
  else localStorage.removeItem('tenant_subdomain');
}
