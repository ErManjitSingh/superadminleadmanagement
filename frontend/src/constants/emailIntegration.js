export const EMAIL_PROVIDERS = [
  { id: 'smtp', label: 'SMTP (Recommended)', host: '', port: 587, encryption: 'tls' },
  { id: 'google', label: 'Google Workspace', host: 'smtp.gmail.com', port: 587, encryption: 'tls' },
  { id: 'microsoft', label: 'Microsoft 365', host: 'smtp.office365.com', port: 587, encryption: 'tls' },
  { id: 'zoho', label: 'Zoho Mail', host: 'smtp.zoho.in', port: 465, encryption: 'ssl' },
  { id: 'hostinger', label: 'Hostinger Email', host: 'smtp.hostinger.com', port: 465, encryption: 'ssl' },
  { id: 'custom', label: 'Custom SMTP', host: '', port: 587, encryption: 'tls' },
];

export const SETUP_GUIDES = [
  { name: 'Hostinger', host: 'smtp.hostinger.com', port: 465, encryption: 'SSL' },
  { name: 'Google Workspace', host: 'smtp.gmail.com', port: 587, encryption: 'TLS' },
  { name: 'Microsoft 365', host: 'smtp.office365.com', port: 587, encryption: 'TLS' },
  { name: 'Zoho Mail', host: 'smtp.zoho.in', port: 465, encryption: 'SSL' },
  { name: 'Brevo', host: 'smtp-relay.brevo.com', port: 587, encryption: 'TLS' },
  { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, encryption: 'TLS' },
  { name: 'Amazon SES', host: 'Provided by AWS', port: '—', encryption: 'TLS' },
  { name: 'Custom SMTP', host: 'Manual Entry', port: '—', encryption: '—' },
];

export const EMAIL_MODULES = [
  { key: 'quotations', label: 'Quotations' },
  { key: 'booking_confirmation', label: 'Booking Confirmation' },
  { key: 'payment_receipt', label: 'Payment Receipt' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'hotel_voucher', label: 'Hotel Voucher' },
  { key: 'cab_voucher', label: 'Cab Voucher' },
  { key: 'customer_welcome', label: 'Customer Welcome' },
  { key: 'payment_reminder', label: 'Payment Reminder' },
  { key: 'final_reminder', label: 'Final Reminder' },
  { key: 'refund', label: 'Refund' },
  { key: 'supplier_voucher', label: 'Supplier Voucher' },
  { key: 'support_ticket', label: 'Support Ticket' },
  { key: 'password_reset', label: 'Password Reset' },
  { key: 'otp', label: 'OTP' },
];

export const TEMPLATE_VARIABLES = [
  '{{customer_name}}',
  '{{destination}}',
  '{{booking_id}}',
  '{{travel_date}}',
  '{{amount}}',
  '{{invoice_number}}',
  '{{voucher_number}}',
  '{{payment_link}}',
];

export const TEMPLATE_LINKS = [
  { label: 'Quotation', category: 'quotation' },
  { label: 'Invoice', category: 'custom' },
  { label: 'Receipt', category: 'payment_confirmation' },
  { label: 'Hotel Voucher', category: 'custom' },
  { label: 'Cab Voucher', category: 'custom' },
  { label: 'Booking Confirmation', category: 'booking_confirmation' },
  { label: 'Payment Reminder', category: 'follow_up' },
  { label: 'Welcome Email', category: 'welcome' },
  { label: 'Refund Email', category: 'custom' },
];

export const ENCRYPTION_OPTIONS = [
  { value: 'ssl', label: 'SSL' },
  { value: 'tls', label: 'TLS' },
  { value: 'starttls', label: 'STARTTLS' },
];

export function applyProviderPreset(providerId, form) {
  const preset = EMAIL_PROVIDERS.find((p) => p.id === providerId);
  if (!preset || providerId === 'custom') return form;
  return {
    ...form,
    smtpProvider: providerId,
    smtpHost: preset.host || form.smtpHost,
    smtpPort: preset.port || form.smtpPort,
    smtpEncryption: preset.encryption || form.smtpEncryption,
  };
}
