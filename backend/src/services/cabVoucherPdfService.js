const path = require('path');
const { buildCabVoucherHtml } = require('./voucherHtmlTemplates');
const { renderVoucherHtmlToPdf } = require('./voucherHtmlPdfService');

const VOUCHER_DIR = path.join(__dirname, '../../uploads/vouchers');

async function generateCabVoucherPdf(voucher, booking, payload = {}) {
  const safeNum = (voucher.voucherNumber || 'cab-voucher').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${safeNum}-v${voucher.version || 1}.pdf`;
  const enriched = { ...voucher, payload: payload || voucher.payload || {} };
  const html = await buildCabVoucherHtml(enriched, booking);
  return renderVoucherHtmlToPdf(html, fileName, VOUCHER_DIR);
}

module.exports = {
  generateCabVoucherPdf,
};
