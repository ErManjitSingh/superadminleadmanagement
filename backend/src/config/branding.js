const platformDomain = process.env.PLATFORM_DOMAIN || 'indiaholidaydestination.com';
/** Public customer-facing site shown on vouchers / receipts / PDFs */
const publicWebsiteHost = (process.env.BRAND_WEBSITE_HOST || 'exploremybharat.com')
  .replace(/^https?:\/\//i, '')
  .replace(/\/$/, '');
const publicWebsiteUrl = process.env.BRAND_WEBSITE || `https://${publicWebsiteHost}`;

module.exports = {
  brandName: process.env.BRAND_NAME || process.env.SMTP_FROM_NAME || 'Travel Company',
  platformDomain,
  salesEmail: process.env.SMTP_USER || `sales@${platformDomain}`,
  quotesEmail: process.env.QUOTES_EMAIL || `quotes@${platformDomain}`,
  /** Functional / platform URLs (vendor confirm, app links) */
  websiteUrl: process.env.PLATFORM_WEBSITE_URL || `https://${platformDomain}`,
  websiteHost: platformDomain,
  /** Customer-facing brand site printed on vouchers & receipts */
  publicWebsiteUrl,
  publicWebsiteHost,
  supportPhone: process.env.BRAND_SUPPORT_PHONE || '',
};
