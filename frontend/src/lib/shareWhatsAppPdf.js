import {
  downloadBlob,
  isMobileDevice,
  openWhatsApp,
  sharePdfFileNative,
} from './whatsappContact';

function base64ToBlob(base64, mime) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function phoneFromWaMeUrl(waMeUrl = '') {
  const m = String(waMeUrl).match(/wa\.me\/(\d+)/i);
  return m?.[1] || '';
}

function canShareFiles(file) {
  if (!file || typeof navigator === 'undefined' || !navigator.share) return false;
  if (typeof navigator.canShare !== 'function') return isMobileDevice();
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Open WhatsApp with a PDF voucher/receipt.
 * Mobile: native share sheet (PDF attached) when available.
 * Desktop / fallback: download PDF + open chat (same as quotation flow).
 */
export async function openWhatsAppWithPdf({
  waMeUrl,
  pdfBase64,
  fileName = 'document.pdf',
  message = '',
  phone = '',
} = {}) {
  const recipient = String(phone || '').replace(/\D/g, '') || phoneFromWaMeUrl(waMeUrl);
  const blob = pdfBase64 ? base64ToBlob(pdfBase64, 'application/pdf') : null;
  const file =
    blob?.size > 0
      ? new File([blob], fileName, { type: 'application/pdf', lastModified: Date.now() })
      : null;

  if (file && canShareFiles(file)) {
    try {
      const shared = await sharePdfFileNative(file, message);
      if (shared) return { ok: true, mode: 'native-share' };
    } catch {
      // fall through
    }
  }

  // Desktop / share cancelled: always download so staff can attach manually.
  if (blob?.size) {
    downloadBlob(blob, fileName);
  }

  if (recipient) {
    openWhatsApp(recipient, message);
    return { ok: true, mode: blob?.size ? 'download-manual' : 'chat-only' };
  }

  if (waMeUrl) {
    // Anchor click survives popup blockers better than window.open after await.
    const a = document.createElement('a');
    a.href = waMeUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return { ok: true, mode: blob?.size ? 'download-manual' : 'chat-only' };
  }

  return { ok: false, mode: 'error', reason: 'WhatsApp link missing' };
}
