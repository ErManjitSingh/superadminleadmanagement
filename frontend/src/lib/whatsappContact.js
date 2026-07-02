import { APP_BRAND_NAME } from '../config/branding';

export function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function renderWhatsAppTemplate(body, lead = {}, user = {}, extras = {}) {
  const total = extras.totalPrice ?? lead.totalPrice ?? '';
  const formattedTotal =
    total !== '' && total != null
      ? `₹${Number(total).toLocaleString('en-IN')}`
      : '';
  return String(body || '')
    .replace(/\{\{customerName\}\}/g, lead.name || 'Customer')
    .replace(/\{\{destination\}\}/g, lead.destination || extras.destination || 'your destination')
    .replace(/\{\{executiveName\}\}/g, user?.name || APP_BRAND_NAME)
    .replace(/\{\{quoteNumber\}\}/g, extras.quoteNumber || lead.quoteNumber || '')
    .replace(/\{\{packageName\}\}/g, extras.packageName || lead.packageName || 'travel package')
    .replace(/\{\{duration\}\}/g, extras.duration || lead.duration || '')
    .replace(/\{\{totalPrice\}\}/g, formattedTotal);
}

export function buildQuotationShareUrl(shareToken) {
  if (!shareToken || typeof window === 'undefined') return '';
  const base = import.meta.env.BASE_URL || '/';
  const pathPrefix = base === '/' ? '' : base.replace(/\/$/, '');
  return `${window.location.origin}${pathPrefix}/quote/${shareToken}`;
}

/** WhatsApp message for PDF file share — no download links. */
export function buildQuotationWhatsAppMessage({
  lead = {},
  packageName = '',
  destination = '',
  duration = '',
  total = 0,
  quoteNumber = '',
  executiveName = '',
} = {}) {
  const name = lead.name || 'Sir/Madam';
  const dest = destination || lead.destination || 'your trip';
  const pkg = packageName || 'travel package';
  const dur = duration ? `${duration} Days` : '';
  const price =
    total > 0 ? `₹${Number(total).toLocaleString('en-IN')}` : '';

  const lines = [
    `Hello ${name},`,
    '',
    `Greetings from ${executiveName || APP_BRAND_NAME}!`,
    '',
    `Your quotation is ready for *${dest}*:`,
    `📦 Package: ${pkg}`,
  ];
  if (dur) lines.push(`📅 Duration: ${dur}`);
  if (price) lines.push(`💰 Total: ${price}`);
  if (quoteNumber && quoteNumber !== 'DRAFT' && quoteNumber !== 'PREVIEW') {
    lines.push(`📋 Quote #: ${quoteNumber}`);
  }
  lines.push(
    '',
    'Please find the quotation PDF attached.',
    'Let us know if you would like any changes.',
    '',
    'Thank you!',
  );
  return lines.join('\n');
}

export function buildWhatsAppUrl(phone, message = '') {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return '';
  const base = `https://wa.me/${normalized}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function openWhatsApp(phone, message = '') {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return false;
  const text = message?.trim() ? encodeURIComponent(message.trim()) : '';
  const waMeUrl = text ? `https://wa.me/${normalized}?text=${text}` : `https://wa.me/${normalized}`;

  if (isMobileDevice()) {
    const appUrl = text
      ? `whatsapp://send?phone=${normalized}&text=${text}`
      : `whatsapp://send?phone=${normalized}`;
    window.location.href = appUrl;
    setTimeout(() => {
      if (!document.hidden) window.location.href = waMeUrl;
    }, 600);
    return true;
  }

  window.open(waMeUrl, '_blank', 'noopener,noreferrer');
  return true;
}

export function downloadBlob(blob, fileName) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyPhoneHint(phone) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return false;
  try {
    await navigator.clipboard.writeText(normalized);
    return true;
  } catch {
    return false;
  }
}

async function sharePdfFileNative(file, message) {
  if (!file || !navigator.share) return false;

  const attempts = [
    { files: [file], text: message },
    { files: [file], title: file.name },
    { files: [file] },
  ];

  for (const payload of attempts) {
    try {
      if (navigator.canShare && !navigator.canShare(payload)) continue;
      await navigator.share(payload);
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false;
    }
  }
  return false;
}

/**
 * Share quotation PDF as a file (not a link).
 * Mobile: native share sheet → pick WhatsApp → PDF attached.
 * Desktop: download PDF + open WhatsApp chat (user attaches file).
 */
export async function shareQuotationWhatsApp({ phone, message, pdfBlob, fileName }) {
  if (!phone) return false;

  const file = pdfBlob
    ? new File([pdfBlob], fileName || 'quotation.pdf', { type: 'application/pdf' })
    : null;

  if (isMobileDevice() && file) {
    await copyPhoneHint(phone);
    const shared = await sharePdfFileNative(file, message);
    if (shared) return true;

    downloadBlob(pdfBlob, fileName || 'quotation.pdf');
    openWhatsApp(
      phone,
      `${message}\n\n📎 PDF download ho gayi — attach (+) icon se file choose karein.`,
    );
    return true;
  }

  if (pdfBlob) {
    downloadBlob(pdfBlob, fileName || 'quotation.pdf');
  }

  return openWhatsApp(
    phone,
    `${message}\n\n📎 PDF download ho gayi — WhatsApp mein attach (+) se PDF file bhejein.`,
  );
}

export function buildPublicPdfUrl(pdfPath) {
  if (!pdfPath || typeof window === 'undefined') return '';
  if (pdfPath.startsWith('http')) return pdfPath;
  return `${window.location.origin}${pdfPath.startsWith('/') ? '' : '/'}${pdfPath}`;
}
