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

/** Plain-text WhatsApp message (no emoji — survives wa.me encoding). */
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
    total > 0 ? `Rs.${Number(total).toLocaleString('en-IN')}` : '';

  const lines = [
    `Hello ${name},`,
    '',
    `Greetings from ${executiveName || APP_BRAND_NAME}!`,
    '',
    `Your quotation is ready for ${dest}:`,
    `Package: ${pkg}`,
  ];
  if (dur) lines.push(`Duration: ${dur}`);
  if (price) lines.push(`Total: ${price}`);
  if (quoteNumber && quoteNumber !== 'DRAFT' && quoteNumber !== 'PREVIEW') {
    lines.push(`Quote #: ${quoteNumber}`);
  }
  lines.push('', 'Please find the quotation PDF.', 'Thank you!');
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

export function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
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

function buildPdfFile(pdfBlob, fileName) {
  if (!pdfBlob?.size) return null;
  return new File([pdfBlob], fileName || 'quotation.pdf', {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}

function canShareFiles(file) {
  if (!file || typeof navigator === 'undefined' || !navigator.share) return false;
  if (typeof navigator.canShare !== 'function') {
    // Older Android Chrome often supports files without canShare.
    return isMobileDevice();
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Native OS share with PDF file attached.
 * On phone: pick WhatsApp → PDF document is attached.
 */
export async function sharePdfFileNative(file, message = '') {
  if (!file || !navigator.share) return false;

  const attempts = isAndroidDevice()
    ? [
        { files: [file] },
        { files: [file], text: message },
        { files: [file], title: file.name },
      ]
    : [
        { files: [file], text: message },
        { files: [file] },
        { files: [file], title: file.name },
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
 * Share quotation PDF as a real file (not a link).
 * Uses the phone share sheet so WhatsApp receives the PDF document.
 */
export async function shareQuotationWhatsApp({ phone, message, pdfBlob, fileName }) {
  if (!phone) return { ok: false, mode: 'error', reason: 'Phone missing' };
  if (!pdfBlob?.size) return { ok: false, mode: 'error', reason: 'PDF not ready' };

  const file = buildPdfFile(pdfBlob, fileName);
  if (!file) return { ok: false, mode: 'error', reason: 'PDF not ready' };

  // Best path: OS share sheet with PDF file → user selects WhatsApp → PDF is attached.
  if (canShareFiles(file)) {
    await copyPhoneHint(phone);
    const shared = await sharePdfFileNative(file, message);
    if (shared) return { ok: true, mode: 'native-share' };
  }

  // Fallback (desktop / share cancelled): download PDF and open chat.
  // Browser cannot auto-attach files to WhatsApp Web.
  downloadBlob(pdfBlob, fileName || 'quotation.pdf');
  openWhatsApp(phone, message);
  return { ok: true, mode: 'download-manual' };
}

export function buildPublicPdfUrl(pdfPath) {
  if (!pdfPath || typeof window === 'undefined') return '';
  if (pdfPath.startsWith('http')) return pdfPath;
  return `${window.location.origin}${pdfPath.startsWith('/') ? '' : '/'}${pdfPath}`;
}
