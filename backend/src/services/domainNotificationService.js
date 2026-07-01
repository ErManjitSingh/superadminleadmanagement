const PlatformNotification = require('../superadmin/models/PlatformNotification');
const User = require('../models/User');
const { notifyUsers } = require('./notificationService');

const DOMAIN_NOTIFICATION_COPY = {
  dns_verified: {
    type: 'domain_dns_verified',
    title: 'Custom domain verified',
    getMessage: (domain) => `DNS for ${domain} is verified. SSL provisioning has started.`,
    severity: 'success',
  },
  ssl_ready: {
    type: 'domain_ssl_ready',
    title: 'SSL certificate active',
    getMessage: (domain) => `Your custom domain ${domain} is secured with SSL.`,
    severity: 'success',
  },
  verification_failed: {
    type: 'domain_verification_failed',
    title: 'Domain verification failed',
    getMessage: (domain) => `We could not verify DNS for ${domain}. Check your CNAME record and try again.`,
    severity: 'warning',
  },
};

async function notifyDomainAdmins(company, eventKey, { domain, sslStatus } = {}) {
  const copy = DOMAIN_NOTIFICATION_COPY[eventKey];
  if (!copy || !company?._id) return;

  const message = copy.getMessage(domain || company.primaryDomain);

  try {
    await PlatformNotification.create({
      type: copy.type,
      title: copy.title,
      message,
      companyId: company._id,
      severity: copy.severity,
      metadata: { domain: domain || company.primaryDomain, sslStatus, eventKey },
    });
  } catch (err) {
    console.error('[DomainNotification] Platform notification failed:', err.message);
  }

  try {
    const adminIds = await User.find({
      companyId: company._id,
      role: 'admin',
      status: 'active',
    })
      .select('_id')
      .lean()
      .then((rows) => rows.map((u) => u._id));
    if (adminIds.length) {
      await notifyUsers(adminIds, {
        companyId: company._id,
        type: copy.type,
        title: copy.title,
        message,
        meta: { domain: domain || company.primaryDomain, sslStatus },
      });
    }
  } catch (err) {
    console.error('[DomainNotification] Tenant notification failed:', err.message);
  }
}

module.exports = { notifyDomainAdmins };
