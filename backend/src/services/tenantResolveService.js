const Company = require('../superadmin/models/Company');

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || 'indiaholidaydestination.com';
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'app', 'testing', 'staging', 'mail']);

function normalizeHost(host) {
  if (!host) return null;
  return String(host).split(':')[0].toLowerCase().trim();
}

function extractSubdomain(host) {
  const hostname = normalizeHost(host);
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return null;

  const parts = hostname.split('.');
  if (parts.length < 2) return null;

  if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const sub = parts[0];
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  if (parts.length >= 3) {
    const sub = parts[0];
    if (!RESERVED_SUBDOMAINS.has(sub)) return sub;
  }

  return null;
}

async function resolveCompanyFromRequest(req) {
  const headerSubdomain = req.headers['x-tenant-subdomain'];
  const headerCompanyId = req.headers['x-company-id'];
  const hostname = normalizeHost(req.headers['x-forwarded-host'] || req.headers.host);

  if (headerCompanyId) {
    const company = await Company.findOne({ _id: headerCompanyId, deletedAt: null }).lean();
    if (company) return company;
  }

  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const byCustomDomain = await Company.findOne({
      primaryDomain: hostname,
      deletedAt: null,
    }).lean();
    if (byCustomDomain) return byCustomDomain;
  }

  const subdomain = (headerSubdomain && String(headerSubdomain).toLowerCase().trim())
    || extractSubdomain(hostname);
  if (!subdomain) return null;

  return Company.findOne({ subdomain, deletedAt: null }).lean();
}

function assertCompanyAccessible(company) {
  if (!company) return { ok: false, code: 404, message: 'Company not found' };
  if (company.deletedAt) return { ok: false, code: 403, message: 'Company is not available' };
  if (company.status === 'suspended') return { ok: false, code: 403, message: 'Company account is suspended' };
  if (company.status === 'expired') return { ok: false, code: 403, message: 'Company subscription has expired' };
  if (company.status === 'inactive') return { ok: false, code: 403, message: 'Company account is inactive' };
  return { ok: true };
}

module.exports = {
  PLATFORM_DOMAIN,
  RESERVED_SUBDOMAINS,
  extractSubdomain,
  resolveCompanyFromRequest,
  assertCompanyAccessible,
};
