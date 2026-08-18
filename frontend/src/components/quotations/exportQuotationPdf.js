import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cloneWithEmbeddedImages, waitForImages } from './embedPrintImages';
import travelAgentCertificate from '../../assets/hp-travel-agent-certificate.png';

/** HD for WhatsApp / download — sharp, ~800KB. */
const HD_TARGET_MAX_BYTES = 800 * 1024;
const HD_PROFILES = [
  { width: 720, scale: 1.5, quality: 0.74 },
  { width: 680, scale: 1.35, quality: 0.66 },
  { width: 640, scale: 1.2, quality: 0.58 },
  { width: 600, scale: 1.1, quality: 0.5 },
];
const HD_IMAGE = { maxEdge: 780, quality: 0.72 };
const HD_PAGE_MAX_WIDTH = 1240;
const HD_PDF_COMPRESSION = 'MEDIUM';

/** Compact for server storage — previous optimizer, ~500KB. */
const STORAGE_TARGET_MAX_BYTES = 500 * 1024;
const STORAGE_PROFILES = [
  { width: 560, scale: 1, quality: 0.48 },
  { width: 520, scale: 0.9, quality: 0.4 },
  { width: 480, scale: 0.85, quality: 0.34 },
  { width: 440, scale: 0.8, quality: 0.28 },
];
const STORAGE_IMAGE = { maxEdge: 320, quality: 0.42 };
const STORAGE_PAGE_MAX_WIDTH = 900;
const STORAGE_PDF_COMPRESSION = 'FAST';

const QUALITY_PRESETS = {
  hd: {
    targetMaxBytes: HD_TARGET_MAX_BYTES,
    profiles: HD_PROFILES,
    image: HD_IMAGE,
    pageMaxWidth: HD_PAGE_MAX_WIDTH,
    pdfCompression: HD_PDF_COMPRESSION,
  },
  storage: {
    targetMaxBytes: STORAGE_TARGET_MAX_BYTES,
    profiles: STORAGE_PROFILES,
    image: STORAGE_IMAGE,
    pageMaxWidth: STORAGE_PAGE_MAX_WIDTH,
    pdfCompression: STORAGE_PDF_COMPRESSION,
  },
};

function resolvePreset(quality = 'hd') {
  return QUALITY_PRESETS[quality] || QUALITY_PRESETS.hd;
}

function prepareForCapture(root, widthPx) {
  root.style.cssText = [
    `width:${widthPx}px`,
    'visibility:visible',
    'opacity:1',
    'display:block',
    'position:relative',
    'background:#ffffff',
    'margin:0',
    'padding:0',
  ].join(';');

  // Force continuous layout during capture (ignore screen print keep-together rules)
  const style = document.createElement('style');
  style.textContent = `
    .quote-ht-pdf-v2, .quote-ht-pdf-v2 * {
      page-break-inside: auto !important;
      break-inside: auto !important;
      page-break-before: auto !important;
      page-break-after: auto !important;
      break-before: auto !important;
      break-after: auto !important;
    }
    .qp-section-block, .qp-day, .qp-policies, .qp-bank-wrap,
    .qp-inc-exc-premium, .qp-vehicle-list, .qp-overview-grid {
      margin-bottom: 4px !important;
    }
  `;
  root.prepend(style);

  root.querySelectorAll('*').forEach((node) => {
    if (node.style?.visibility === 'hidden') node.style.visibility = 'visible';
    if (node.style?.opacity === '0') node.style.opacity = '1';
  });

  // Certificate is appended as a dedicated HD last page, not sliced from the canvas.
  root.querySelectorAll('.qp-certificate-page').forEach((node) => {
    node.remove();
  });

  root.querySelectorAll('a[href]').forEach((anchor) => {
    const text = document.createElement('span');
    text.textContent = anchor.textContent || '';
    text.className = anchor.className || '';
    anchor.replaceWith(text);
  });

  root.querySelectorAll('img').forEach((img) => {
    // Keep payment QR + already-inlined images for PDF capture
    if (
      img.src?.startsWith('data:')
      || img.classList?.contains('qp-qr-img')
      || img.alt === 'Scan to pay'
      || img.alt === 'Payment QR'
    ) {
      return;
    }
    if (!img.src?.startsWith('data:')) {
      const placeholder = document.createElement('div');
      placeholder.className = `${img.className || ''} qp-img-placeholder`.trim();
      img.replaceWith(placeholder);
    }
  });
}

