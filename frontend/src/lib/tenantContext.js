const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN || 'indiaholidaydestination.com';
const RESERVED = new Set(['www', 'api', 'admin', 'app', 'testing', 'staging', 'mail']);

export function isPlatformHostname(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === PLATFORM_DOMAIN || host.endsWith(`.${PLATFORM_DOMAIN}`);
}

export function getTenantSubdomain() {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('tenant_subdomain') || null;
  }
  if (!isPlatformHostname(hostname)) {
    return null;
  }
  if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const sub = hostname.split('.')[0];
    if (sub && !RESERVED.has(sub)) return sub;
  }
  return localStorage.getItem('tenant_subdomain') || null;
}

export function setTenantSubdomain(subdomain) {
  if (subdomain) localStorage.setItem('tenant_subdomain', subdomain);
  else localStorage.removeItem('tenant_subdomain');
}
