/** Short labels for lead source — keep in sync with backend/src/utils/leadSourceLabels.js */
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

export function getLeadSourceShortLabel(source, sourceLabel) {
  const key = normalizeSourceKey(source);
  if (SOURCE_SHORT[key]) return SOURCE_SHORT[key];

  const label = (sourceLabel || '').toLowerCase();
  if (label.includes('facebook') || label.includes('fb ')) return 'FB Lead';
  if (label.includes('google')) return 'Website';
  if (label.includes('whatsapp')) return 'WA';
  if (label.includes('instagram') || label.includes('social')) return 'Social';

  return SOURCE_SHORT.other;
}

export const LEAD_SOURCE_FILTER_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: 'google_ads', label: 'Website' },
  { value: 'facebook_ads', label: 'FB Lead' },
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WA' },
  { value: 'referral', label: 'Referral' },
  { value: 'phone', label: 'Phone' },
  { value: 'walk-in', label: 'Walk-in' },
];
