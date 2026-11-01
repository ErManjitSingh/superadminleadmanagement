/** Customer-facing support number on vouchers, receipts, quotations. */
const PUBLIC_SUPPORT_PHONE = '+91 62305 57851';

/** Retired numbers that must never print on customer documents. */
const RETIRED_SUPPORT_PHONES = new Set(['8219440351']);

function localTenDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Replace retired support numbers with the public line.
 * @param {string} [value]
 * @param {{ fallback?: boolean }} [opts] — if true, empty values become PUBLIC_SUPPORT_PHONE
 */
function normalizePublicSupportPhone(value, { fallback = false } = {}) {
  const raw = String(value || '').trim();
  const local = localTenDigits(raw);
  if (local && RETIRED_SUPPORT_PHONES.has(local)) return PUBLIC_SUPPORT_PHONE;
  if (raw && raw !== '-') return raw;
  return fallback ? PUBLIC_SUPPORT_PHONE : '';
}

module.exports = {
  PUBLIC_SUPPORT_PHONE,
  RETIRED_SUPPORT_PHONES,
  localTenDigits,
  normalizePublicSupportPhone,
};
