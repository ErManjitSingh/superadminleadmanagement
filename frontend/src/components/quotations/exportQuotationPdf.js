import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cloneWithEmbeddedImages, waitForImages } from './embedPrintImages';

const CAPTURE_WIDTH_PX = 794;

function isMobileCapture() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

/** html2canvas skips invisible nodes — force visible styles on clone. */
function prepareForCapture(root) {
  root.style.cssText = [
    `width:${CAPTURE_WIDTH_PX}px`,
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
    // Keep watermark opacity — do not force all nodes to opacity 1.
    if (node.classList?.contains('qp-watermark') || node.classList?.contains('qp-watermark-text')) {
      return;
    }
    if (node.style?.opacity === '0') node.style.opacity = '1';
  });
}

function mountCaptureHost(viewport) {
  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${CAPTURE_WIDTH_PX}px`,
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

async function captureFullContent(viewport, scale) {
  return html2canvas(viewport, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
    width: CAPTURE_WIDTH_PX,
    height: viewport.scrollHeight || viewport.offsetHeight || 1,
    windowWidth: CAPTURE_WIDTH_PX,
    windowHeight: viewport.scrollHeight || viewport.offsetHeight || 1,
  });
}

/**
 * Capture once, then slice canvas into A4 pages with zero gap between pages.
 */
async function buildPdfContinuous(embedded, viewport) {
  await waitForImages(embedded, 12000);
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }
  await new Promise((r) => setTimeout(r, 300));

  viewport.style.height = 'auto';
  viewport.style.overflow = 'visible';
  embedded.style.marginTop = '0';

  const mobile = isMobileCapture();
  const totalHeight = Math.max(embedded.scrollHeight, embedded.offsetHeight, 1);
  const scale = mobile ? 1 : totalHeight > 12000 ? 1.25 : 1.75;
  const jpegQuality = mobile ? 0.74 : 0.86;

  const canvas = await captureFullContent(viewport, scale);
  if (!canvas?.width || !canvas?.height) {
    throw new Error('PDF render failed');
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // How many source pixels map to one full A4 page height.
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
    ctx.drawImage(
      canvas,
      0,
      y,
      canvas.width,
      sliceH,
      0,
      0,
      canvas.width,
      sliceH,
    );

    const imgData = canvasToJpeg(pageCanvas, jpegQuality);
    // Exact height for this slice — no stretch, no extra blank band.
    const imgHeightMm = (sliceH * pageWidth) / canvas.width;

    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeightMm);

    y += pageHeightPx;
    page += 1;
  }

  if (!page) throw new Error('PDF render failed');
  return pdf.output('blob');
}

/**
 * Render quotation DOM to a multi-page A4 PDF blob (no page gaps).
 */
export async function exportQuotationPdfBlob(contentEl) {
  if (!contentEl) throw new Error('Quotation preview is not ready');

  const embedded = (await cloneWithEmbeddedImages(contentEl)) || contentEl.cloneNode(true);
  prepareForCapture(embedded);

  const viewport = document.createElement('div');
  viewport.style.cssText = [
    `width:${CAPTURE_WIDTH_PX}px`,
    'overflow:visible',
    'position:relative',
    'background:#ffffff',
    'visibility:visible',
    'margin:0',
    'padding:0',
  ].join(';');
  viewport.appendChild(embedded);

  const host = mountCaptureHost(viewport);

  try {
    return await buildPdfContinuous(embedded, viewport);
  } finally {
    host.remove();
  }
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
