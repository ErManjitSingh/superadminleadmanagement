const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const branding = require('../config/branding');

const PURPLE = '#5b21b6';
const PURPLE_SOFT = '#f5f3ff';
const TEXT_DARK = '#0f172a';
const TEXT_MUTED = '#64748b';
const BORDER = '#e2e8f0';
const GREEN = '#059669';
const ORANGE = '#d97706';
const RED = '#dc2626';
const DEFAULT_HOTEL_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80';
const HERO_IMG = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d, time = '') {
  if (!d && !time) return '—';
  const datePart = d ? fmtDate(d) : '';
  const timePart = time || '';
  return [datePart, timePart].filter(Boolean).join(', ');
}

function fmtIssued(d) {
  if (!d) return fmtDate(new Date());
  const dt = new Date(d);
  return `${fmtDate(dt)}, ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

function starCount(payload = {}) {
  const raw = payload.starRating || payload.category || '5';
  const m = String(raw).match(/(\d)/);
  return m ? Number(m[1]) : 5;
}

function starText(n) {
  return '★'.repeat(Math.min(5, Math.max(1, n))) + '☆'.repeat(Math.max(0, 5 - n));
}

function writePdfToFile(doc, filePath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
    doc.on('error', reject);
  });
}

async function loadImage(src) {
  if (!src) return null;
  try {
    if (src.startsWith('http')) {
      const res = await fetch(src, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    const local = src.startsWith('/') ? path.join(__dirname, '../..', src.replace(/^\//, '')) : src;
    if (fs.existsSync(local)) return local;
  } catch {
    return null;
  }
  return null;
}

function drawPill(doc, text, x, y, { fill = PURPLE, textColor = '#ffffff', width = 130, height = 22, outline = false } = {}) {
  if (outline) {
    doc.save();
    doc.roundedRect(x, y, width, height, 11).strokeColor('#c4b5fd').lineWidth(1).stroke();
    doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold')
      .text(text, x + 8, y + 6, { width: width - 16, align: 'center' });
    doc.restore();
    return;
  }
  doc.save();
  doc.roundedRect(x, y, width, height, 11).fill(fill);
  doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold')
    .text(text, x + 8, y + 6, { width: width - 16, align: 'center' });
  doc.restore();
}

function drawFieldCell(doc, label, value, x, y, w, h = 34) {
  doc.save();
  doc.roundedRect(x, y, w, h, 5).fill('#ffffff').strokeColor(BORDER).lineWidth(0.8).stroke();
  doc.fillColor(TEXT_MUTED).fontSize(6).font('Helvetica-Bold').text(label.toUpperCase(), x + 6, y + 5, { width: w - 12 });
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica-Bold').text(String(value || '—'), x + 6, y + 15, { width: w - 12 });
  doc.restore();
}

function drawCheckBullet(doc, text, x, y, w) {
  doc.circle(x + 5, y + 5, 4).fill(PURPLE);
  doc.fillColor('#ffffff').fontSize(6).font('Helvetica-Bold').text('✓', x + 2.5, y + 1.5);
  doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica').text(text, x + 14, y, { width: w - 16, lineGap: 1 });
  return y + doc.heightOfString(text, { width: w - 16, lineGap: 1 }) + 5;
}

async function generateHotelVoucherPdf(voucher, booking, payload = {}) {
  const safeNum = (voucher.voucherNumber || 'hotel-voucher').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${safeNum}-v${voucher.version || 1}.pdf`;
  const filePath = path.join(path.join(__dirname, '../../uploads/vouchers'), fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const W = doc.page.width;
  const M = 36;
  const contentW = W - M * 2;

  const verifyUrl = voucher.vendorConfirmationUrl
    || `${(branding.websiteUrl || '').replace(/\/$/, '')}/vendor-confirm/${voucher.vendorConfirmationToken || ''}`;
  const qrTarget = verifyUrl.includes('vendor-confirm') ? verifyUrl : `${branding.websiteUrl}/app`;

  const hotelName = payload.hotelName || payload.name || 'Hotel';
  const address = payload.address || payload.location
    || [payload.destination, booking.destination].filter(Boolean).join(', ')
    || '—';
  const stars = starCount(payload);
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Children`;
  const travelRange = `${fmtDate(booking.travelDate)} to ${fmtDate(booking.returnDate)}`;

  // Header
  doc.rect(0, 0, W, 108).fill(PURPLE);
  doc.circle(M + 22, 40, 20).fill('#ffffff');
  doc.fillColor(PURPLE).fontSize(16).font('Helvetica-Bold').text('✈', M + 14, 30);
  doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(branding.brandName, M + 52, 24);
  doc.fontSize(8).font('Helvetica').fillColor('#e9d5ff').text('Journey Beyond Limits', M + 52, 42);
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
    .text('HOTEL VOUCHER', M, 58, { width: contentW, align: 'center' });

  const pillY = 78;
  drawPill(doc, `Voucher ID: ${voucher.voucherNumber}`, M + contentW / 2 - 124, pillY, { width: 118 });
  drawPill(doc, `Booking ID: ${booking.bookingNumber}`, M + contentW / 2 + 6, pillY, {
    width: 108, outline: true, textColor: '#ffffff',
  });
  doc.fillColor('#e9d5ff').fontSize(7.5).font('Helvetica')
    .text(`Issued On: ${fmtIssued(voucher.createdAt || new Date())}`, M, 96, { width: contentW, align: 'center' });

  const heroX = W - M - 118;
  try {
    const heroBuf = await loadImage(HERO_IMG);
    if (heroBuf) {
      doc.save();
      doc.roundedRect(heroX, 14, 118, 72, 8).clip();
      doc.image(heroBuf, heroX, 14, { width: 118, height: 72 });
      doc.restore();
    } else {
      doc.roundedRect(heroX, 14, 118, 72, 8).fill('#4c1d95');
    }
  } catch {
    doc.roundedRect(heroX, 14, 118, 72, 8).fill('#4c1d95');
  }

  try {
    const qrBuffer = await QRCode.toBuffer(qrTarget, { width: 140, margin: 1 });
    doc.roundedRect(heroX + 62, 18, 52, 64, 6).fill('#ffffff');
    doc.image(qrBuffer, heroX + 66, 22, { width: 44, height: 44 });
    doc.fillColor(TEXT_MUTED).fontSize(5).font('Helvetica')
      .text('Scan for Booking Details & Support', heroX + 62, 68, { width: 52, align: 'center' });
  } catch {
    doc.fillColor('#ffffff').fontSize(6).text('QR unavailable', heroX + 62, 40, { width: 52, align: 'center' });
  }

  // Summary strip (4 cols)
  const stripY = 116;
  doc.roundedRect(M, stripY, contentW, 46, 8).fill('#f8fafc').strokeColor(BORDER).lineWidth(0.8).stroke();
  const chips = [
    { label: 'Guest Name', value: booking.customerName },
    { label: 'Destination', value: booking.destination },
    { label: 'Travel Dates', value: travelRange },
    { label: 'Guests', value: guests },
  ];
  const chipW = contentW / chips.length;
  chips.forEach((chip, i) => {
    const x = M + i * chipW + 8;
    doc.fillColor(TEXT_MUTED).fontSize(6.5).font('Helvetica-Bold').text(chip.label.toUpperCase(), x, stripY + 10, { width: chipW - 12 });
    doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica-Bold').text(chip.value || '—', x, stripY + 22, { width: chipW - 12 });
  });

  const bodyY = 172;
  const leftW = contentW * 0.58;
  const rightW = contentW * 0.38;
  const rightX = M + leftW + 12;
  const leftH = 318;

  doc.roundedRect(M, bodyY, leftW, leftH, 10).fill('#ffffff').strokeColor(BORDER).lineWidth(0.8).stroke();
  doc.roundedRect(M, bodyY, leftW, 28, 10).fill(PURPLE_SOFT);
  doc.rect(M, bodyY + 18, leftW, 10).fill(PURPLE_SOFT);
  doc.fillColor(PURPLE).fontSize(9).font('Helvetica-Bold').text('HOTEL DETAILS', M + 12, bodyY + 9);

  // Hotel info card with thumbnail
  const cardY = bodyY + 34;
  const thumbW = 72;
  const thumbH = 54;
  doc.roundedRect(M + 10, cardY, leftW - 20, thumbH + 16, 8).fill('#fafafa').strokeColor(BORDER).lineWidth(0.6).stroke();
  try {
    const thumb = await loadImage(payload.image || DEFAULT_HOTEL_IMG);
    if (thumb) {
      doc.save();
      doc.roundedRect(M + 14, cardY + 8, thumbW, thumbH, 6).clip();
      doc.image(thumb, M + 14, cardY + 8, { width: thumbW, height: thumbH });
      doc.restore();
    } else {
      doc.roundedRect(M + 14, cardY + 8, thumbW, thumbH, 6).fill('#e2e8f0');
    }
  } catch {
    doc.roundedRect(M + 14, cardY + 8, thumbW, thumbH, 6).fill('#e2e8f0');
  }

  const infoX = M + 14 + thumbW + 10;
  const infoW = leftW - 20 - thumbW - 24;
  doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold').text(hotelName, infoX, cardY + 10, { width: infoW });
  doc.fillColor('#f59e0b').fontSize(9).font('Helvetica').text(starText(stars), infoX, cardY + 26);
  doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica').text(address, infoX, cardY + 40, { width: infoW, lineGap: 1 });

  const gridY = cardY + thumbH + 24;
  const colW = (leftW - 36) / 3;
  const fields = [
    ['Room Type', payload.roomType || 'Deluxe'],
    ['Meal Plan', payload.mealPlan || 'Breakfast & Dinner'],
    ['No. of Rooms', `${payload.roomCount || 1} Room`],
    ['Check In', fmtDateTime(payload.checkIn, payload.checkInTime || '02:00 PM')],
    ['Check Out', fmtDateTime(payload.checkOut, payload.checkOutTime || '11:00 AM')],
    ['Guests', guests],
    ['Hotel Contact', payload.hotelPhone || payload.phone || '+91 98765 43210'],
    ['Email', payload.hotelEmail || payload.email || '—'],
    ['Front Office', payload.frontOfficePhone || payload.hotelPhone || '+91 98765 43211'],
  ];

  let gy = gridY;
  for (let i = 0; i < fields.length; i += 3) {
    drawFieldCell(doc, fields[i][0], fields[i][1], M + 10, gy, colW);
    if (fields[i + 1]) drawFieldCell(doc, fields[i + 1][0], fields[i + 1][1], M + 14 + colW, gy, colW);
    if (fields[i + 2]) drawFieldCell(doc, fields[i + 2][0], fields[i + 2][1], M + 18 + colW * 2, gy, colW);
    gy += 40;
  }

  // Right column
  doc.roundedRect(rightX, bodyY, rightW, leftH, 10).fill('#ffffff').strokeColor(BORDER).lineWidth(0.8).stroke();
  doc.fillColor(PURPLE).fontSize(9).font('Helvetica-Bold').text('IMPORTANT NOTES', rightX + 12, bodyY + 10);

  const notes = [
    'Standard check-in time is 2:00 PM and check-out is 11:00 AM unless specified.',
    'Guest must present a valid photo ID at check-in.',
    'Early check-in / late check-out subject to availability.',
    'Any damage to hotel property will be charged to the guest.',
    'Meal plan as per voucher; extras billed directly by hotel.',
    'Smoking only in designated areas (if applicable).',
    'Present this voucher at the hotel front desk.',
  ];
  let ny = bodyY + 26;
  notes.forEach((note) => {
    ny = drawCheckBullet(doc, note, rightX + 10, ny, rightW - 20);
  });

  const emergY = bodyY + leftH - 88;
  doc.roundedRect(rightX + 8, emergY, rightW - 16, 80, 6).fill(PURPLE_SOFT);
  doc.fillColor(PURPLE).fontSize(8).font('Helvetica-Bold').text('EMERGENCY CONTACTS', rightX + 16, emergY + 6);
  const destCity = (booking.destination || '').split(',')[0] || 'Branch';
  const contacts = [
    [`${branding.brandName} Support`, branding.supportPhone || '+91 1800 123 456'],
    ['Operations Manager', payload.opsPhone || booking.executivePhone || '+91 98765 43211'],
    ['Hotel Front Desk', payload.hotelPhone || payload.frontOfficePhone || '+91 98765 43210'],
    [`Local Office (${destCity})`, payload.localOfficePhone || '+91 194 123 4567'],
  ];
  let cy = emergY + 18;
  contacts.forEach(([name, phone]) => {
    doc.fillColor(TEXT_MUTED).fontSize(6).font('Helvetica-Bold').text(name, rightX + 16, cy, { width: rightW - 50 });
    doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica-Bold').text(phone, rightX + rightW - 24, cy, { width: 70, align: 'right' });
    cy += 14;
  });

  // Vendor confirmation
  const vendorY = 502;
  doc.roundedRect(M, vendorY, contentW, 88, 10).fill('#ffffff').strokeColor(BORDER).lineWidth(0.8).stroke();
  doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold').text('VENDOR CONFIRMATION', M + 12, vendorY + 10);
  doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica')
    .text('Please confirm your acceptance by clicking below or scanning the QR code.', M + 12, vendorY + 22, { width: contentW * 0.52 });

  const btnY = vendorY + 38;
  let bx = M + 12;
  [
    { label: 'Accept Booking', color: GREEN },
    { label: 'Request Changes', color: ORANGE },
    { label: 'Reject Booking', color: RED },
  ].forEach((btn) => {
    const bw = 92;
    doc.roundedRect(bx, btnY, bw, 22, 6).fill(btn.color);
    doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(btn.label, bx + 4, btnY + 7, { width: bw - 8, align: 'center' });
    bx += bw + 8;
  });

  if (voucher.vendorConfirmationUrl) {
    doc.roundedRect(M + contentW * 0.55, vendorY + 32, contentW * 0.42, 48, 6).fill(PURPLE_SOFT);
    doc.fillColor(PURPLE).fontSize(7).font('Helvetica-Bold').text('Confirmation Link', M + contentW * 0.55 + 10, vendorY + 40);
    doc.fillColor(TEXT_DARK).fontSize(5.5).font('Helvetica')
      .text(voucher.vendorConfirmationUrl, M + contentW * 0.55 + 10, vendorY + 52, { width: contentW * 0.38, lineBreak: true });
  }

  // Authorization
  const authY = 602;
  doc.moveTo(M + contentW * 0.55, authY + 30).lineTo(M + contentW * 0.55 + 130, authY + 30).strokeColor('#94a3b8').lineWidth(0.8).stroke();
  doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica').text('Authorized Signatory', M + contentW * 0.55, authY + 34);
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica-Bold')
    .text(`${branding.brandName} Pvt. Ltd.`, M + contentW * 0.55, authY + 46);

  const stampX = M + contentW - 76;
  doc.circle(stampX, authY + 24, 28).lineWidth(2).strokeColor(PURPLE);
  doc.fontSize(5.5).fillColor(PURPLE).font('Helvetica-Bold')
    .text('TRAVEL CRM', stampX - 22, authY + 12, { width: 44, align: 'center' });
  doc.fontSize(5).text('PVT. LTD.', stampX - 22, authY + 20, { width: 44, align: 'center' });
  doc.fontSize(5).text('AUTHORIZED', stampX - 22, authY + 30, { width: 44, align: 'center' });

  // Help bar + footer
  const helpY = doc.page.height - 58;
  doc.rect(0, helpY, W, 24).fill(PURPLE_SOFT);
  doc.fillColor(PURPLE).fontSize(8).font('Helvetica-Bold')
    .text('Present this voucher at check-in. For support contact your travel executive.', M, helpY + 8, { width: contentW, align: 'center' });

  const footerY = doc.page.height - 34;
  doc.rect(0, footerY, W, 34).fill('#1e3a8a');
  const phone = branding.supportPhone || '+91 1800 123 456';
  const email = branding.salesEmail || 'support@travelcrm.com';
  const site = (branding.websiteUrl || 'www.travelcrm.com').replace(/^https?:\/\//, '');
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica')
    .text(`Phone: ${phone}   Email: ${email}   Website: ${site}`, M, footerY + 12, { width: contentW * 0.72 });
  doc.text('Thank you for choosing Travel CRM', M, footerY + 12, { width: contentW, align: 'right' });

  await writePdfToFile(doc, filePath);
  const stats = fs.statSync(filePath);
  return {
    filePath,
    fileName,
    fileSize: stats.size,
    pdfUrl: `/uploads/vouchers/${fileName}`,
  };
}

module.exports = {
  generateHotelVoucherPdf,
};
