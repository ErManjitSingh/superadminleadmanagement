const Company = require('../superadmin/models/Company');
const { domainPointsToPlatform, normalizeDomain } = require('../controllers/publicDomainController');
const { onDomainVerified } = require('./sslProvisioningService');
const { markOnboardingStep } = require('./onboardingService');
const { logPlatformAudit } = require('../superadmin/services/platformAuditService');
const { notifyDomainAdmins } = require('./domainNotificationService');
const { PLATFORM_DOMAIN } = require('./tenantResolveService');
const ApiError = require('../utils/apiError');

const DOMAIN_STATUS = {
  NOT_CONNECTED: 'not_connected',
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed',
};

const DOMAIN_HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function getCustomDomain(company) {
  return company?.primaryDomain || company?.customDomain || null;
}

function getSystemDomain(company) {
  if (!company?.subdomain) return null;
  return `${company.subdomain}.${PLATFORM_DOMAIN}`;
}

function deriveDomainStatus(company) {
  const domain = getCustomDomain(company);
  if (!domain) return DOMAIN_STATUS.NOT_CONNECTED;
  if (company.domainVerified) return DOMAIN_STATUS.VERIFIED;
  if (company.domainStatus === DOMAIN_STATUS.FAILED) return DOMAIN_STATUS.FAILED;
  if (company.domainLastVerifiedAt && !company.domainVerified) return DOMAIN_STATUS.FAILED;
  return DOMAIN_STATUS.PENDING;
}

function formatDomainFields(company) {
  const c = company?.toObject ? company.toObject() : company;
  const customDomain = getCustomDomain(c);
  const domainStatus = c.domainStatus || deriveDomainStatus(c);
  return {
    customDomain,
    primaryDomain: customDomain,
    systemDomain: getSystemDomain(c),
    subdomainUrl: c.subdomain ? `https://${c.subdomain}.${PLATFORM_DOMAIN}` : null,
    domainType: c.domainType || (customDomain ? 'custom' : 'subdomain'),
    domainStatus,
    domainVerified: Boolean(c.domainVerified),
    domainLastVerifiedAt: c.domainLastVerifiedAt,
    dnsVerifiedAt: c.dnsVerifiedAt || (c.domainVerified ? c.domainLastVerifiedAt : null),
    domainConnectedAt: c.domainConnectedAt || (c.domainVerified ? c.dnsVerifiedAt || c.domainLastVerifiedAt : null),
    sslStatus: c.sslStatus || 'not_applicable',
    sslLastCheckedAt: c.sslLastCheckedAt,
  };
}

function validateCustomDomain(domain) {
  const normalized = normalizeDomain(domain);
  if (!normalized) throw new ApiError(400, 'Valid domain required');
  if (!DOMAIN_HOST_RE.test(normalized)) {
    throw new ApiError(400, 'Invalid domain format');
  }
  if (normalized === PLATFORM_DOMAIN || normalized.endsWith(`.${PLATFORM_DOMAIN}`)) {
    throw new ApiError(400, 'Platform subdomains cannot be used as custom domains');
  }
  if (normalized === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(normalized)) {
    throw new ApiError(400, 'Invalid domain');
  }
  return normalized;
}

async function assertDomainAvailable(domain, excludeCompanyId = null) {
  const filter = {
    deletedAt: null,
    $or: [
      { primaryDomain: domain },
      { 'additionalDomains.domain': domain },
    ],
  };
  if (excludeCompanyId) filter._id = { $ne: excludeCompanyId };
  const taken = await Company.findOne(filter).select('name').lean();
  if (taken) throw new ApiError(409, 'Domain already in use by another company');
}

function applyDomainStatus(company, { verified, failed = false } = {}) {
  const now = new Date();
  company.domainLastVerifiedAt = now;

  if (verified) {
    company.domainVerified = true;
    company.domainStatus = DOMAIN_STATUS.VERIFIED;
    company.dnsVerifiedAt = now;
    if (!company.domainConnectedAt) company.domainConnectedAt = now;
    company.domainType = 'custom';
    if (company.status === 'inactive') company.status = 'trial';
  } else {
    company.domainVerified = false;
    company.domainStatus = failed ? DOMAIN_STATUS.FAILED : DOMAIN_STATUS.PENDING;
  }
}

