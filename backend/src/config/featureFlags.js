/** Canonical tenant feature-flag keys (shared by Company, plans, rollout). */
const FEATURE_KEYS = [
  'crm',
  'bookings',
  'packages',
  'hotels',
  'transport',
  'activities',
  'reports',
  'calendar',
  'whatsapp',
  'email',
  'api',
  'payments',
  'invoices',
];

const FEATURE_LABELS = {
  crm: 'CRM & Leads',
  bookings: 'Bookings & Operations',
  packages: 'Packages',
  hotels: 'Hotels',
  transport: 'Transport',
  activities: 'Activities',
  reports: 'Reports & Analytics',
  calendar: 'Calendar',
  whatsapp: 'WhatsApp API',
  email: 'Email',
  api: 'API Access',
  payments: 'Payments',
  invoices: 'Invoices',
};

const DEFAULT_FEATURES = {
  crm: true,
  bookings: true,
  packages: true,
  hotels: false,
  transport: false,
  activities: false,
  reports: true,
  calendar: true,
  whatsapp: false,
  email: true,
  api: false,
  payments: false,
  invoices: false,
};

function normalizeFeaturePatch(input) {
  if (!input || typeof input !== 'object') return {};
  const out = {};
  for (const key of FEATURE_KEYS) {
    if (typeof input[key] === 'boolean') out[key] = input[key];
  }
  return out;
}

function mergeFeatures(base, patch) {
  return { ...DEFAULT_FEATURES, ...base, ...normalizeFeaturePatch(patch) };
}

module.exports = {
  FEATURE_KEYS,
  FEATURE_LABELS,
  DEFAULT_FEATURES,
  normalizeFeaturePatch,
  mergeFeatures,
};
