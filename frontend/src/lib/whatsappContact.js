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
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return false;
  const text = message?.trim() ? encodeURIComponent(message.trim()) : '';
  const waMeUrl = text ? `https://wa.me/${normalized}?text=${text}` : `https://wa.me/${normalized}`;

  if (isMobileDevice()) {
    // whatsapp:// opens the app with the customer number pre-filled (Android/iOS)
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

/**
 * Share quotation on WhatsApp with optional PDF file.
 * Mobile: opens WhatsApp to customer number with PDF download link in message.
 * Desktop: downloads PDF locally + opens WhatsApp with the same link.
 * (Browsers cannot auto-attach files to a specific WhatsApp chat.)
 */
export async function shareQuotationWhatsApp({ phone, message, pdfBlob, fileName, pdfUrl }) {
  if (!phone) return false;

  const msg = pdfUrl && !message.includes(pdfUrl)
    ? `${message}\n\n📄 Quotation PDF: ${pdfUrl}`
    : message;

  if (isMobileDevice()) {
    if (pdfUrl) {
      return openWhatsApp(phone, msg);
    }

    // No hosted PDF — last resort: system share sheet (user picks WhatsApp + contact)
    const file = pdfBlob
      ? new File([pdfBlob], fileName || 'quotation.pdf', { type: 'application/pdf' })
      : null;
    if (file && navigator.share) {
      try {
        const fileOnly = { files: [file] };
        if (navigator.canShare?.(fileOnly)) {
          await navigator.share(fileOnly);
          return true;
        }
      } catch (err) {
        if (err?.name === 'AbortError') return false;
      }
    }

    return openWhatsApp(phone, `${msg}\n\n(PDF link not ready — save quotation and try again.)`);
  }

  if (pdfBlob) {
    downloadBlob(pdfBlob, fileName || 'quotation.pdf');
  }

  const desktopMsg = pdfUrl
    ? `${msg}\n\n📄 PDF downloaded — attach it in WhatsApp if needed.`
    : msg;

  return openWhatsApp(phone, desktopMsg);
}

export function buildPublicPdfUrl(pdfPath) {
  if (!pdfPath || typeof window === 'undefined') return '';
  if (pdfPath.startsWith('http')) return pdfPath;
  return `${window.location.origin}${pdfPath.startsWith('/') ? '' : '/'}${pdfPath}`;
}
