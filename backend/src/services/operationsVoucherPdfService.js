const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const branding = require('../config/branding');
const { generateCabVoucherPdf } = require('./cabVoucherPdfService');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const VOUCHER_DIR = path.join(UPLOADS_ROOT, 'vouchers');
const TRAVEL_KIT_DIR = path.join(UPLOADS_ROOT, 'travel-kits');

const BRAND_BLUE = '#4f46e5';
const BRAND_PURPLE = '#7c3aed';
const TEXT_DARK = '#0f172a';
const TEXT_MUTED = '#64748b';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtINR(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function writePdfToFile(doc, filePath) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(filePath));
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
    doc.on('error', reject);
  });
}

function drawHeader(doc, title, subtitle) {
  const w = doc.page.width;
  doc.save();
  doc.rect(0, 0, w, 110).fill(BRAND_BLUE);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(branding.brandName, 48, 36, { width: w - 96 });
  doc.fontSize(14).font('Helvetica').text(title, 48, 64, { width: w - 96 });
  if (subtitle) doc.fontSize(10).fillColor('#e0e7ff').text(subtitle, 48, 84, { width: w - 96 });
  doc.restore();
  doc.fillColor(TEXT_DARK);
  doc.y = 130;
}

function drawField(doc, label, value, x, y, width) {
  doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica-Bold').text(label.toUpperCase(), x, y, { width });
  doc.fontSize(11).fillColor(TEXT_DARK).font('Helvetica-Bold').text(String(value || '—'), x, y + 12, { width });
}

function drawSectionTitle(doc, title) {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.fontSize(10).fillColor(BRAND_PURPLE).font('Helvetica-Bold').text(title.toUpperCase(), 48, y);
  doc.moveTo(48, y + 14).lineTo(doc.page.width - 48, y + 14).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.y = y + 24;
}

function drawFooter(doc) {
  const y = doc.page.height - 50;
  doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica')
    .text(`Generated ${fmtDate(new Date())} · ${branding.brandName}`, 48, y, { align: 'center', width: doc.page.width - 96 });
}

