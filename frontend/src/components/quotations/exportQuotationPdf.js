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
  ].join(';');
  root.querySelectorAll('*').forEach((node) => {
    if (node.style?.visibility === 'hidden') node.style.visibility = 'visible';
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

async function captureViewport(viewport, scale) {
  return html2canvas(viewport, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
    width: CAPTURE_WIDTH_PX,
    height: viewport.offsetHeight || 1,
    windowWidth: CAPTURE_WIDTH_PX,
    windowHeight: viewport.offsetHeight || 1,
  });
}

async function buildPdfFromSlices(embedded, viewport, host) {
  await waitForImages(embedded, 12000);
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }
  await new Promise((r) => setTimeout(r, 400));

  const mobile = isMobileCapture();
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const totalHeight = Math.max(embedded.scrollHeight, embedded.offsetHeight, 1);
  const scale = mobile ? 1 : totalHeight > 12000 ? 1.5 : 2;
  const jpegQuality = mobile ? 0.72 : 0.85;
  const slicePx = Math.max(800, Math.floor((CAPTURE_WIDTH_PX * pageHeight) / pageWidth));

  let pageIndex = 0;
  for (let y = 0; y < totalHeight; y += slicePx) {
    const sliceHeight = Math.min(slicePx, totalHeight - y);
    viewport.style.height = `${sliceHeight}px`;
    embedded.style.marginTop = `-${y}px`;

    const canvas = await captureViewport(viewport, scale);
    if (!canvas?.width || !canvas?.height) {
      throw new Error('PDF render failed');
    }

    const imgData = canvasToJpeg(canvas, jpegQuality);
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    pageIndex += 1;
  }

  if (!pageIndex) throw new Error('PDF render failed');
  return pdf.output('blob');
}

/** Single-shot capture — fallback when slice mode fails (common on mobile). */
async function buildPdfSimple(embedded, viewport, host) {
  viewport.style.height = 'auto';
  embedded.style.marginTop = '0';
  viewport.style.overflow = 'visible';

  const mobile = isMobileCapture();
  const canvas = await captureViewport(viewport, mobile ? 0.85 : 1.25);
  if (!canvas?.width || !canvas?.height) {
    throw new Error('PDF render failed');
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgData = canvasToJpeg(canvas, mobile ? 0.7 : 0.82);
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    let rendered = 0;
    let page = 0;
    while (rendered < imgHeight) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -rendered, imgWidth, imgHeight);
      rendered += pageHeight;
      page += 1;
    }
  }

  return pdf.output('blob');
}

/**
 * Render quotation DOM to a multi-page A4 PDF blob.
 */
export async function exportQuotationPdfBlob(contentEl) {
  if (!contentEl) throw new Error('Quotation preview is not ready');

  const embedded = (await cloneWithEmbeddedImages(contentEl)) || contentEl.cloneNode(true);
  prepareForCapture(embedded);

  const viewport = document.createElement('div');
  viewport.style.cssText = [
    `width:${CAPTURE_WIDTH_PX}px`,
    'overflow:hidden',
    'position:relative',
    'background:#ffffff',
    'visibility:visible',
  ].join(';');
  viewport.appendChild(embedded);

  const host = mountCaptureHost(viewport);

  try {
    try {
      return await buildPdfFromSlices(embedded, viewport, host);
    } catch (sliceErr) {
      console.warn('Slice PDF capture failed, trying simple mode', sliceErr);
      return await buildPdfSimple(embedded, viewport, host);
    }
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
