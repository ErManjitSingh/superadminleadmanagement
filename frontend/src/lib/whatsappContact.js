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

export function buildQuotationWhatsAppMessage({
  lead = {},
  packageName = '',
  destination = '',
  duration = '',
  total = 0,
  quoteNumber = '',
  executiveName = '',
  shareUrl = '',
  pdfUrl = '',
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
  lines.push('');
  lines.push('Please review the details and let us know if you would like any changes.');
  if (pdfUrl) {
    lines.push('', `📄 Download quotation PDF: ${pdfUrl}`);
  } else {
    lines.push('(PDF will be attached or linked when available.)');
  }
  if (shareUrl) {
    lines.push('', `View online: ${shareUrl}`);
  }
  lines.push('', 'Thank you!');
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
  const url = buildWhatsAppUrl(phone, message);
  if (!url) return false;
  if (isMobileDevice()) {
    window.location.assign(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
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

/**
 * Share quotation on WhatsApp with optional PDF file.
 * Mobile: native share sheet (PDF attached when supported).
 * Desktop: download PDF + open WhatsApp with PDF link in message.
 */
export async function shareQuotationWhatsApp({ phone, message, pdfBlob, fileName, pdfUrl }) {
  if (!phone) return false;

  const file = pdfBlob
    ? new File([pdfBlob], fileName || 'quotation.pdf', { type: 'application/pdf' })
    : null;

  if (file && navigator.share) {
    try {
      const payload = { text: message, files: [file] };
      if (navigator.canShare?.(payload)) {
        await navigator.share(payload);
        return true;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return false;
    }
  }

  if (pdfBlob) {
    downloadBlob(pdfBlob, fileName || 'quotation.pdf');
  }

  const msg = pdfUrl && !message.includes(pdfUrl)
    ? `${message}\n\n📄 PDF downloaded — attach it in WhatsApp if needed.\n${pdfUrl}`
    : message;

  return openWhatsApp(phone, msg);
}

export function buildPublicPdfUrl(pdfPath) {
  if (!pdfPath || typeof window === 'undefined') return '';
  if (pdfPath.startsWith('http')) return pdfPath;
  return `${window.location.origin}${pdfPath.startsWith('/') ? '' : '/'}${pdfPath}`;
}
