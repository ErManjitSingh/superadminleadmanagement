import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cloneWithEmbeddedImages, waitForImages } from './embedPrintImages';

const CAPTURE_WIDTH_PX = 794;

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
  // Must stay "visible" for html2canvas — opacity 0.01 hides from user without blank canvas.
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

function isCanvasMostlyBlank(canvas) {
  if (!canvas?.width || !canvas?.height) return true;
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;
  const w = Math.min(80, canvas.width);
  const h = Math.min(80, canvas.height);
  const { data } = ctx.getImageData(0, 0, w, h);
  let white = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 248 && data[i + 1] > 248 && data[i + 2] > 248) white += 1;
  }
  return white / pixels > 0.97;
}

async function captureViewport(viewport, scale) {
  return html2canvas(viewport, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: CAPTURE_WIDTH_PX,
    height: viewport.offsetHeight,
    windowWidth: CAPTURE_WIDTH_PX,
    windowHeight: viewport.offsetHeight,
  });
}

/**
 * Render quotation DOM to a multi-page A4 PDF blob (viewport slice — works for long brochures).
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
    await waitForImages(embedded, 12000);
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) => setTimeout(r, 400));

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const totalHeight = Math.max(embedded.scrollHeight, embedded.offsetHeight, 1);
    const scale = totalHeight > 12000 ? 1.5 : 2;
    const slicePx = Math.max(1000, Math.floor((CAPTURE_WIDTH_PX * pageHeight) / pageWidth));

    let pageIndex = 0;
    for (let y = 0; y < totalHeight; y += slicePx) {
      const sliceHeight = Math.min(slicePx, totalHeight - y);
      viewport.style.height = `${sliceHeight}px`;
      embedded.style.marginTop = `-${y}px`;

      const canvas = await captureViewport(viewport, scale);

      if (!canvas?.width || !canvas?.height || isCanvasMostlyBlank(canvas)) {
        throw new Error('PDF render failed — preview was empty. Use Preview PDF → Print/Save PDF.');
      }

      let imgData;
      try {
        imgData = canvas.toDataURL('image/jpeg', 0.85);
      } catch {
        throw new Error('PDF image too large — try Preview PDF → Print/Save PDF');
      }

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pageIndex += 1;
    }

    if (!pageIndex) throw new Error('PDF render failed');
    return pdf.output('blob');
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
