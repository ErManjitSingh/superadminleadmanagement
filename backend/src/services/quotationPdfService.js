const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const QUOTATION_PDF_DIR = path.join(UPLOADS_ROOT, 'quotations');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function saveQuotationPdfBuffer(shareToken, buffer) {
  if (!shareToken) throw new Error('shareToken is required');
  ensureDir(QUOTATION_PDF_DIR);
  const fileName = `${shareToken}.pdf`;
  fs.writeFileSync(path.join(QUOTATION_PDF_DIR, fileName), buffer);
  return { pdfUrl: `/uploads/quotations/${fileName}` };
}

function buildPublicPdfUrl(req, pdfUrl) {
  const base = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}${pdfUrl}`;
}

module.exports = {
  saveQuotationPdfBuffer,
  buildPublicPdfUrl,
  QUOTATION_PDF_DIR,
};
