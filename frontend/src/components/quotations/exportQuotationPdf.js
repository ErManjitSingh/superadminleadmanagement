import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cloneWithEmbeddedImages, waitForImages } from './embedPrintImages';

const CAPTURE_WIDTH_PX = 794;

function mountCaptureHost(embedded) {
  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:794px',
    'z-index:-1',
    'pointer-events:none',
    'visibility:hidden',
    'overflow:visible',
    'background:#fff',
  ].join(';');
  host.appendChild(embedded);
  document.body.appendChild(host);
  return host;
}

/**
 * Render quotation DOM to a multi-page A4 PDF blob (slice capture — works for long brochures).
 */
export async function exportQuotationPdfBlob(contentEl) {
  if (!contentEl) throw new Error('Quotation preview is not ready');

  const embedded = (await cloneWithEmbeddedImages(contentEl)) || contentEl.cloneNode(true);
  const host = mountCaptureHost(embedded);

  try {
    await waitForImages(embedded, 12000);
    await new Promise((r) => setTimeout(r, 250));

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const totalHeight = embedded.scrollHeight || embedded.offsetHeight || 1;
    const scale = totalHeight > 8000 ? 0.9 : 1.1;
    const slicePx = Math.max(900, Math.floor((CAPTURE_WIDTH_PX * pageHeight) / pageWidth));

    let pageIndex = 0;
    for (let y = 0; y < totalHeight; y += slicePx) {
      const sliceHeight = Math.min(slicePx, totalHeight - y);
      const canvas = await html2canvas(embedded, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: CAPTURE_WIDTH_PX,
        height: sliceHeight,
        y,
        scrollY: -y,
        windowWidth: CAPTURE_WIDTH_PX,
        windowHeight: sliceHeight,
      });

      if (!canvas?.width || !canvas?.height) {
        throw new Error('PDF render failed');
      }

      let imgData;
      try {
        imgData = canvas.toDataURL('image/jpeg', 0.82);
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