async function connectCustomDomain(company, rawDomain, { verify = false, actor = null, req = null } = {}) {
  const domain = validateCustomDomain(rawDomain);
  await assertDomainAvailable(domain, company._id);

  const previous = company.primaryDomain;
  company.primaryDomain = domain;
  company.domainType = 'custom';
  company.domainVerified = false;
  company.domainStatus = DOMAIN_STATUS.PENDING;
  company.sslStatus = 'pending';
  company.domainLastVerifiedAt = null;
  company.dnsVerifiedAt = null;

  if (verify) {
    return verifyCustomDomain(company, { actor, req });
  }

  await company.save();

  await logDomainAudit({
    actor,
    action: 'custom_domain_added',
    company,
    metadata: { domain, previous },
    req,
  });

  return { company, domainStatus: company.domainStatus, verified: false };
}

async function verifyCustomDomain(company, { actor = null, req = null } = {}) {
  const domain = getCustomDomain(company);
  if (!domain) throw new ApiError(400, 'No custom domain configured');

  const result = await domainPointsToPlatform(domain);
  const wasVerified = Boolean(company.domainVerified);
  applyDomainStatus(company, { verified: result.verified, failed: !result.verified });

  let ssl = { status: company.sslStatus };
  if (result.verified) {
    await markOnboardingStep(company._id, 'domainConnected', true);
    company.sslStatus = 'generating';
    await company.save();
    ssl = await onDomainVerified(company);
    if (!wasVerified) {
      await notifyDomainAdmins(company, 'dns_verified', { domain });
      if (ssl.status === 'active') {
        await notifyDomainAdmins(company, 'ssl_ready', { domain, sslStatus: ssl.status });
      }
    }
    await logDomainAudit({
      actor,
      action: 'dns_verified',
      company,
      metadata: { domain, method: result.method },
      req,
    });
  } else {
    await company.save();
    await notifyDomainAdmins(company, 'verification_failed', { domain, method: result.method });
    await logDomainAudit({
      actor,
      action: 'verification_failed',
      company,
      metadata: { domain, method: result.method },
      req,
    });
  }

  return {
    domain,
    verified: result.verified,
    domainStatus: company.domainStatus,
    method: result.method,
    sslStatus: company.sslStatus,
    dnsVerifiedAt: company.dnsVerifiedAt,
    domainConnectedAt: company.domainConnectedAt,
  };
}

async function refreshDomainStatus(company, { actor = null, req = null } = {}) {
  const domain = getCustomDomain(company);
  if (!domain) {
    return {
      domainStatus: DOMAIN_STATUS.NOT_CONNECTED,
      sslStatus: 'not_applicable',
      verified: false,
    };
  }

  if (!company.domainVerified) {
    return verifyCustomDomain(company, { actor, req });
  }

  const result = await domainPointsToPlatform(domain);
  if (!result.verified) {
    applyDomainStatus(company, { verified: false, failed: true });
    company.sslStatus = company.sslStatus === 'active' ? 'expired' : company.sslStatus;
    await company.save();
    await logDomainAudit({
      actor,
      action: 'dns_verification_lost',
      company,
      metadata: { domain },
      req,
    });
    return {
      domain,
      verified: false,
      domainStatus: company.domainStatus,
      sslStatus: company.sslStatus,
    };
  }

  company.sslLastCheckedAt = new Date();
  await company.save();

  return {
    domain,
    verified: true,
    domainStatus: company.domainStatus,
    sslStatus: company.sslStatus,
    dnsVerifiedAt: company.dnsVerifiedAt,
    domainConnectedAt: company.domainConnectedAt,
  };
}

async function disconnectCustomDomain(company, { actor = null, req = null } = {}) {
  const previous = company.primaryDomain;
  company.primaryDomain = null;
  company.domainType = 'subdomain';
  company.domainVerified = true;
  company.domainStatus = DOMAIN_STATUS.NOT_CONNECTED;
  company.sslStatus = 'not_applicable';
  company.domainLastVerifiedAt = null;
  company.dnsVerifiedAt = null;
  company.domainConnectedAt = null;
  company.sslLastCheckedAt = null;
  await company.save();

  await logDomainAudit({
    actor,
    action: 'domain_removed',
    company,
    metadata: { domain: previous },
    req,
  });

  return { company, previous };
}

async function logDomainAudit({ actor, action, company, metadata = {}, req }) {
  await logPlatformAudit({
    actor,
    action,
    resourceType: 'company_domain',
    resourceId: company._id,
    companyId: company._id,
    metadata: { companyName: company.name, ...metadata },
    req,
  });
}

module.exports = {
  DOMAIN_STATUS,
  getCustomDomain,
  getSystemDomain,
  deriveDomainStatus,
  formatDomainFields,
  validateCustomDomain,
  assertDomainAvailable,
  connectCustomDomain,
  verifyCustomDomain,
  refreshDomainStatus,
  disconnectCustomDomain,
};
