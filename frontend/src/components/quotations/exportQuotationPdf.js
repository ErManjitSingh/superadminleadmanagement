import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cloneWithEmbeddedImages, waitForImages } from './embedPrintImages';

/** Target max PDF size (~500KB). */
const TARGET_MAX_BYTES = 500 * 1024;

/** Capture profiles — lightest first that still looks acceptable. */
const PROFILES = [
  { width: 560, scale: 1, quality: 0.48 },
  { width: 520, scale: 0.9, quality: 0.4 },
  { width: 480, scale: 0.85, quality: 0.34 },
  { width: 440, scale: 0.8, quality: 0.28 },
];

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

  root.querySelectorAll('*').forEach((node) => {
    if (node.style?.visibility === 'hidden') node.style.visibility = 'visible';
    if (node.classList?.contains('qp-watermark') || node.classList?.contains('qp-watermark-text')) {
      return;
    }
    if (node.style?.opacity === '0') node.style.opacity = '1';
  });
}

/** Downscale/compress inline images so the capture canvas stays small. */
function compressImagesInClone(root, maxEdge = 360, quality = 0.45) {
  root.querySelectorAll('img').forEach((img) => {
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

/**
 * Shrink a page canvas before encoding if it is still wide.
 */
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

async function buildPdfFromCanvas(canvas, quality) {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageHeightPx = Math.max(1, Math.round((canvas.width * pageHeight) / pageWidth));

  let y = 0;
  let page = 0;
  while (y < canvas.height) {
    const sliceH = Math.min(pageHeightPx, canvas.height - y);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceH;

    const ctx = pageCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    const encoded = downscaleCanvas(pageCanvas, 900);
    const imgData = canvasToJpeg(encoded, quality);
    const imgHeightMm = (sliceH * pageWidth) / canvas.width;

    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeightMm, undefined, 'FAST');

    y += pageHeightPx;
    page += 1;
  }

  if (!page) throw new Error('PDF render failed');
  return pdf.output('blob');
}

async function renderWithProfile(contentEl, profile) {
  const embedded = (await cloneWithEmbeddedImages(contentEl)) || contentEl.cloneNode(true);
  prepareForCapture(embedded, profile.width);
  compressImagesInClone(embedded, 320, 0.42);

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

    // Extra safety: never keep a huge master canvas.
    const master = downscaleCanvas(canvas, Math.round(profile.width * profile.scale));
    return buildPdfFromCanvas(master, profile.quality);
  } finally {
    host.remove();
  }
}

/**
 * Render quotation DOM to a multi-page A4 PDF blob under ~500KB.
 */
export async function exportQuotationPdfBlob(contentEl) {
  if (!contentEl) throw new Error('Quotation preview is not ready');

  let bestBlob = null;

  for (const profile of PROFILES) {
    try {
      const blob = await renderWithProfile(contentEl, profile);
      bestBlob = blob;
      if (blob.size <= TARGET_MAX_BYTES) {
        return blob;
      }
    } catch (err) {
      console.warn('PDF profile failed', profile, err);
    }
  }

  if (!bestBlob) throw new Error('PDF render failed');
  return bestBlob;
}

export async function downloadQuotationPdf(contentEl, fileName = 'quotation.pdf') {
  const blob = await exportQuotationPdfBlob(contentEl);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
