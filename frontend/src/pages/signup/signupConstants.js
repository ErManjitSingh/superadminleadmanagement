export const SIGNUP_STEPS = [
  { id: 'account', title: 'Account', subtitle: 'Company & owner details' },
  { id: 'business', title: 'Business', subtitle: 'Regional settings' },
  { id: 'domain', title: 'Domain', subtitle: 'Your workspace URL' },
  { id: 'review', title: 'Review', subtitle: 'Confirm details' },
  { id: 'launch', title: 'Launch', subtitle: 'Create your demo' },
];

export const BUSINESS_TYPES = [
  'Travel Agency',
  'DMC',
  'Tour Operator',
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
  'Default settings',
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
