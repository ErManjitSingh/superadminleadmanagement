const PDFDocument = require('pdfkit');

const COLORS = {
  primary: '#0f172a',
  accent: '#b45309',
  gold: '#d97706',
  muted: '#64748b',
  light: '#f8fafc',
  border: '#e2e8f0',
  white: '#ffffff',
  success: '#0f766e',
  softGold: '#fef3c7',
};

/**
 * Low-level PDFKit helpers for premium document layouts.
 */
class PdfService {
  createDocument(options = {}) {
    return new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: {
        Title: options.title || 'Document',
        Author: options.author || 'Travel CRM',
        Creator: 'Travel CRM Quotation Engine',
      },
      ...options,
    });
  }

  async renderToBuffer(buildFn, options = {}) {
    const doc = this.createDocument(options);
    const chunks = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      Promise.resolve(buildFn(doc, COLORS))
        .then(() => doc.end())
        .catch(reject);
    });
  }

  drawHeaderBar(doc, colors = COLORS) {
    doc.save();
    doc.rect(0, 0, doc.page.width, 8).fill(colors.gold);
    doc.restore();
  }

  drawFooter(doc, { leftText = '', rightText = '', colors = COLORS } = {}) {
    const y = doc.page.height - 36;
    doc.save();
    doc
      .moveTo(doc.page.margins.left, y - 8)
      .lineTo(doc.page.width - doc.page.margins.right, y - 8)
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .stroke();
    doc
      .fontSize(8)
      .fillColor(colors.muted)
      .text(leftText, doc.page.margins.left, y, {
        width: doc.page.width / 2 - doc.page.margins.left,
        align: 'left',
      });
    doc.text(rightText, doc.page.width / 2, y, {
      width: doc.page.width / 2 - doc.page.margins.right,
      align: 'right',
    });
    doc.restore();
  }

  ensureSpace(doc, needed = 80) {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + needed > bottom) {
      doc.addPage();
      this.drawHeaderBar(doc);
      doc.y = doc.page.margins.top;
    }
  }

  sectionTitle(doc, title, colors = COLORS) {
    this.ensureSpace(doc, 40);
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(colors.primary)
      .text(String(title || '').toUpperCase(), { characterSpacing: 1 });
    doc
      .moveTo(doc.x, doc.y + 2)
      .lineTo(doc.x + 48, doc.y + 2)
      .strokeColor(colors.gold)
      .lineWidth(2)
      .stroke();
    doc.moveDown(0.8);
  }

  keyValueRow(doc, label, value, colors = COLORS) {
    if (value == null || value === '') return;
    this.ensureSpace(doc, 18);
    const x = doc.page.margins.left;
    const labelWidth = 120;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(colors.muted)
      .text(String(label), x, doc.y, { width: labelWidth, continued: false });
    const y = doc.y - 12;
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(colors.primary)
      .text(String(value), x + labelWidth, y, {
        width: doc.page.width - doc.page.margins.right - x - labelWidth,
      });
    doc.moveDown(0.25);
  }

  bulletList(doc, items = [], colors = COLORS) {
    const list = (items || []).filter(Boolean);
    if (!list.length) return;
    list.forEach((item) => {
      this.ensureSpace(doc, 16);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.primary)
        .text(`•  ${item}`, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
      doc.moveDown(0.15);
    });
  }

  card(doc, { title, lines = [], colors = COLORS } = {}) {
    this.ensureSpace(doc, 70);
    const startY = doc.y;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const text = [title, ...lines].filter(Boolean).join('\n');
    const height = Math.max(54, doc.heightOfString(text, { width: width - 24 }) + 24);

    doc.save();
    doc.roundedRect(doc.page.margins.left, startY, width, height, 8).fill(colors.light);
    doc
      .roundedRect(doc.page.margins.left, startY, width, height, 8)
      .strokeColor(colors.border)
      .lineWidth(0.8)
      .stroke();
    doc.restore();

    doc.y = startY + 12;
    if (title) {
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(colors.primary)
        .text(title, doc.page.margins.left + 12, doc.y, { width: width - 24 });
      doc.moveDown(0.2);
    }
    lines.filter(Boolean).forEach((line) => {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.muted)
        .text(line, doc.page.margins.left + 12, doc.y, { width: width - 24 });
    });
    doc.y = startY + height + 10;
  }
}

module.exports = new PdfService();
module.exports.COLORS = COLORS;