async function generateVoucherPdfFile(voucher, booking, payload = {}) {
  const type = voucher.type || 'hotel';

  if (type === 'transport') {
    return generateCabVoucherPdf(voucher, booking, payload);
  }

  const typeLabels = {
    hotel: 'Hotel Voucher',
    transport: 'Cab / Transport Voucher',
    activity: 'Activity Voucher',
    flight: 'Flight Voucher',
    travel_kit: 'Customer Travel Kit',
    master: 'Master Travel Voucher',
  };
  const safeNum = (voucher.voucherNumber || 'voucher').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${safeNum}-v${voucher.version || 1}.pdf`;
  const filePath = path.join(VOUCHER_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  drawHeader(doc, typeLabels[type] || 'Travel Voucher', `Voucher ${voucher.voucherNumber} · Booking ${booking.bookingNumber}`);

  const colW = (doc.page.width - 96) / 2;
  let rowY = doc.y;
  drawField(doc, 'Guest Name', booking.customerName, 48, rowY, colW);
  drawField(doc, 'Destination', booking.destination, 48 + colW + 16, rowY, colW);
  rowY += 44;
  drawField(doc, 'Travel Date', fmtDate(booking.travelDate), 48, rowY, colW);
  drawField(doc, 'Return Date', fmtDate(booking.returnDate), 48 + colW + 16, rowY, colW);
  doc.y = rowY + 52;

  drawSectionTitle(doc, 'Service Details');

  if (type === 'hotel') {
    const h = payload;
    rowY = doc.y;
    drawField(doc, 'Hotel', h.hotelName || h.name, 48, rowY, colW);
    drawField(doc, 'Room Type', h.roomType, 48 + colW + 16, rowY, colW);
    rowY += 44;
    drawField(doc, 'Meal Plan', h.mealPlan || '—', 48, rowY, colW);
    drawField(doc, 'Guests', `${booking.adults || 0} Adults, ${booking.children || 0} Children`, 48 + colW + 16, rowY, colW);
    rowY += 44;
    drawField(doc, 'Check In', fmtDate(h.checkIn), 48, rowY, colW);
    drawField(doc, 'Check Out', fmtDate(h.checkOut), 48 + colW + 16, rowY, colW);
    doc.y = rowY + 44;
  } else if (type === 'transport') {
    // handled by cabVoucherPdfService
  } else if (type === 'activity') {
    const a = payload;
    rowY = doc.y;
    drawField(doc, 'Activity', a.name, 48, rowY, colW * 2);
    rowY += 44;
    drawField(doc, 'Location', a.location || booking.destination, 48, rowY, colW);
    drawField(doc, 'Vendor', a.vendorName, 48 + colW + 16, rowY, colW);
    rowY += 44;
    drawField(doc, 'Date & Time', fmtDate(a.scheduledAt), 48, rowY, colW);
    drawField(doc, 'Amount', fmtINR(a.amount), 48 + colW + 16, rowY, colW);
    doc.y = rowY + 44;
  } else if (type === 'flight') {
    const f = payload;
    rowY = doc.y;
    drawField(doc, 'Airline', f.airline, 48, rowY, colW);
    drawField(doc, 'PNR', f.pnr, 48 + colW + 16, rowY, colW);
    rowY += 44;
    drawField(doc, 'Flight Number', f.flightNumber, 48, rowY, colW);
    drawField(doc, 'Passengers', f.passengers || `${booking.adults || 0} Adults`, 48 + colW + 16, rowY, colW);
    rowY += 44;
    drawField(doc, 'Departure', `${fmtDate(f.departure)} ${f.departureTime || ''}`.trim(), 48, rowY, colW);
    drawField(doc, 'Arrival', `${fmtDate(f.arrival)} ${f.arrivalTime || ''}`.trim(), 48 + colW + 16, rowY, colW);
    doc.y = rowY + 44;
  } else {
    rowY = doc.y;
    drawField(doc, 'Package', booking.packageName || booking.destination, 48, rowY, colW * 2);
    doc.y = rowY + 44;
  }

  if (voucher.vendorConfirmationUrl) {
    doc.moveDown(1);
    doc.fontSize(9).fillColor(TEXT_MUTED).font('Helvetica')
      .text('Vendor confirmation link is included in the digital copy sent to partners.', 48, doc.y, { width: doc.page.width - 96 });
  }

  doc.moveDown(2);
  doc.roundedRect(48, doc.y, doc.page.width - 96, 48, 8).fill('#f5f3ff');
  doc.fillColor(BRAND_PURPLE).fontSize(10).font('Helvetica-Bold')
    .text('Present this voucher at check-in / pickup. For support contact your travel executive.', 60, doc.y + 16, { width: doc.page.width - 120 });

  drawFooter(doc);
  await writePdfToFile(doc, filePath);

  const stats = fs.statSync(filePath);
  return {
    filePath,
    fileName,
    fileSize: stats.size,
    pdfUrl: `/uploads/vouchers/${fileName}`,
  };
}

async function generateTravelKitPdf(voucher, booking) {
  const safeNum = (booking.bookingNumber || 'kit').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `KIT-${safeNum}-v${voucher.version || 1}.pdf`;
  const filePath = path.join(TRAVEL_KIT_DIR, fileName);
  const doc = new PDFDocument({ size: 'A4', margin: 48 });

  // Cover
  const w = doc.page.width;
  doc.rect(0, 0, w, doc.page.height).fill(BRAND_BLUE);
  doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold')
    .text('Your Travel Kit', 48, 180, { align: 'center', width: w - 96 });
  doc.fontSize(16).font('Helvetica')
    .text(booking.customerName, 48, 230, { align: 'center', width: w - 96 });
  doc.fontSize(13).fillColor('#c7d2fe')
    .text(booking.destination, 48, 260, { align: 'center', width: w - 96 });
  doc.text(`${fmtDate(booking.travelDate)} – ${fmtDate(booking.returnDate)}`, 48, 285, { align: 'center', width: w - 96 });
  doc.text(`Booking ${booking.bookingNumber}`, 48, 310, { align: 'center', width: w - 96 });
  doc.text(branding.brandName, 48, doc.page.height - 80, { align: 'center', width: w - 96 });

  // Trip summary
  doc.addPage();
  drawHeader(doc, 'Trip Summary', booking.packageName || booking.destination);
  let rowY = doc.y;
  drawField(doc, 'Travelers', `${booking.adults || 0} Adults, ${booking.children || 0} Children`, 48, rowY, (w - 96) / 2);
  drawField(doc, 'Total Value', fmtINR(booking.totalAmount), 48 + (w - 96) / 2 + 16, rowY, (w - 96) / 2);
  doc.y = rowY + 52;

  const days = booking.itinerary?.length
    ? booking.itinerary
    : [{ day: 1, title: booking.destination, description: 'Itinerary as per booking confirmation.' }];

  drawSectionTitle(doc, 'Day-wise Itinerary');
  days.forEach((d) => {
    if (doc.y > doc.page.height - 120) doc.addPage();
    doc.fontSize(10).fillColor(BRAND_PURPLE).font('Helvetica-Bold').text(`Day ${d.day}: ${d.title || ''}`, 48, doc.y);
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(TEXT_DARK).font('Helvetica').text(d.description || '', 48, doc.y, { width: w - 96 });
    if (d.accommodation) doc.fontSize(8).fillColor(TEXT_MUTED).text(`Stay: ${d.accommodation}`, 48, doc.y + 4);
    doc.moveDown(1.2);
  });

  // Hotels
  if (booking.hotels?.length) {
    doc.addPage();
    drawHeader(doc, 'Hotel Details', 'Accommodation information');
    booking.hotels.forEach((h) => {
      drawSectionTitle(doc, h.hotelName || 'Hotel');
      rowY = doc.y;
      drawField(doc, 'Address', h.destination || h.location || '—', 48, rowY, w - 96);
      rowY += 44;
      drawField(doc, 'Check In', fmtDate(h.checkIn), 48, rowY, (w - 96) / 2);
      drawField(doc, 'Check Out', fmtDate(h.checkOut), 48 + (w - 96) / 2 + 16, rowY, (w - 96) / 2);
      doc.y = rowY + 52;
    });
  }

  // Transport
  if (booking.transport?.length) {
    doc.addPage();
    drawHeader(doc, 'Transport', 'Cab & driver details');
    booking.transport.forEach((t) => {
      drawSectionTitle(doc, (t.vehicleType || 'Cab').replace(/_/g, ' '));
      rowY = doc.y;
      drawField(doc, 'Driver', t.driverName, 48, rowY, (w - 96) / 2);
      drawField(doc, 'Phone', t.driverPhone, 48 + (w - 96) / 2 + 16, rowY, (w - 96) / 2);
      rowY += 44;
      drawField(doc, 'Pickup', t.pickupLocation, 48, rowY, (w - 96) / 2);
      drawField(doc, 'Drop', t.dropLocation, 48 + (w - 96) / 2 + 16, rowY, (w - 96) / 2);
      doc.y = rowY + 52;
    });
  }

  // Emergency
  doc.addPage();
  drawHeader(doc, 'Emergency Contacts', 'Important numbers for your trip');
  rowY = doc.y;
  drawField(doc, 'Support Team', branding.salesEmail, 48, rowY, w - 96);
  rowY += 44;
  const hotelPhone = booking.hotels?.[0]?.phone || 'As per hotel voucher';
  drawField(doc, 'Hotel', hotelPhone, 48, rowY, (w - 96) / 2);
  drawField(doc, 'Driver', booking.transport?.[0]?.driverPhone || 'As per cab voucher', 48 + (w - 96) / 2 + 16, rowY, (w - 96) / 2);

  drawFooter(doc);
  await writePdfToFile(doc, filePath);
  const stats = fs.statSync(filePath);
  return {
    filePath,
    fileName,
    fileSize: stats.size,
    pdfUrl: `/uploads/travel-kits/${fileName}`,
  };
}

function readPdfBuffer(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

module.exports = {
  generateVoucherPdfFile,
  generateTravelKitPdf,
  readPdfBuffer,
  VOUCHER_DIR,
  TRAVEL_KIT_DIR,
};
