/** Short display labels for lead source (tables, badges) */
const SOURCE_SHORT = {
  google_ads: 'Website',
  facebook_ads: 'FB Lead',
  facebook: 'FB Lead',
  website: 'Website',
  whatsapp: 'WA',
  referral: 'Referral',
  social: 'Social',
  phone: 'Phone',
  'walk-in': 'Walk-in',
  organic: 'Organic',
  other: 'Other',
};

function normalizeSourceKey(raw) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function getLeadSourceShortLabel(source, sourceLabel) {
  const key = normalizeSourceKey(source);
  if (SOURCE_SHORT[key]) return SOURCE_SHORT[key];

  const label = (sourceLabel || '').toLowerCase();
  if (label.includes('facebook') || label.includes('fb ')) return 'FB Lead';
  if (label.includes('google')) return 'Website';
  if (label.includes('whatsapp') || label.includes('wa ')) return 'WA';
  if (label.includes('instagram') || label.includes('social')) return 'Social';

  return SOURCE_SHORT.other;
}

module.exports = { SOURCE_SHORT, getLeadSourceShortLabel, normalizeSourceKey };
