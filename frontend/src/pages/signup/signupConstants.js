export const SIGNUP_STEPS = [
  { id: 'account', title: 'Account', subtitle: 'Company & owner details', icon: 'user' },
  { id: 'business', title: 'Business', subtitle: 'Type & regional settings', icon: 'building' },
  { id: 'plan', title: 'Plan', subtitle: 'Choose your subscription', icon: 'credit' },
  { id: 'domain', title: 'Domain', subtitle: 'Your workspace URL', icon: 'globe' },
  { id: 'review', title: 'Review', subtitle: 'Confirm details', icon: 'check' },
  { id: 'launch', title: 'Launch', subtitle: 'Create your workspace', icon: 'rocket' },
];

export const SIGNUP_BENEFITS = [
  '7-day free trial — no credit card',
  'Instant workspace provisioning',
  'Head Office branch auto-created',
  'Roles, permissions & email templates',
  'Subdomain or custom domain',
  'Enterprise-grade multi-tenant security',
];

export const TRUST_BADGES = [
  '256-bit SSL',
  'Data isolated per company',
  '99.9% uptime SLA',
];

export const BUSINESS_TYPES = [
  'Travel Agency',
  'Tour Operator',
  'DMC',
  'OTA',
  'Corporate Travel',
  'Online Travel',
  'Other',
];

export const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Singapore',
  'Australia',
  'Canada',
  'Other',
];

export const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'UAE (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Europe/London', label: 'UK (GMT)' },
  { value: 'America/New_York', label: 'US Eastern' },
  { value: 'America/Los_Angeles', label: 'US Pacific' },
  { value: 'Australia/Sydney', label: 'Australia (AEST)' },
];

export const CURRENCIES = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
];

export const PROVISION_ITEMS = [
  'Company workspace',
  'Head Office branch',
  'Company admin user',
  'Roles & permissions',
  'Default email templates',
  'Notification & SMTP placeholders',
  'Light theme workspace',
];

export const INITIAL_SIGNUP_FORM = {
  companyName: '',
  ownerName: '',
  ownerEmail: '',
  phone: '',
  password: '',
  confirmPassword: '',
  businessType: 'Travel Agency',
  country: 'India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  planSlug: 'starter',
  domainType: 'subdomain',
  subdomain: '',
  customDomain: '',
  domainVerified: false,
  domainVerifyStatus: 'idle',
};

export function slugifySubdomain(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function copyToClipboard(value) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(value);
  }
  return Promise.resolve();
}
