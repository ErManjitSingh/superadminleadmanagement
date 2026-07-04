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
  if (!pdfBlob) return null;
  return new File([pdfBlob], fileName || 'quotation.pdf', {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}

/**
 * Native OS share with PDF file. Must run soon after user tap — do not await slow work before this.
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
 * Returns { ok, mode } where mode is native-share | download-manual | desktop.
 */
export async function shareQuotationWhatsApp({ phone, message, pdfBlob, fileName }) {
  if (!phone) return { ok: false, mode: 'error' };

  const file = buildPdfFile(pdfBlob, fileName);

  if (isMobileDevice() && file) {
    await copyPhoneHint(phone);
    const shared = await sharePdfFileNative(file, message);
    if (shared) return { ok: true, mode: 'native-share' };

    downloadBlob(pdfBlob, fileName || 'quotation.pdf');
    openWhatsApp(phone, message);
    return { ok: true, mode: 'download-manual' };
  }

  if (pdfBlob) {
    downloadBlob(pdfBlob, fileName || 'quotation.pdf');
  }

  openWhatsApp(phone, message);
  return { ok: true, mode: 'desktop' };
}

export function buildPublicPdfUrl(pdfPath) {
  if (!pdfPath || typeof window === 'undefined') return '';
  if (pdfPath.startsWith('http')) return pdfPath;
  return `${window.location.origin}${pdfPath.startsWith('/') ? '' : '/'}${pdfPath}`;
}
