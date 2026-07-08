const EMAIL_PROVIDERS = {
  smtp: { label: 'SMTP (Recommended)', host: '', port: 587, encryption: 'tls' },
  google: { label: 'Google Workspace', host: 'smtp.gmail.com', port: 587, encryption: 'tls' },
  microsoft: { label: 'Microsoft 365', host: 'smtp.office365.com', port: 587, encryption: 'tls' },
  zoho: { label: 'Zoho Mail', host: 'smtp.zoho.in', port: 465, encryption: 'ssl' },
  hostinger: { label: 'Hostinger Email', host: 'smtp.hostinger.com', port: 465, encryption: 'ssl' },
  brevo: { label: 'Brevo', host: 'smtp-relay.brevo.com', port: 587, encryption: 'tls' },
  mailgun: { label: 'Mailgun', host: 'smtp.mailgun.org', port: 587, encryption: 'tls' },
  ses: { label: 'Amazon SES', host: '', port: 587, encryption: 'tls' },
  custom: { label: 'Custom SMTP', host: '', port: 587, encryption: 'tls' },
};

const DEFAULT_EMAIL_MODULES = {
  quotations: true,
  booking_confirmation: true,
  payment_receipt: true,
  invoice: true,
  hotel_voucher: true,
  cab_voucher: true,
  customer_welcome: true,
  payment_reminder: true,
  final_reminder: true,
  refund: true,
  supplier_voucher: true,
  support_ticket: true,
  password_reset: true,
  otp: true,
};

const DEFAULT_EMAIL_SIGNATURE = {
  logoUrl: '',
  companyName: '',
  address: '',
  phone: '',
  website: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  footerText: '',
};

const TEMPLATE_VARIABLES = [
  '{{customer_name}}',
  '{{destination}}',
  '{{booking_id}}',
  '{{travel_date}}',
  '{{amount}}',
  '{{invoice_number}}',
  '{{voucher_number}}',
  '{{payment_link}}',
];

const DAILY_EMAIL_LIMIT = 1000;

module.exports = {
  EMAIL_PROVIDERS,
  DEFAULT_EMAIL_MODULES,
  DEFAULT_EMAIL_SIGNATURE,
  TEMPLATE_VARIABLES,
  DAILY_EMAIL_LIMIT,
};
