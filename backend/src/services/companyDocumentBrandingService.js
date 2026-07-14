const fs = require('fs');
const path = require('path');
const platformBranding = require('../config/branding');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

function toAbsoluteHttpUrl(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/^(https?:|data:|file:)/i.test(raw)) return raw;
  const host = (platformBranding.websiteUrl || '').replace(/\/$/, '');
  if (raw.startsWith('/')) return `${host}${raw}`;
  return `${host}/${raw.replace(/^\.?\/+/, '')}`;
}

function logoToEmbedSrc(logoValue) {
  if (!logoValue) return '';
  const raw = String(logoValue).trim();
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;

  const candidates = [];
  if (raw.startsWith('/uploads/')) {
    candidates.push(path.join(UPLOADS_ROOT, raw.replace(/^\/uploads\/?/, '')));
  } else if (raw.startsWith('uploads/')) {
    candidates.push(path.join(UPLOADS_ROOT, raw.replace(/^uploads\/?/, '')));
  } else if (!/^https?:\/\//i.test(raw)) {
    candidates.push(path.join(UPLOADS_ROOT, raw));
    candidates.push(path.join(__dirname, '../../', raw));
  }

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const buf = fs.readFileSync(filePath);
        return `data:${guessMime(filePath)};base64,${buf.toString('base64')}`;
      }
    } catch {
      /* ignore */
    }
  }

  return toAbsoluteHttpUrl(raw);
}

function formatCompanyAddress(company = {}) {
  return [company.address, company.city, company.state, company.country]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(', ');
}

function companyInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function stampLines(name = '') {
  const cleaned = String(name || 'COMPANY').trim().toUpperCase();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [cleaned.slice(0, 18), 'AUTHORISED'];
  return [words.slice(0, 2).join(' ').slice(0, 18), words.slice(2).join(' ').slice(0, 14) || 'AUTHORISED'];
}

/**
 * Resolve PDF/document branding for the tenant company that owns the booking.
 */
async function resolveCompanyDocumentBranding(companyId) {
  const fallbackName = platformBranding.brandName && !/travel\s*crm/i.test(platformBranding.brandName)
    ? platformBranding.brandName
    : 'Travel Company';

  const base = {
    name: fallbackName,
    tagline: '',
    logoSrc: '',
    initials: companyInitials(fallbackName),
    phone: platformBranding.supportPhone || '',
    email: platformBranding.salesEmail || platformBranding.quotesEmail || '',
    website: (platformBranding.websiteUrl || '').replace(/^https?:\/\//, ''),
    websiteUrl: platformBranding.websiteUrl || '',
    address: '',
    gst: '',
    primaryColor: '#5b21b6',
    stamp: stampLines(fallbackName),
  };

  if (!companyId) return base;

  try {
    const Company = require('../superadmin/models/Company');
    const company = await Company.findById(companyId)
      .select('name tagline logo phone website quotesEmail address city state country gst whiteLabel tenantSettings')
      .lean();

    if (!company) return base;

    const logoRaw =
      company.whiteLabel?.invoiceLogoUrl
      || company.whiteLabel?.quotationLogoUrl
      || company.whiteLabel?.emailLogoUrl
      || company.logo
      || company.tenantSettings?.brandLogoUrl
      || '';

    const name = company.name || base.name;
    return {
      name,
      tagline: company.tagline || company.whiteLabel?.appTitle || '',
      logoSrc: logoToEmbedSrc(logoRaw),
      initials: companyInitials(name),
      phone: company.phone || base.phone,
      email: company.quotesEmail || company.tenantSettings?.smtpFromEmail || base.email,
      website: (company.website || base.websiteUrl || '').replace(/^https?:\/\//, ''),
      websiteUrl: company.website || base.websiteUrl,
      address: formatCompanyAddress(company),
      gst: company.gst || '',
      primaryColor: company.whiteLabel?.primaryColor || base.primaryColor,
      stamp: stampLines(name),
    };
  } catch (err) {
    console.error('[CompanyBranding]', err.message);
    return base;
  }
}

module.exports = {
  resolveCompanyDocumentBranding,
  logoToEmbedSrc,
  companyInitials,
};