function compressImagesInClone(root, maxEdge = 780, quality = 0.72) {
  root.querySelectorAll('img').forEach((img) => {
    if (img.classList?.contains('qp-certificate-img') || img.classList?.contains('qp-qr-img')) {
      return;
    }
    try {
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (!w || !h) return;

      const longest = Math.max(w, h);
      const ratio = longest > maxEdge ? maxEdge / longest : 1;
      const tw = Math.max(1, Math.round(w * ratio));
      const th = Math.max(1, Math.round(h * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tw, th);
      ctx.drawImage(img, 0, 0, tw, th);
      img.src = canvas.toDataURL('image/jpeg', quality);
      img.style.width = '';
      img.style.height = '';
      img.removeAttribute('width');
      img.removeAttribute('height');
    } catch {
      /* keep original */
    }
  });
}

function mountCaptureHost(viewport, widthPx) {
  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${widthPx}px`,
    'z-index:-1',
    'pointer-events:none',
    'opacity:0.01',
    'visibility:visible',
    'overflow:visible',
    'background:#fff',
  ].join(';');
  host.appendChild(viewport);
  document.body.appendChild(host);
  return host;
}

function canvasToJpeg(canvas, quality) {
  try {
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return canvas.toDataURL('image/png');
  }
}

let certificateDataUrlPromise;

async function loadCertificateDataUrl() {
  if (!travelAgentCertificate) return null;
  if (!certificateDataUrlPromise) {
    certificateDataUrlPromise = (async () => {
      try {
        const res = await fetch(travelAgentCertificate, { cache: 'force-cache' });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    })();
  }
  return certificateDataUrlPromise;
}

function appendCertificatePage(pdf, dataUrl) {
  if (!pdf || !dataUrl) return;
  let props;
  try {
    props = pdf.getImageProperties(dataUrl);
  } catch {
    return;
  }
  if (!props?.width || !props?.height) return;

  pdf.addPage();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  const marginX = 8;
  const marginY = 12;
  const maxW = pageWidth - marginX * 2;
  const maxH = pageHeight - marginY * 2;
  const ratio = props.width / props.height;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  const x = (pageWidth - w) / 2;
  const y = (pageHeight - h) / 2;
  const format = String(dataUrl).startsWith('data:image/png') ? 'PNG' : 'JPEG';
  pdf.addImage(dataUrl, format, x, y, w, h, undefined, 'NONE');
}

function downscaleCanvas(source, maxWidth) {
  if (source.width <= maxWidth) return source;
  const ratio = maxWidth / source.width;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * ratio));
  canvas.height = Math.max(1, Math.round(source.height * ratio));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function captureFullContent(viewport, widthPx, scale) {
  return html2canvas(viewport, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 10000,
    width: widthPx,
    height: viewport.scrollHeight || viewport.offsetHeight || 1,
    windowWidth: widthPx,
    windowHeight: viewport.scrollHeight || viewport.offsetHeight || 1,
  });
}

async function buildPdfFromCanvas(canvas, quality, pageMaxWidth, pdfCompression, certificateDataUrl = null) {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  // Exact pixel height of one A4 page at this canvas width — no leftover blank band
  const pageHeightPx = Math.max(1, Math.floor((canvas.width * pageHeight) / pageWidth));

  let y = 0;
  let page = 0;
  while (y < canvas.height) {
    const remaining = canvas.height - y;
    const sliceH = Math.min(pageHeightPx, remaining);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceH;

    const ctx = pageCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    const encoded = downscaleCanvas(pageCanvas, pageMaxWidth);
    const imgData = canvasToJpeg(encoded, quality);
    const imgHeightMm = Math.min(pageHeight, (sliceH * pageWidth) / canvas.width);

    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeightMm, undefined, pdfCompression);

    y += sliceH;
    page += 1;
  }

  if (!page) throw new Error('PDF render failed');
  appendCertificatePage(pdf, certificateDataUrl);
  return pdf.output('blob');
}

async function renderWithProfile(contentEl, profile, preset) {
  const embedded = (await cloneWithEmbeddedImages(contentEl)) || contentEl.cloneNode(true);
  prepareForCapture(embedded, profile.width);
  compressImagesInClone(embedded, preset.image.maxEdge, preset.image.quality);

  const viewport = document.createElement('div');
  viewport.style.cssText = [
    `width:${profile.width}px`,
    'overflow:visible',
    'position:relative',
    'background:#ffffff',
    'visibility:visible',
    'margin:0',
    'padding:0',
  ].join(';');
  viewport.appendChild(embedded);

  const host = mountCaptureHost(viewport, profile.width);

  try {
    await waitForImages(embedded, 8000);
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) => setTimeout(r, 150));

    viewport.style.height = 'auto';
    viewport.style.overflow = 'visible';

    const canvas = await captureFullContent(viewport, profile.width, profile.scale);
    if (!canvas?.width || !canvas?.height) {
      throw new Error('PDF render failed');
    }

    const master = downscaleCanvas(canvas, Math.round(profile.width * profile.scale));
    const certificateDataUrl = await loadCertificateDataUrl();
    return buildPdfFromCanvas(
      master,
      profile.quality,
      preset.pageMaxWidth,
      preset.pdfCompression,
      certificateDataUrl,
    );
  } finally {
    host.remove();
  }
}

/**
 * Render quotation DOM to PDF.
 * @param {'hd'|'storage'} quality - hd for send/download (~800KB), storage for server (~500KB)
 */
export async function exportQuotationPdfBlob(contentEl, quality = 'hd') {
  if (!contentEl) throw new Error('Quotation preview is not ready');

  const preset = resolvePreset(quality);
  let bestBlob = null;

  for (const profile of preset.profiles) {
    try {
      const blob = await renderWithProfile(contentEl, profile, preset);
      bestBlob = blob;
      if (blob.size <= preset.targetMaxBytes) {
        return blob;
      }
    } catch (err) {
      console.warn('PDF profile failed', quality, profile, err);
    }
  }

  if (!bestBlob) throw new Error('PDF render failed');
  return bestBlob;
}

/** Compact PDF for uploading to server storage. */
export async function exportQuotationPdfForStorage(contentEl) {
  return exportQuotationPdfBlob(contentEl, 'storage');
}

export async function downloadQuotationPdf(contentEl, fileName = 'quotation.pdf') {
  const blob = await exportQuotationPdfBlob(contentEl, 'hd');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
