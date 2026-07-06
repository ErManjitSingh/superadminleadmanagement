function base64ToBlob(base64, mime) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function openWhatsAppWithPdf({ waMeUrl, pdfBase64, fileName = 'document.pdf', message = '' } = {}) {
  if (pdfBase64 && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const blob = base64ToBlob(pdfBase64, 'application/pdf');
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message });
        return true;
      }
    } catch {
      // fall through to wa.me
    }
  }
  if (waMeUrl) {
    window.open(waMeUrl, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}
