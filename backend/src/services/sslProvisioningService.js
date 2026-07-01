const { execFile } = require('child_process');
const { promisify } = require('util');
const Company = require('../superadmin/models/Company');

const execFileAsync = promisify(execFile);

const SSL_AUTO_PROVISION = process.env.SSL_AUTO_PROVISION === 'true';

async function provisionSslForDomain(company, domain) {
  if (!domain) return { status: 'not_applicable' };

  company.sslStatus = 'generating';
  company.sslLastCheckedAt = new Date();
  await company.save();

  if (!SSL_AUTO_PROVISION) {
    company.sslStatus = 'pending';
    await company.save();
    console.log(`[SSL] Auto-provision disabled — mark pending for ${domain}`);
    return { status: 'pending', auto: false };
  }

  try {
    await execFileAsync('certbot', [
      'certonly',
      '--nginx',
      '-d',
      domain,
      '--non-interactive',
      '--agree-tos',
      '-m',
      process.env.SSL_ADMIN_EMAIL || 'admin@localhost',
    ], { timeout: 120000 });

    company.sslStatus = 'active';
    company.sslLastCheckedAt = new Date();
    await company.save();
    return { status: 'active', auto: true };
  } catch (err) {
    console.error(`[SSL] Provision failed for ${domain}:`, err.message);
    company.sslStatus = 'failed';
    company.sslLastCheckedAt = new Date();
    await company.save();
    return { status: 'failed', error: err.message };
  }
}

async function onDomainVerified(company) {
  if (!company.primaryDomain || company.domainType !== 'custom') {
    company.sslStatus = 'not_applicable';
    await company.save();
    return { status: 'not_applicable' };
  }
  return provisionSslForDomain(company, company.primaryDomain);
}

module.exports = { provisionSslForDomain, onDomainVerified, SSL_AUTO_PROVISION };
