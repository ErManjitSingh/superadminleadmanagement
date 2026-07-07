const { platformDomain } = require('../config/branding');

const APP_CNAME_TARGET = process.env.APP_CNAME_TARGET || `proxy.${platformDomain}`;
const SERVER_IP = process.env.SERVER_IP || process.env.VPS_IP || '';

function extractDnsHost(domain) {
  if (!domain) return 'crm';
  const normalized = String(domain).toLowerCase().trim().replace(/\.$/, '');
  const parts = normalized.split('.');
  if (parts.length <= 2) return '@';
  return parts[0];
}

function buildDnsInstructions(domain) {
  const normalized = domain ? String(domain).toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') : null;
  if (!normalized) {
    return {
      domain: null,
      dnsHost: null,
      cnameTarget: APP_CNAME_TARGET,
      serverIp: SERVER_IP || null,
      requiresDnsSetup: false,
      records: [],
      instructions: [],
    };
  }

  const host = extractDnsHost(normalized);
  const records = [
    {
      type: 'CNAME',
      host,
      hostLabel: host === '@' ? '@ (root)' : host,
      pointsTo: APP_CNAME_TARGET,
      ttl: 'Auto',
      recommended: true,
    },
  ];

  if (SERVER_IP) {
    records.push({
      type: 'A',
      host,
      hostLabel: host === '@' ? '@ (root)' : host,
      pointsTo: SERVER_IP,
      ttl: 'Auto',
      recommended: false,
    });
  }

  return {
    domain: normalized,
    dnsHost: host,
    cnameTarget: APP_CNAME_TARGET,
    serverIp: SERVER_IP || null,
    requiresDnsSetup: true,
    records,
    instructions: [
      'Log in to your domain provider (GoDaddy, Cloudflare, Namecheap, Hostinger, etc.)',
      `Add a CNAME record — Host: "${host === '@' ? '@' : host}" → Points to: "${APP_CNAME_TARGET}"`,
      SERVER_IP ? `Alternative: A record — Host: "${host === '@' ? '@' : host}" → Points to: "${SERVER_IP}"` : null,
      'Save changes and wait 5–60 minutes for DNS propagation',
      'Return here and click "Verify Domain"',
    ].filter(Boolean),
  };
}

function needsDnsSetup(company) {
  if (!company) return false;
  const domain = company.primaryDomain || company.customDomain;
  if (!domain) return false;
  if (company.domainVerified) return false;
  return company.domainType === 'custom' || Boolean(domain);
}

function enrichWithDnsInstructions(companyOrDomainFields) {
  const domain = companyOrDomainFields?.primaryDomain
    || companyOrDomainFields?.customDomain
    || null;
  const dns = buildDnsInstructions(domain);
  return {
    ...companyOrDomainFields,
    ...dns,
    requiresDnsSetup: needsDnsSetup(companyOrDomainFields),
  };
}

module.exports = {
  APP_CNAME_TARGET,
  SERVER_IP,
  extractDnsHost,
  buildDnsInstructions,
  needsDnsSetup,
  enrichWithDnsInstructions,
};
