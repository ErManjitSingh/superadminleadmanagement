const platformDomain = process.env.PLATFORM_DOMAIN || 'indiaholidaydestination.com';

module.exports = {
  brandName: process.env.BRAND_NAME || process.env.SMTP_FROM_NAME || 'Travel CRM',
  platformDomain,
  salesEmail: process.env.SMTP_USER || `sales@${platformDomain}`,
  quotesEmail: process.env.QUOTES_EMAIL || `quotes@${platformDomain}`,
  websiteUrl: process.env.BRAND_WEBSITE || `https://${platformDomain}`,
  websiteHost: platformDomain,
};
