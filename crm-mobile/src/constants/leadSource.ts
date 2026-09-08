const SOURCE_SHORT: Record<string, string> = {
  google_ads: 'Website',
  facebook_ads: 'Facebook',
  facebook: 'Facebook',
  website: 'Website',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  social: 'Social',
  phone: 'Phone',
  walk_in: 'Walk-in',
  'walk-in': 'Walk-in',
  organic: 'Organic',
  other: 'Other',
};

function normalizeSourceKey(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

export function getLeadSourceLabel(source?: string | null, sourceLabel?: string | null): string {
  const label = typeof sourceLabel === 'string' ? sourceLabel.trim() : '';
  if (label) return label;

  const raw = typeof source === 'string' ? source.trim() : '';
  if (!raw) return '—';

  const key = normalizeSourceKey(raw);
  if (SOURCE_SHORT[key]) return SOURCE_SHORT[key];

  // Humanize unknown keys like how_or → How Or
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
