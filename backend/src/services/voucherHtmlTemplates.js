const QRCode = require('qrcode');
const branding = require('../config/branding');

const DEFAULT_HOTEL_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
const HERO_IMG = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80';
const CAB_HERO_IMG = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80';

const PRINT_CSS = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 210mm;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
  color: #0f172a;
  background: #fff;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.page {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  overflow: hidden;
}
.header {
  background: #5b21b6;
  color: #fff;
  padding: 14px 18px 12px;
  position: relative;
  min-height: 96px;
}
.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.brand-block { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.logo {
  width: 38px; height: 38px; border-radius: 50%; background: #fff;
  display: flex; align-items: center; justify-content: center;
  color: #5b21b6; font-weight: 900; font-size: 14px; flex-shrink: 0; overflow: hidden;
}
.logo img { width: 100%; height: 100%; object-fit: contain; }
.brand-name { font-size: 13px; font-weight: 800; line-height: 1.2; }
.brand-tag { font-size: 9px; opacity: 0.88; margin-top: 2px; }
.hero-wrap { display: flex; gap: 6px; flex-shrink: 0; }
.hero-img {
  width: 72px; height: 58px; border-radius: 8px; object-fit: cover;
  border: 2px solid rgba(255,255,255,0.25);
}
.qr-box {
  width: 58px; height: 58px; background: #fff; border-radius: 8px;
  padding: 4px; display: flex; flex-direction: column; align-items: center;
}
.qr-box img { width: 42px; height: 42px; display: block; }
.qr-label { font-size: 5px; color: #64748b; text-align: center; line-height: 1.1; margin-top: 2px; }
.title {
  text-align: center; font-size: 17px; font-weight: 900;
  letter-spacing: 0.04em; margin: 8px 0 6px;
}
.pills { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
.pill {
  background: #fff; color: #5b21b6; padding: 3px 10px; border-radius: 999px;
  font-size: 8px; font-weight: 800; white-space: nowrap;
}
.pill.outline { background: transparent; border: 1px solid #c4b5fd; color: #fff; }
.issued { text-align: center; font-size: 8px; opacity: 0.9; margin-top: 4px; }
.strip {
  display: grid; gap: 6px; background: #f8fafc;
  border-bottom: 1px solid #e2e8f0; padding: 10px 14px;
}
.strip.cols-4 { grid-template-columns: repeat(4, 1fr); }
.strip.cols-5 { grid-template-columns: repeat(5, 1fr); }
.strip label {
  display: block; font-size: 7px; color: #64748b; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.03em;
}
.strip p { font-size: 9px; font-weight: 700; margin-top: 2px; line-height: 1.25; word-break: break-word; }
.main {
  display: grid; grid-template-columns: 1.45fr 1fr; gap: 10px;
  padding: 12px 14px;
}
.card {
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px;
  background: #fff; min-width: 0;
}
.card-title {
  font-size: 9px; color: #5b21b6; text-transform: uppercase; font-weight: 800;
  margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #f5f3ff;
}
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.cell {
  border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 7px; background: #fff;
  min-width: 0;
}
.cell label {
  display: block; font-size: 6px; color: #64748b; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.02em;
}
.cell p { font-size: 8px; font-weight: 700; margin-top: 3px; line-height: 1.25; word-break: break-word; }
.hotel-card {
  display: flex; gap: 8px; margin-bottom: 8px; padding: 8px;
  background: #fafafa; border-radius: 8px; border: 1px solid #e2e8f0;
}
.thumb { width: 64px; height: 48px; border-radius: 6px; object-fit: cover; background: #e2e8f0; flex-shrink: 0; }
.hotel-name { font-size: 11px; font-weight: 800; line-height: 1.2; }
.stars { color: #f59e0b; font-size: 10px; margin: 3px 0; letter-spacing: 1px; }
.addr { font-size: 7px; color: #64748b; line-height: 1.3; }
.note {
  font-size: 8px; margin: 5px 0; padding-left: 12px; position: relative; line-height: 1.35;
}
.note::before {
  content: ''; position: absolute; left: 0; top: 2px;
  width: 8px; height: 8px; border-radius: 50%; background: #5b21b6;
}
.note::after {
  content: '\\2713'; position: absolute; left: 1.5px; top: 1px;
  color: #fff; font-size: 6px; font-weight: 800;
}
.itinerary-list { display: flex; flex-direction: column; gap: 6px; }
.itinerary-day {
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 8px; background: #fafafa;
}
.itinerary-day-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 3px;
}
.itinerary-day-num {
  font-size: 8px; font-weight: 800; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.03em;
}
.itinerary-day-date { font-size: 7px; color: #64748b; font-weight: 600; }
.itinerary-day-title { font-size: 9px; font-weight: 800; line-height: 1.25; }
.itinerary-day-places { font-size: 8px; color: #334155; margin-top: 3px; line-height: 1.35; }
.itinerary-day-route { font-size: 7px; color: #64748b; margin-top: 3px; font-weight: 600; }
.main.stack { grid-template-columns: 1fr; }
.main.stack .card { width: 100%; }
.emerg {
  margin-top: 8px; background: #f5f3ff; border-radius: 8px; padding: 8px;
}
.emerg-title { font-size: 8px; font-weight: 800; color: #5b21b6; margin-bottom: 6px; }
.emerg-row {
  display: flex; justify-content: space-between; gap: 6px;
  font-size: 7px; margin: 3px 0; line-height: 1.25;
}
.emerg-row span:first-child { color: #64748b; font-weight: 700; flex: 1; }
.emerg-row span:last-child { font-weight: 700; text-align: right; }
.vendor {
  margin: 0 14px 10px; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 10px 12px; display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;
}
.vendor-left h4 { font-size: 9px; color: #059669; font-weight: 800; margin-bottom: 4px; }
.vendor-left p { font-size: 7px; color: #64748b; line-height: 1.3; margin-bottom: 8px; }
.btns { display: flex; gap: 5px; flex-wrap: wrap; }
.btn {
  padding: 5px 10px; border-radius: 6px; color: #fff; font-size: 7px;
  font-weight: 800; text-decoration: none; display: inline-block;
}
.btn.g { background: #059669; }
.btn.o { background: #d97706; }
.btn.r { background: #dc2626; }
.vendor-link {
  background: #f5f3ff; border-radius: 8px; padding: 8px; max-width: 150px;
}
.vendor-link strong { display: block; font-size: 7px; color: #5b21b6; margin-bottom: 4px; }
.vendor-link span { font-size: 5.5px; color: #334155; word-break: break-all; line-height: 1.3; }
.auth-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  padding: 0 14px 10px; align-items: end;
}
.sign-line { border-top: 1px solid #94a3b8; padding-top: 4px; max-width: 140px; margin-left: auto; }
.sign-label { font-size: 7px; color: #64748b; }
.sign-name { font-size: 8px; font-weight: 800; margin-top: 2px; }
.stamp {
  width: 56px; height: 56px; border: 2px solid #5b21b6; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #5b21b6; font-size: 5px; font-weight: 800; text-align: center;
  line-height: 1.2; margin-left: auto;
}
.help {
  background: #f5f3ff; color: #5b21b6; text-align: center;
  padding: 8px 14px; font-size: 8px; font-weight: 700;
}
.foot {
  background: #1e3a8a; color: #fff; padding: 8px 14px;
  font-size: 7px; display: flex; justify-content: space-between; gap: 8px; align-items: center;
}
.foot span { line-height: 1.3; }
`;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtIssued(d) {
  const dt = d ? new Date(d) : new Date();
  return `${fmtDate(dt)}, ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

function fmtDateTime(d, time = '') {
  if (!d && !time) return '-';
  const datePart = d ? fmtDate(d) : '';
  return [datePart, time].filter(Boolean).join(', ');
}

async function qrDataUrl(target) {
  try {
    return await QRCode.toDataURL(target || branding.websiteUrl, { width: 120, margin: 1 });
  } catch {
    return '';
  }
}

function vendorUrl(voucher) {
  return voucher.vendorConfirmationUrl
    || `${(branding.websiteUrl || '').replace(/\/$/, '')}/vendor-confirm/${voucher.vendorConfirmationToken || ''}`;
}

async function resolveBrand(booking) {
  const { resolveCompanyDocumentBranding } = require('./companyDocumentBrandingService');
  const brand = await resolveCompanyDocumentBranding(booking?.companyId);
  // Prefer executive phone on vouchers when available
  if (booking?.executivePhone) {
    return { ...brand, phone: booking.executivePhone || brand.phone };
  }
  if (!booking?.executivePhone && booking?.lead) {
    try {
      const Lead = require('../models/Lead');
      const User = require('../models/User');
      const lead = await Lead.findById(booking.lead).select('assignedTo').lean();
      if (lead?.assignedTo) {
        const exec = await User.findById(lead.assignedTo).select('phone name').lean();
        if (exec?.phone) {
          booking.executivePhone = exec.phone;
          booking.executiveName = booking.executiveName || exec.name;
          return { ...brand, phone: exec.phone };
        }
      }
    } catch {
      /* ignore */
    }
  }
  return brand;
}

function footerHtml(brand) {
  const phone = brand?.phone || branding.supportPhone || '-';
  const email = brand?.email || branding.salesEmail || '-';
  const site = brand?.website || (branding.websiteUrl || '').replace(/^https?:\/\//, '') || '-';
  const name = brand?.name || branding.brandName;
  return `
    <div class="help">Present this voucher at check-in / pickup. For support contact your travel executive.</div>
    <div class="foot">
      <span>Phone: ${esc(phone)} &nbsp;|&nbsp; Email: ${esc(email)} &nbsp;|&nbsp; Website: ${esc(site)}</span>
      <span>Thank you for choosing ${esc(name)}</span>
    </div>`;
}

function headerHtml({ title, voucher, booking, qrSrc, heroSrc, brand }) {
  const name = brand?.name || branding.brandName;
  const tagline = brand?.tagline || '';
  const logoHtml = brand?.logoSrc
    ? `<div class="logo"><img src="${esc(brand.logoSrc)}" alt="${esc(name)}"/></div>`
    : `<div class="logo">${esc(brand?.initials || (name || 'C').slice(0, 1).toUpperCase())}</div>`;
  const qrBlock = qrSrc
    ? `<div class="qr-box">
          <img src="${qrSrc}" alt="QR"/>
          <div class="qr-label">Scan for Booking Details &amp; Support</div>
        </div>`
    : '';
  return `
  <div class="header">
    <div class="header-top">
      <div class="brand-block">
        ${logoHtml}
        <div>
          <div class="brand-name">${esc(name)}</div>
          ${tagline ? `<div class="brand-tag">${esc(tagline)}</div>` : ''}
        </div>
      </div>
      <div class="hero-wrap">
        <img class="hero-img" src="${esc(heroSrc)}" alt=""/>
        ${qrBlock}
      </div>
    </div>
    <div class="title">${esc(title)}</div>
    <div class="pills">
      <span class="pill">Voucher ID: ${esc(voucher.voucherNumber)}</span>
      <span class="pill outline">Booking ID: ${esc(booking.bookingNumber)}</span>
    </div>
    <div class="issued">Issued On: ${fmtIssued(voucher.createdAt || voucher.issuedAt)}</div>
  </div>`;
}

function vendorBlockHtml(url) {
  if (!url) return '';
  return `
  <div class="vendor">
    <div class="vendor-left">
      <h4>VENDOR CONFIRMATION</h4>
      <p>Please confirm your acceptance by clicking below or scanning the QR code.</p>
      <div class="btns">
        <a class="btn g" href="${esc(url)}&amp;action=accept">Accept Booking</a>
        <a class="btn o" href="${esc(url)}&amp;action=changes">Request Changes</a>
        <a class="btn r" href="${esc(url)}&amp;action=reject">Reject Booking</a>
      </div>
    </div>
    <div class="vendor-link">
      <strong>Confirmation Link</strong>
      <span>${esc(url)}</span>
    </div>
  </div>`;
}

function authBlockHtml(brand) {
  const name = brand?.name || branding.brandName;
  const stamp = brand?.stamp || [String(name).toUpperCase().slice(0, 18), 'AUTHORISED'];
  return `
  <div class="auth-row">
    <div></div>
    <div>
      <div class="sign-line">
        <div class="sign-label">Authorized Signatory</div>
        <div class="sign-name">${esc(name)}</div>
      </div>
      <div class="stamp">
        ${stamp.map((line) => `<div>${esc(line)}</div>`).join('')}
      </div>
    </div>
  </div>`;
}

function vehicleLabel(type = '') {
  const map = {
    sedan: 'Sedan', suv: 'SUV', innova: 'Toyota Innova Crysta',
    tempo_traveller: 'Tempo Traveller', bus: 'Bus', other: 'Vehicle',
  };
  return map[String(type).toLowerCase()] || String(type).replace(/_/g, ' ') || '-';
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

function truncateText(text = '', max = 220) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function resolveCabItinerary(booking = {}, payload = {}) {
  const days = Array.isArray(payload.itinerary) && payload.itinerary.length
    ? payload.itinerary
    : (booking.itinerary || []);
  return days.map((d, i) => {
    const dayNum = d.day || i + 1;
    const places = String(
      d.activities || d.sightseeing || d.activityNotes || d.places || '',
    ).trim();
    const description = truncateText(d.description || '', 200);
    return {
      day: dayNum,
      date: d.date || null,
      title: d.title || `Day ${dayNum}`,
      places: places || description,
      transport: String(d.transport || '').trim(),
    };
  }).filter((d) => d.title || d.places || d.transport);
}

function cabItineraryHtml(rows = []) {
  if (!rows.length) {
    return `<div class="note">Itinerary will be shared by operations if not listed here. Follow pickup &amp; drop as mentioned above.</div>`;
  }
  return `<div class="itinerary-list">${rows.map((d) => `
    <div class="itinerary-day">
      <div class="itinerary-day-head">
        <span class="itinerary-day-num">Day ${esc(d.day)}</span>
        ${d.date ? `<span class="itinerary-day-date">${fmtDate(d.date)}</span>` : ''}
      </div>
      <div class="itinerary-day-title">${esc(d.title)}</div>
      ${d.places ? `<div class="itinerary-day-places"><strong>Places / Sightseeing:</strong> ${esc(d.places)}</div>` : ''}
      ${d.transport ? `<div class="itinerary-day-route">Route: ${esc(d.transport)}</div>` : ''}
    </div>
  `).join('')}</div>`;
}

function cell(label, value) {
  return `<div class="cell"><label>${esc(label)}</label><p>${esc(value || '-')}</p></div>`;
}

async function buildCabVoucherHtml(voucher, booking) {
  const brand = await resolveBrand(booking);
  const p = voucher.payload || booking.transport?.[0] || {};
  const url = vendorUrl(voucher);
  const qrSrc = await qrDataUrl(url.includes('vendor-confirm') ? url : `${brand.websiteUrl || branding.websiteUrl}/app`);
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Child`;
  const showGuestPhone = voucher?.payload?.showGuestPhone !== false
    && booking?.showGuestPhone !== false;
  const customerPhone = showGuestPhone ? (booking.customerPhone || booking.phone || '-') : '';
  const itineraryRows = resolveCabItinerary(booking, p);

  const fields = [
    ['Vehicle Type', vehicleLabel(p.vehicleType)],
    ['Vehicle', vehicleDisplayName(p)],
    ['Vehicle Reg. No.', p.vehicleNumber || p.vehicleName],
    ['Driver Name', p.driverName],
    ['Driver Phone', p.driverPhone],
    ['Vendor', p.vendorName],
    ['Pickup Location', p.pickupLocation || booking.pickup || booking.destination],
    ['Pickup Date & Time', fmtDateTime(p.pickupDate || booking.travelDate, p.pickupTime || p.reportingTime || '09:00 AM')],
    ['Drop Location', p.dropLocation || booking.drop || booking.destination],
    ['Drop Date & Time', fmtDateTime(p.dropDate || booking.returnDate || booking.travelDate, p.dropTime)],
    ['Reporting Time', p.reportingTime || '09:00 AM'],
    ['Trip Type', tripTypeLabel(p)],
  ];

  const gridHtml = [];
  for (let i = 0; i < fields.length; i += 2) {
    gridHtml.push(cell(fields[i][0], fields[i][1]));
    if (fields[i + 1]) gridHtml.push(cell(fields[i + 1][0], fields[i + 1][1]));
  }

  const notes = [
    'This voucher is for the cab driver / vendor — follow pickup, drop and day-wise sightseeing only.',
    'Report at pickup point on time with name placard for the guest.',
    'Cover sightseeing places as listed in the itinerary below (unless operations advise otherwise).',
    'Vehicle is for the mentioned guest & travel dates only.',
    'Inform operations immediately for any delay, breakdown or route change.',
    'Toll, parking & night charges as per actual unless included in package.',
  ];

  const contacts = [
    [`Sales Executive${booking.executiveName ? ` (${booking.executiveName})` : ''}`, booking.executivePhone || brand.phone || '-'],
    [`${brand.name} Support`, brand.phone || '-'],
    ['Operations Manager', p.opsPhone || '-'],
    [`Driver (${p.driverName || 'Assigned'})`, p.driverPhone || '-'],
  ];

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<title>${esc(voucher.voucherNumber)}</title>
<style>${PRINT_CSS}</style>
</head><body>
<div class="page">
  ${headerHtml({ title: 'CAB DRIVER VOUCHER / ITINERARY', voucher, booking, qrSrc, heroSrc: CAB_HERO_IMG, brand })}
  <div class="strip cols-5">
    <div><label>Guest Name</label><p>${esc(booking.customerName)}</p></div>
    ${showGuestPhone ? `<div><label>Guest Phone</label><p>${esc(customerPhone)}</p></div>` : ''}
    <div><label>Destination</label><p>${esc(booking.destination)}</p></div>
    <div><label>Travel Date</label><p>${fmtDate(booking.travelDate)}</p></div>
    <div><label>Travelers</label><p>${guests}</p></div>
  </div>
  <div class="main stack">
    <div class="card">
      <div class="card-title">Pickup · Drop · Vehicle</div>
      <div class="grid-2">${gridHtml.join('')}</div>
    </div>
    <div class="card">
      <div class="card-title">Day-wise Itinerary (Places to Cover)</div>
      ${cabItineraryHtml(itineraryRows)}
    </div>
    <div class="card">
      <div class="card-title">Important Notes for Driver</div>
      ${notes.map((n) => `<div class="note">${esc(n)}</div>`).join('')}
      <div class="emerg">
        <div class="emerg-title">Emergency Contacts</div>
        ${contacts.map(([name, phone]) => `<div class="emerg-row"><span>${esc(name)}</span><span>${esc(phone)}</span></div>`).join('')}
      </div>
    </div>
  </div>
  ${vendorBlockHtml(url)}
  ${authBlockHtml(brand)}
  ${footerHtml(brand)}
</div>
</body></html>`;
}

async function buildHotelVoucherHtml(voucher, booking) {
  const brand = await resolveBrand(booking);
  const hotelIndex = Number(voucher.assignmentIndex ?? 0);
  const p = voucher.payload || booking.hotels?.[hotelIndex] || booking.hotels?.[0] || {};
  const url = vendorUrl(voucher);
  const qrSrc = await qrDataUrl(url.includes('vendor-confirm') ? url : `${brand.websiteUrl || branding.websiteUrl}/app`);
  const hotelName = p.hotelName || p.name || 'Hotel';
  const stars = Number((String(p.starRating || p.category || '5').match(/\d/) || ['5'])[0]);
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Children`;
  const address = p.address || p.location || booking.destination || '-';
  const destCity = (booking.destination || '').split(',')[0] || 'Branch';
  const showGuestPhone = voucher?.payload?.showGuestPhone !== false
    && booking?.showGuestPhone !== false;
  const customerPhone = showGuestPhone ? (booking.customerPhone || booking.phone || '-') : '';

  const fields = [
    ...(p.day ? [['Stay Day', `Day ${p.day}${p.nights ? ` · ${p.nights} Night${p.nights > 1 ? 's' : ''}` : ''}`]] : []),
    ['Room Type', p.roomType || 'Deluxe'],
    ['Meal Plan', p.mealPlan || 'As per booking'],
    ['No. of Rooms', `${p.roomCount || 1} Room`],
    ['Check In', fmtDateTime(p.checkIn, p.checkInTime || '02:00 PM')],
    ['Check Out', fmtDateTime(p.checkOut, p.checkOutTime || '11:00 AM')],
    ['Guests', guests],
    ['Hotel Contact', p.hotelPhone || p.phone || '-'],
    ['Email', p.hotelEmail || p.email || '-'],
    ['Front Office', p.frontOfficePhone || p.hotelPhone || '-'],
  ];

  const notes = [
    'Standard check-in time is 2:00 PM and check-out is 11:00 AM unless specified.',
    'Guest must present a valid photo ID at check-in.',
    'Early check-in / late check-out subject to availability.',
    'Any damage to hotel property will be charged to the guest.',
    'Meal plan as per voucher; extras billed directly by hotel.',
    'Smoking only in designated areas (if applicable).',
    'Present this voucher at the hotel front desk.',
  ];

  const contacts = [
    [`Sales Executive${booking.executiveName ? ` (${booking.executiveName})` : ''}`, booking.executivePhone || brand.phone || '-'],
    [`${brand.name} Support`, brand.phone || '-'],
    ['Operations Manager', p.opsPhone || '-'],
    ['Hotel Front Desk', p.hotelPhone || p.frontOfficePhone || '-'],
    [`Local Office (${destCity})`, p.localOfficePhone || brand.phone || '-'],
  ];

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<title>${esc(voucher.voucherNumber)}</title>
<style>${PRINT_CSS}</style>
</head><body>
<div class="page">
  ${headerHtml({ title: 'HOTEL VOUCHER', voucher, booking, qrSrc, heroSrc: HERO_IMG, brand })}
  <div class="strip cols-5">
    <div><label>Guest Name</label><p>${esc(booking.customerName)}</p></div>
    ${showGuestPhone ? `<div><label>Guest Phone</label><p>${esc(customerPhone)}</p></div>` : ''}
    <div><label>Destination</label><p>${esc(booking.destination)}</p></div>
    <div><label>Travel Dates</label><p>${fmtDate(booking.travelDate)} to ${fmtDate(booking.returnDate)}</p></div>
    <div><label>Guests</label><p>${guests}</p></div>
  </div>
  <div class="main">
    <div class="card">
      <div class="card-title">Hotel Details</div>
      <div class="hotel-card">
        <img class="thumb" src="${esc(p.image || DEFAULT_HOTEL_IMG)}" alt=""/>
        <div>
          <div class="hotel-name">${esc(hotelName)}</div>
          <div class="stars">${'&#9733;'.repeat(Math.min(5, stars))}${'&#9734;'.repeat(Math.max(0, 5 - stars))}</div>
          <div class="addr">${esc(address)}</div>
        </div>
      </div>
      <div class="grid-3">${fields.map(([l, v]) => cell(l, v)).join('')}</div>
    </div>
    <div class="card">
      <div class="card-title">Important Notes</div>
      ${notes.map((n) => `<div class="note">${esc(n)}</div>`).join('')}
      <div class="emerg">
        <div class="emerg-title">Emergency Contacts</div>
        ${contacts.map(([name, phone]) => `<div class="emerg-row"><span>${esc(name)}</span><span>${esc(phone)}</span></div>`).join('')}
      </div>
    </div>
  </div>
  ${vendorBlockHtml(url)}
  ${authBlockHtml(brand)}
  ${footerHtml(brand)}
</div>
</body></html>`;
}

const CLIENT_HERO_IMG = 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=640&q=80';

const CLIENT_PRINT_CSS = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 210mm; margin: 0; padding: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
  color: #1e1b4b; background: #fff;
  -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
}
.cv-page {
  width: 210mm; min-height: 297mm; background: #fff; overflow: hidden;
  display: flex; flex-direction: column;
}
.cv-header {
  background: linear-gradient(135deg, #4c1d95 0%, #5b21b6 55%, #6d28d9 100%);
  color: #fff; padding: 16px 18px 14px; position: relative; overflow: hidden;
}
.cv-header::before {
  content: ''; position: absolute; left: 18%; top: 28%; width: 42%; height: 1px;
  border-top: 1.5px dotted rgba(255,255,255,0.55);
  transform: rotate(-8deg); pointer-events: none;
}
.cv-plane {
  position: absolute; left: 52%; top: 22%; width: 18px; height: 18px;
  opacity: 0.9; pointer-events: none;
}
.cv-header-top {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
  position: relative; z-index: 1;
}
.cv-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cv-logo {
  width: 42px; height: 42px; border-radius: 50%; background: #fff;
  display: flex; align-items: center; justify-content: center;
  color: #5b21b6; font-weight: 900; font-size: 13px; overflow: hidden; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.cv-logo img { width: 100%; height: 100%; object-fit: contain; }
.cv-brand-name { font-size: 14px; font-weight: 800; line-height: 1.15; }
.cv-brand-tag { font-size: 8px; opacity: 0.9; margin-top: 2px; font-weight: 500; }
.cv-hero {
  width: 118px; height: 78px; border-radius: 12px; object-fit: cover; flex-shrink: 0;
  border: 2.5px solid rgba(255,255,255,0.55); box-shadow: 0 4px 14px rgba(0,0,0,0.2);
}
.cv-title {
  text-align: center; margin: 14px 0 10px; position: relative; z-index: 1;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px; font-weight: 700; letter-spacing: 0.06em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}
.cv-pills {
  display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;
  position: relative; z-index: 1;
}
.cv-pill {
  background: #fff; color: #4c1d95; border-radius: 999px;
  padding: 5px 12px; font-size: 8px; font-weight: 800;
  display: inline-flex; align-items: center; gap: 5px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
.cv-pill svg { width: 10px; height: 10px; flex-shrink: 0; }
.cv-strip {
  display: grid; grid-template-columns: repeat(5, 1fr);
  background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  padding: 0;
}
.cv-strip-item {
  padding: 11px 10px; display: flex; align-items: flex-start; gap: 7px;
  border-right: 1px solid #e2e8f0; min-width: 0;
}
.cv-strip-item:last-child { border-right: none; }
.cv-strip-ico {
  width: 22px; height: 22px; border-radius: 50%; background: #f5f3ff;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  color: #5b21b6;
}
.cv-strip-ico svg { width: 12px; height: 12px; }
.cv-strip label {
  display: block; font-size: 6.5px; color: #64748b; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.cv-strip p {
  font-size: 9px; font-weight: 800; margin-top: 2px; line-height: 1.25;
  color: #1e1b4b; word-break: break-word;
}
.cv-body {
  display: grid; grid-template-columns: 1.55fr 1fr; gap: 12px;
  padding: 14px 16px; flex: 1;
}
.cv-panel {
  border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;
  background: #fff; min-width: 0;
}
.cv-panel-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 800; color: #4c1d95;
  text-transform: uppercase; letter-spacing: 0.04em;
  margin-bottom: 10px; padding-bottom: 8px;
  border-bottom: 2px solid #f5f3ff;
}
.cv-panel-title svg { width: 14px; height: 14px; }
.cv-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.cv-tile {
  border: 1px solid #e8e4f5; border-radius: 10px; padding: 8px 9px;
  background: #fafafa; display: flex; gap: 8px; align-items: flex-start; min-width: 0;
}
.cv-tile-ico {
  width: 26px; height: 26px; border-radius: 8px; background: #f5f3ff;
  color: #5b21b6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cv-tile-ico svg { width: 14px; height: 14px; }
.cv-tile label {
  display: block; font-size: 6.5px; color: #64748b; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.03em;
}
.cv-tile p {
  font-size: 8.5px; font-weight: 800; margin-top: 2px; line-height: 1.3;
  color: #1e1b4b; word-break: break-word;
}
.cv-footnote {
  margin-top: 10px; display: flex; gap: 6px; align-items: flex-start;
  font-size: 7.5px; color: #64748b; line-height: 1.4; font-weight: 600;
}
.cv-footnote svg { width: 12px; height: 12px; color: #5b21b6; flex-shrink: 0; margin-top: 1px; }
.cv-amount-box {
  text-align: left; padding: 4px 0 10px;
  border-bottom: 1px solid #f1f5f9; margin-bottom: 10px;
}
.cv-amount-box label {
  display: block; font-size: 7px; color: #64748b; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.cv-amount-value {
  font-size: 26px; font-weight: 900; color: #5b21b6; margin-top: 6px;
  font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
}
.cv-disclaimer {
  display: flex; gap: 6px; align-items: flex-start;
  background: #f5f3ff; border-radius: 8px; padding: 8px 9px;
  font-size: 7px; color: #5b21b6; line-height: 1.4; font-weight: 600;
  margin-bottom: 12px;
}
.cv-disclaimer svg { width: 11px; height: 11px; flex-shrink: 0; margin-top: 1px; }
.cv-help {
  background: #f5f3ff; border-radius: 10px; padding: 10px;
}
.cv-help-title {
  font-size: 9px; font-weight: 800; color: #4c1d95; margin-bottom: 8px;
}
.cv-help-row {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  font-size: 8px; margin: 5px 0; font-weight: 700;
}
.cv-help-row span:first-child { color: #64748b; }
.cv-help-row span:last-child {
  color: #1e1b4b; display: inline-flex; align-items: center; gap: 4px;
}
.cv-help-row svg { width: 10px; height: 10px; color: #5b21b6; }
.cv-bottom {
  margin-top: auto; position: relative; padding: 14px 16px 0;
  background: linear-gradient(180deg, #fff 0%, #faf8ff 100%);
}
.cv-landmarks {
  position: absolute; left: 0; right: 0; bottom: 42px; height: 70px;
  opacity: 0.12; pointer-events: none; overflow: hidden;
}
.cv-landmarks svg { width: 100%; height: 100%; }
.cv-thanks-row {
  display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px;
  align-items: end; position: relative; z-index: 1;
  padding-bottom: 14px;
}
.cv-thanks-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 800; color: #4c1d95; margin-bottom: 4px;
}
.cv-thanks-title svg { width: 16px; height: 16px; }
.cv-thanks-text { font-size: 8px; color: #64748b; line-height: 1.4; max-width: 240px; }
.cv-sign-wrap { text-align: right; }
.cv-sign-label { font-size: 7px; color: #64748b; font-weight: 600; }
.cv-sign-name {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 15px; font-style: italic; font-weight: 700;
  color: #4c1d95; margin: 4px 0 8px;
}
.cv-stamp {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  width: 64px; height: 64px; border-radius: 50%;
  border: 2.5px solid #5b21b6; color: #5b21b6;
  font-size: 5.5px; font-weight: 800; text-align: center; line-height: 1.2;
  margin-left: auto; transform: rotate(-8deg);
  background: rgba(245,243,255,0.6);
}
.cv-stamp strong { font-size: 6.5px; display: block; margin: 2px 0; }
.cv-contact {
  background: #4c1d95; color: #fff; padding: 9px 16px;
  display: flex; justify-content: space-between; gap: 8px; align-items: center;
  font-size: 7.5px; font-weight: 600; position: relative; z-index: 1;
}
.cv-contact span {
  display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
}
.cv-contact svg { width: 10px; height: 10px; opacity: 0.95; flex-shrink: 0; }
`;

function svgIcon(name) {
  const common = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    user: `<svg viewBox="0 0 24 24" ${common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" ${common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92z"/></svg>`,
    map: `<svg viewBox="0 0 24 24" ${common}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    car: `<svg viewBox="0 0 24 24" ${common}><path d="M5 17h14v-5H5v5z"/><path d="M5 12l1.5-4.5h11L19 12"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>`,
    hotel: `<svg viewBox="0 0 24 24" ${common}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" ${common}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    users: `<svg viewBox="0 0 24 24" ${common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    check: `<svg viewBox="0 0 24 24" ${common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    info: `<svg viewBox="0 0 24 24" ${common}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
    rupee: `<svg viewBox="0 0 24 24" ${common}><path d="M6 3h12M6 8h12M6 13l6 8M14 13H6a4 4 0 0 0 0-8"/></svg>`,
    ticket: `<svg viewBox="0 0 24 24" ${common}><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" ${common}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    ribbon: `<svg viewBox="0 0 24 24" ${common}><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" ${common}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" ${common}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    plane: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  };
  return icons[name] || '';
}

function landmarksSvg() {
  return `<svg viewBox="0 0 800 120" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
    <g fill="#5b21b6">
      <path d="M40 110h60V70l-30-35-30 35z"/>
      <rect x="55" y="85" width="12" height="25"/>
      <path d="M130 110h90V55h-20V40h-20v15h-20V40h-20v15h-10z"/>
      <path d="M250 110c20-50 40-70 55-70s35 20 55 70z"/>
      <ellipse cx="305" cy="42" rx="18" ry="8"/>
      <rect x="380" y="50" width="18" height="60"/>
      <rect x="410" y="35" width="22" height="75"/>
      <rect x="445" y="55" width="16" height="55"/>
      <path d="M500 110h100V60c-15-5-25-20-30-35-5 15-15 30-30 35-15-5-25-20-30-35-5 15-15 30-30 35v50h20z"/>
      <path d="M630 110h80V45l-40-30-40 30z"/>
      <circle cx="670" cy="55" r="8"/>
      <path d="M740 110h40V70c-8 0-15-12-20-25-5 13-12 25-20 25z"/>
      <path d="M60 30c8-2 12 6 20 4M200 25c10-3 14 5 22 3M520 22c8-2 12 5 18 3" fill="none" stroke="#5b21b6" stroke-width="2"/>
    </g>
  </svg>`;
}

async function buildClientVoucherHtml(voucher, booking) {
  const brand = await resolveBrand(booking);
  const p = voucher.payload || {};
  const hotels = Array.isArray(p.hotels) ? p.hotels : (booking.hotels || []);
  const transport = Array.isArray(p.transport) ? p.transport : (booking.transport || []);
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Children`;
  const total = Number(booking.totalAmount || p.totalAmount || 0);
  const fmtMoney = (n) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(n) || 0);
  const brandName = brand?.name || branding.brandName;
  const tagline = brand?.tagline || 'Explore the World. Experience India.';
  const logoHtml = brand?.logoSrc
    ? `<div class="cv-logo"><img src="${esc(brand.logoSrc)}" alt="${esc(brandName)}"/></div>`
    : `<div class="cv-logo">${esc(brand?.initials || (brandName || 'C').slice(0, 3).toUpperCase())}</div>`;
  const pickup = booking.pickup || transport[0]?.pickupLocation || '-';
  const drop = booking.drop || transport[0]?.dropLocation || '-';
  const execPhone = booking.executivePhone || brand.phone || '-';
  const supportPhone = brand.phone || branding.supportPhone || execPhone || '-';
  const email = brand.email || branding.salesEmail || '-';
  const site = (brand.website || branding.websiteUrl || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '') || '-';
  const place = brand.address || 'Chandigarh, India';
  const stampLines = brand?.stamp || [String(brandName).toUpperCase().slice(0, 16), 'TRAVEL WITH', 'CONFIDENCE'];

  const bookingTiles = [];
  if (hotels.length) {
    hotels.forEach((h, i) => {
      const line = [h.hotelName || h.name || 'Confirmed', h.roomType || h.category || '', h.destination || '']
        .filter(Boolean).join(' · ');
      bookingTiles.push(`
        <div class="cv-tile">
          <div class="cv-tile-ico">${svgIcon('hotel')}</div>
          <div>
            <label>Hotel ${hotels.length > 1 ? i + 1 : ''}</label>
            <p>${esc(line)}</p>
          </div>
        </div>`);
    });
  } else {
    bookingTiles.push(`
      <div class="cv-tile">
        <div class="cv-tile-ico">${svgIcon('hotel')}</div>
        <div><label>Hotel</label><p>Details will be shared once confirmed</p></div>
      </div>`);
  }

  if (transport.length) {
    transport.forEach((t) => {
      const vehicle = (t.vehicleDisplayName || vehicleLabel(t.vehicleType) || 'Private Cab').toString();
      const status = t.driverName ? `Driver: ${t.driverName}` : 'Confirmed';
      bookingTiles.push(`
        <div class="cv-tile">
          <div class="cv-tile-ico">${svgIcon('car')}</div>
          <div>
            <label>Car (Transfer)</label>
            <p>${esc(vehicle)} · ${esc(status)}</p>
          </div>
        </div>`);
    });
  } else {
    bookingTiles.push(`
      <div class="cv-tile">
        <div class="cv-tile-ico">${svgIcon('car')}</div>
        <div><label>Car (Transfer)</label><p>Private cab · Confirmed</p></div>
      </div>`);
  }

  bookingTiles.push(`
    <div class="cv-tile">
      <div class="cv-tile-ico">${svgIcon('calendar')}</div>
      <div>
        <label>Travel Dates</label>
        <p>${esc(fmtDate(booking.travelDate))} – ${esc(fmtDate(booking.returnDate))}</p>
      </div>
    </div>`);
  bookingTiles.push(`
    <div class="cv-tile">
      <div class="cv-tile-ico">${svgIcon('users')}</div>
      <div>
        <label>Adults</label>
        <p>${esc(guests)}</p>
      </div>
    </div>`);

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<title>${esc(voucher.voucherNumber)} — Client Travel Voucher</title>
<style>${CLIENT_PRINT_CSS}</style>
</head><body>
<div class="cv-page">
  <div class="cv-header">
    <div class="cv-plane">${svgIcon('plane')}</div>
    <div class="cv-header-top">
      <div class="cv-brand">
        ${logoHtml}
        <div>
          <div class="cv-brand-name">${esc(brandName)}</div>
          <div class="cv-brand-tag">${esc(tagline)}</div>
        </div>
      </div>
      <img class="cv-hero" src="${CLIENT_HERO_IMG}" alt=""/>
    </div>
    <div class="cv-title">CLIENT TRAVEL VOUCHER</div>
    <div class="cv-pills">
      <span class="cv-pill">${svgIcon('ticket')} Voucher ID: ${esc(voucher.voucherNumber)}</span>
      <span class="cv-pill">${svgIcon('calendar')} Booking ID: ${esc(booking.bookingNumber)}</span>
      <span class="cv-pill">${svgIcon('clock')} Issued On: ${esc(fmtIssued(voucher.createdAt || voucher.issuedAt))}</span>
    </div>
  </div>

  <div class="cv-strip">
    <div class="cv-strip-item">
      <div class="cv-strip-ico">${svgIcon('user')}</div>
      <div><label>Guest Name</label><p>${esc(booking.customerName || '-')}</p></div>
    </div>
    <div class="cv-strip-item">
      <div class="cv-strip-ico">${svgIcon('phone')}</div>
      <div><label>Phone</label><p>${esc(booking.customerPhone || '-')}</p></div>
    </div>
    <div class="cv-strip-item">
      <div class="cv-strip-ico">${svgIcon('map')}</div>
      <div><label>Destination</label><p>${esc(booking.destination || '-')}</p></div>
    </div>
    <div class="cv-strip-item">
      <div class="cv-strip-ico">${svgIcon('car')}</div>
      <div><label>Pickup</label><p>${esc(pickup)}</p></div>
    </div>
    <div class="cv-strip-item">
      <div class="cv-strip-ico">${svgIcon('map')}</div>
      <div><label>Drop</label><p>${esc(drop)}</p></div>
    </div>
  </div>

  <div class="cv-body">
    <div class="cv-panel">
      <div class="cv-panel-title">${svgIcon('check')} Your Confirmed Bookings</div>
      <div class="cv-grid">${bookingTiles.join('')}</div>
      <div class="cv-footnote">
        ${svgIcon('info')}
        <span>Your hotel and cab are booked with us. Detailed day-wise itinerary is available with your travel executive / operations team.</span>
      </div>
    </div>

    <div>
      <div class="cv-panel" style="margin-bottom:12px">
        <div class="cv-panel-title">${svgIcon('rupee')} Package Amount</div>
        <div class="cv-amount-box">
          <label>Total Package Cost</label>
          <div class="cv-amount-value">${esc(fmtMoney(total))}</div>
        </div>
        <div class="cv-disclaimer">
          ${svgIcon('info')}
          <span>Individual hotel / cab vendor rates are not shown. Only your total package price is listed.</span>
        </div>
      </div>
      <div class="cv-help">
        <div class="cv-help-title">Need Help?</div>
        <div class="cv-help-row">
          <span>Sales Executive</span>
          <span>${svgIcon('phone')} ${esc(execPhone)}</span>
        </div>
        <div class="cv-help-row">
          <span>Support</span>
          <span>${svgIcon('phone')} ${esc(supportPhone)}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="cv-bottom">
    <div class="cv-landmarks">${landmarksSvg()}</div>
    <div class="cv-thanks-row">
      <div>
        <div class="cv-thanks-title">${svgIcon('ribbon')} Thank You!</div>
        <div class="cv-thanks-text">
          We wish you a safe and memorable journey. For any assistance during travel, contact your executive or support line below.
        </div>
      </div>
      <div class="cv-sign-wrap">
        <div class="cv-sign-label">Authorised Signatory</div>
        <div class="cv-sign-name">${esc(brandName)}</div>
        <div class="cv-stamp">
          ${stampLines.map((line) => `<div>${esc(line)}</div>`).join('')}
        </div>
      </div>
    </div>
    <div class="cv-contact">
      <span>${svgIcon('phone')} ${esc(supportPhone)}</span>
      <span>${svgIcon('mail')} ${esc(email)}</span>
      <span>${svgIcon('globe')} ${esc(site)}</span>
      <span>${svgIcon('map')} ${esc(place)}</span>
    </div>
  </div>
</div>
</body></html>`;
}

async function buildVoucherHtml(voucher, booking) {
  const type = voucher.type || 'hotel';
  if (type === 'transport') return buildCabVoucherHtml(voucher, booking);
  if (type === 'hotel') return buildHotelVoucherHtml(voucher, booking);
  if (type === 'client' || type === 'master') return buildClientVoucherHtml(voucher, booking);
  return null;
}

module.exports = {
  buildCabVoucherHtml,
  buildHotelVoucherHtml,
  buildClientVoucherHtml,
  buildVoucherHtml,
  PRINT_CSS,
};
