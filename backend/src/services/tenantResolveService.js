const Company = require('../superadmin/models/Company');

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || 'indiaholidaydestination.com';
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'app', 'testing', 'staging', 'mail']);

function normalizeHost(host) {
  if (!host) return null;
  return String(host).split(':')[0].toLowerCase().trim();
}

function isPlatformHostname(hostname) {
  if (!hostname) return false;
  return hostname === PLATFORM_DOMAIN || hostname.endsWith(`.${PLATFORM_DOMAIN}`);
}

function extractSubdomain(host) {
  const hostname = normalizeHost(host);
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return null;

  if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const sub = hostname.split('.')[0];
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  return null;
}

function slugifySubdomain(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Platform workspace URL → label. `crm.indiaholidaydestination.com` → `crm`.
 * Apex and nested hosts (a.b.platform.com) return null.
 */
function parsePlatformWorkspaceHost(domain) {
  const hostname = String(domain || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '')
    .split(':')[0];
  if (!hostname || hostname === PLATFORM_DOMAIN) return null;
  const suffix = `.${PLATFORM_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;
  const rawLabel = hostname.slice(0, -suffix.length);
  if (!rawLabel || rawLabel.includes('.')) return null;
  return slugifySubdomain(rawLabel);
}

async function findCompanyByCustomHost(hostname) {
  if (!hostname) return null;

  const byPrimary = await Company.findOne({
    primaryDomain: hostname,
    domainVerified: true,
    deletedAt: null,
  }).lean();
  if (byPrimary) return byPrimary;

  return Company.findOne({
    deletedAt: null,
    additionalDomains: {
      $elemMatch: { domain: hostname, verified: true },
    },
  }).lean();
}

/**
 * Resolve tenant from request.
 * Priority:
 *  1) Custom hostname → verified custom domain ONLY (never subdomain header fallback)
 *  2) Platform subdomain from Host, or x-tenant-subdomain on localhost/platform hosts
 *
 * Client-supplied x-company-id is intentionally ignored to prevent cross-tenant spoofing.
 */
async function resolveCompanyFromRequest(req) {
  const headerSubdomain = req.headers['x-tenant-subdomain'];
  const hostname = normalizeHost(req.headers['x-forwarded-host'] || req.headers.host);

  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Custom domain host: fail closed — only verified domain mapping, no subdomain fallback.
    if (!isPlatformHostname(hostname)) {
      return findCompanyByCustomHost(hostname);
    }

    const byCustomDomain = await findCompanyByCustomHost(hostname);
    if (byCustomDomain) return byCustomDomain;
  }

  const subdomain = (headerSubdomain && String(headerSubdomain).toLowerCase().trim())
    || extractSubdomain(hostname);
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) return null;

  return Company.findOne({ subdomain, deletedAt: null }).lean();
}

function assertCompanyAccessible(company) {
  if (!company) return { ok: false, code: 404, message: 'Company not found' };
  if (company.deletedAt) return { ok: false, code: 403, message: 'Company is not available' };
  if (company.maintenanceMode) return { ok: false, code: 503, message: 'Workspace is under maintenance' };
  if (company.status === 'suspended') return { ok: false, code: 403, message: 'Company account is suspended' };
  if (company.status === 'expired') return { ok: false, code: 403, message: 'Company subscription has expired' };
  if (company.status === 'inactive') return { ok: false, code: 403, message: 'Company account is inactive' };
  return { ok: true };
}

module.exports = {
  PLATFORM_DOMAIN,
  RESERVED_SUBDOMAINS,
  extractSubdomain,
  isPlatformHostname,
  parsePlatformWorkspaceHost,
  slugifySubdomain,
  findCompanyByCustomHost,
  resolveCompanyFromRequest,
  assertCompanyAccessible,
};
