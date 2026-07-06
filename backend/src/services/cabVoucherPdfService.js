const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const branding = require('../config/branding');

const PURPLE = '#5b21b6';
const PURPLE_LIGHT = '#ede9fe';
const PURPLE_SOFT = '#f5f3ff';
const TEXT_DARK = '#0f172a';
const TEXT_MUTED = '#64748b';
const BORDER = '#e2e8f0';
const GREEN = '#059669';
const ORANGE = '#d97706';
const RED = '#dc2626';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d, time = '') {
  if (!d && !time) return '—';
  const datePart = d ? fmtDate(d) : '';
  const timePart = time || (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');
  return [datePart, timePart].filter(Boolean).join(', ');
}

function vehicleLabel(type = '') {
  const map = {
    sedan: 'Sedan',
    suv: 'SUV',
    innova: 'Toyota Innova Crysta',
    tempo_traveller: 'Tempo Traveller',
    bus: 'Bus',
    other: 'Vehicle',
  };
  return map[String(type).toLowerCase()] || String(type).replace(/_/g, ' ') || '—';
}

function vehicleDisplayName(payload = {}) {
  if (payload.vehicleDisplayName) return payload.vehicleDisplayName;
  const type = payload.vehicleType || '';
  if (type === 'innova') return 'Toyota Innova Crysta (White)';
  if (payload.vehicleName && !/^[A-Z]{2}\d/i.test(payload.vehicleName)) return payload.vehicleName;
  return vehicleLabel(type);
}

function tripTypeLabel(payload = {}) {
  if (payload.tripType) return payload.tripType;
  const pickup = (payload.pickupLocation || '').toLowerCase();
  const drop = (payload.dropLocation || '').toLowerCase();
  if (pickup.includes('airport') || drop.includes('airport')) return 'Airport Transfer';
  return 'Point to Point';
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

function drawPill(doc, text, x, y, { fill = PURPLE, textColor = '#ffffff', width = 130, height = 22 } = {}) {
  doc.save();
  doc.roundedRect(x, y, width, height, 11).fill(fill);
  doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold')
    .text(text, x + 8, y + 6, { width: width - 16, align: 'center' });
  doc.restore();
}

function drawFieldCell(doc, label, value, x, y, w) {
  doc.save();
  doc.roundedRect(x, y, w, 36, 5).fill('#ffffff').strokeColor(BORDER).lineWidth(0.8).stroke();
  doc.fillColor(TEXT_MUTED).fontSize(6.5).font('Helvetica-Bold').text(label.toUpperCase(), x + 7, y + 6, { width: w - 14 });
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica-Bold').text(String(value || '—'), x + 7, y + 17, { width: w - 14 });
  doc.restore();
}

function drawCheckBullet(doc, text, x, y, w) {
  doc.circle(x + 5, y + 5, 4).fill(PURPLE);
  doc.fillColor('#ffffff').fontSize(6).font('Helvetica-Bold').text('✓', x + 2.5, y + 1.5);
  doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(text, x + 14, y, { width: w - 16, lineGap: 1 });
  return y + doc.heightOfString(text, { width: w - 16, lineGap: 1 }) + 6;
}

async function generateCabVoucherPdf(voucher, booking, payload = {}) {
  const safeNum = (voucher.voucherNumber || 'cab-voucher').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${safeNum}-v${voucher.version || 1}.pdf`;
  const filePath = path.join(path.join(__dirname, '../../uploads/vouchers'), fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const W = doc.page.width;
  const M = 36;
  const contentW = W - M * 2;

  const verifyUrl = voucher.vendorConfirmationUrl
    || `${(branding.websiteUrl || '').replace(/\/$/, '')}/vendor-confirm/${voucher.vendorConfirmationToken || ''}`;
  const qrTarget = verifyUrl.includes('vendor-confirm') ? verifyUrl : `${branding.websiteUrl}/app`;

  // ── Header band ──
  doc.rect(0, 0, W, 108).fill(PURPLE);

  // Logo circle
  doc.circle(M + 22, 40, 20).fill('#ffffff');
  doc.fillColor(PURPLE).fontSize(16).font('Helvetica-Bold').text('✈', M + 14, 30);

  doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(branding.brandName, M + 52, 24);
  doc.fontSize(8).font('Helvetica').fillColor('#e9d5ff').text('Journey Beyond Limits', M + 52, 42);

  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
    .text('CAB / TRANSPORT VOUCHER', M, 58, { width: contentW, align: 'center' });

  const pillY = 78;
  const pill1W = 118;
  const pill2W = 108;
  drawPill(doc, `Voucher ID: ${voucher.voucherNumber}`, M + contentW / 2 - pill1W - 6, pillY, { width: pill1W });
  doc.save();
  doc.roundedRect(M + contentW / 2 + 6, pillY, pill2W, 22, 11).strokeColor('#c4b5fd').lineWidth(1).stroke();
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
    .text(`Booking ID: ${booking.bookingNumber}`, M + contentW / 2 + 14, pillY + 6, { width: pill2W - 16 });
  doc.restore();

  doc.fillColor('#e9d5ff').fontSize(7.5).font('Helvetica')
    .text(`Issued On: ${fmtDate(voucher.createdAt || new Date())}`, M, 96, { width: contentW, align: 'center' });

  // Hero panel (right)
  const heroX = W - M - 118;
  const grad = doc.linearGradient(heroX, 14, heroX + 118, 86);
  grad.stop(0, '#7c3aed').stop(1, '#4c1d95');
  doc.roundedRect(heroX, 14, 118, 72, 8).fill(grad);
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold')
    .text('Premium Transport', heroX + 10, 28, { width: 60 });
  doc.fontSize(6).font('Helvetica').fillColor('#ddd6fe')
    .text('Safe · Comfortable · On Time', heroX + 10, 42, { width: 70 });

  try {
    const qrBuffer = await QRCode.toBuffer(qrTarget, { width: 140, margin: 1 });
    doc.roundedRect(heroX + 62, 18, 52, 64, 6).fill('#ffffff');
    doc.image(qrBuffer, heroX + 66, 22, { width: 44, height: 44 });
    doc.fillColor(TEXT_MUTED).fontSize(5).font('Helvetica')
      .text('Scan for Booking Details & Support', heroX + 62, 68, { width: 52, align: 'center' });
  } catch {
    doc.fillColor('#ffffff').fontSize(6).text('QR unavailable', heroX + 62, 40, { width: 52, align: 'center' });
  }

  // ── Summary strip ──
  const stripY = 116;
  doc.roundedRect(M, stripY, contentW, 46, 8).fill('#f8fafc').strokeColor(BORDER).lineWidth(0.8).stroke();
  const chips = [
    { label: 'Guest Name', value: booking.customerName },
    { label: 'Destination', value: booking.destination },
    { label: 'Travel Date', value: fmtDate(booking.travelDate) },
    { label: 'Return Date', value: fmtDate(booking.returnDate) },
    { label: 'Travelers', value: `${booking.adults || 0} Adults, ${booking.children || 0} Child` },
  ];
  const chipW = contentW / chips.length;
  chips.forEach((chip, i) => {
    const x = M + i * chipW + 8;
    doc.fillColor(TEXT_MUTED).fontSize(6.5).font('Helvetica-Bold').text(chip.label.toUpperCase(), x, stripY + 10, { width: chipW - 12 });
    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica-Bold').text(chip.value || '—', x, stripY + 22, { width: chipW - 12 });
  });

  // ── Main two-column body ──
  const bodyY = 172;
  const leftW = contentW * 0.58;
  const rightW = contentW * 0.38;
  const rightX = M + leftW + 12;
  const leftH = 292;

  doc.roundedRect(M, bodyY, leftW, leftH, 10).fill('#ffffff').strokeColor(BORDER).lineWidth(0.8).stroke();
  doc.roundedRect(M, bodyY, leftW, 28, 10).fill(PURPLE_SOFT);
  doc.rect(M, bodyY + 18, leftW, 10).fill(PURPLE_SOFT);
  doc.fillColor(PURPLE).fontSize(9).font('Helvetica-Bold').text('SERVICE DETAILS', M + 12, bodyY + 9);

  const fields = [
    ['Vehicle Type', vehicleLabel(payload.vehicleType)],
    ['Vehicle', vehicleDisplayName(payload)],
    ['Vehicle Reg. No.', payload.vehicleNumber || payload.vehicleName || '—'],
    ['Driver Name', payload.driverName || '—'],
    ['Driver Phone', payload.driverPhone || '—'],
    ['Driver License No.', payload.driverLicense || payload.licenseNumber || 'As per records'],
    ['Pickup Location', payload.pickupLocation || '—'],
    ['Pickup Date & Time', fmtDateTime(payload.pickupDate, payload.pickupTime)],
    ['Drop Location', payload.dropLocation || '—'],
    ['Drop Date & Time', fmtDateTime(payload.dropDate || payload.pickupDate, payload.dropTime)],
    ['Reporting Time', payload.reportingTime || '09:30 AM'],
    ['Trip Type', tripTypeLabel(payload)],
    ['No. of Vehicles', String(payload.vehicleCount || 1)],
  ];

  const colW = (leftW - 36) / 2;
  let fy = bodyY + 34;
  for (let i = 0; i < fields.length; i += 2) {
    drawFieldCell(doc, fields[i][0], fields[i][1], M + 10, fy, colW);
    if (fields[i + 1]) drawFieldCell(doc, fields[i + 1][0], fields[i + 1][1], M + 14 + colW, fy, colW);
    fy += 40;
  }

  // Right column — notes
  doc.roundedRect(rightX, bodyY, rightW, leftH, 10).fill('#ffffff').strokeColor(BORDER).lineWidth(0.8).stroke();
  doc.fillColor(PURPLE).fontSize(9).font('Helvetica-Bold').text('★ Important Notes', rightX + 12, bodyY + 10);

  const notes = [
    'Driver will wait at the arrival gate with a name placard.',
    'Vehicle is available for the mentioned route & reporting time only.',
    'Additional waiting charges may apply after 30 minutes.',
    'Please carry a valid photo ID during travel.',
    'Inform operations 2 hours before for any schedule change.',
    'Toll, parking & night charges as per actual unless included.',
  ];
  let ny = bodyY + 28;
  notes.slice(0, 4).forEach((note) => {
    ny = drawCheckBullet(doc, note, rightX + 10, ny, rightW - 20);
  });

  const emergInnerY = bodyY + leftH - 92;
  doc.roundedRect(rightX + 8, emergInnerY, rightW - 16, 84, 6).fill(PURPLE_SOFT);
  doc.fillColor(PURPLE).fontSize(8).font('Helvetica-Bold').text('Emergency Contacts', rightX + 16, emergInnerY + 6);
  const contacts = [
    [`${branding.brandName} Support`, branding.supportPhone || '+91 1800 123 456'],
    ['Operations Manager', payload.opsPhone || booking.executivePhone || '+91 98765 43211'],
    [`Driver (${payload.driverName || 'Assigned'})`, payload.driverPhone || '—'],
  ];
  let cy = emergInnerY + 18;
  contacts.forEach(([name, phone]) => {
    doc.fillColor(TEXT_MUTED).fontSize(6).font('Helvetica-Bold').text(name, rightX + 16, cy, { width: rightW - 32 });
    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(phone, rightX + 16, cy + 9, { width: rightW - 32 });
    cy += 20;
  });

  // ── Vendor confirmation ──
  const vendorY = 478;
  doc.roundedRect(M, vendorY, contentW, 96, 10).fill('#ffffff').strokeColor(BORDER).lineWidth(0.8).stroke();
  doc.fillColor(PURPLE).fontSize(9).font('Helvetica-Bold').text('VENDOR CONFIRMATION', M + 12, vendorY + 10);
  doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica')
    .text('Please confirm your acceptance by clicking below or scanning the QR code.', M + 12, vendorY + 24, { width: contentW * 0.55 });

  const btnY = vendorY + 42;
  const buttons = [
    { label: 'Accept Booking', color: GREEN },
    { label: 'Request Changes', color: ORANGE },
    { label: 'Reject Booking', color: RED },
  ];
  let bx = M + 12;
  buttons.forEach((btn) => {
    const bw = 92;
    doc.roundedRect(bx, btnY, bw, 24, 6).fill(btn.color);
    doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(btn.label, bx + 4, btnY + 8, { width: bw - 8, align: 'center' });
    bx += bw + 8;
  });

  if (voucher.vendorConfirmationUrl) {
    doc.roundedRect(M + contentW * 0.55, vendorY + 36, contentW * 0.42, 48, 6).fill(PURPLE_SOFT);
    doc.fillColor(PURPLE).fontSize(7).font('Helvetica-Bold').text('Confirmation Link', M + contentW * 0.55 + 10, vendorY + 44);
    doc.fillColor(TEXT_DARK).fontSize(6).font('Helvetica')
      .text(voucher.vendorConfirmationUrl, M + contentW * 0.55 + 10, vendorY + 56, { width: contentW * 0.38, lineBreak: true });
  }

  // ── Authorization ──
  const authY = 586;
  doc.moveTo(M + contentW * 0.55, authY + 36).lineTo(M + contentW * 0.55 + 140, authY + 36).strokeColor('#94a3b8').lineWidth(0.8).stroke();
  doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica').text('Authorized Signatory', M + contentW * 0.55, authY + 40);
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica-Bold')
    .text(`${branding.brandName} Pvt. Ltd.`, M + contentW * 0.55, authY + 52);

  // Stamp
  const stampX = M + contentW - 78;
  doc.circle(stampX, authY + 28, 30).lineWidth(2).strokeColor('#2563eb');
  doc.fontSize(6).fillColor('#2563eb').font('Helvetica-Bold')
    .text('AUTHORIZED', stampX - 24, authY + 16, { width: 48, align: 'center' });
  doc.fontSize(5).text(branding.brandName, stampX - 24, authY + 26, { width: 48, align: 'center' });
  doc.fontSize(5).text('Pvt. Ltd.', stampX - 24, authY + 34, { width: 48, align: 'center' });

  // ── Footer ──
  const footerY = doc.page.height - 34;
  doc.rect(0, footerY, W, 34).fill(PURPLE);
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
  generateCabVoucherPdf,
};
