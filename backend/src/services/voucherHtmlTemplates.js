const QRCode = require('qrcode');
const branding = require('../config/branding');
const { SCENIC_HERO, HOTEL_HERO, CAB_HERO, esc: shellEsc, svgIcon, brandedTile, brandedHelpBox, wrapBrandedDocument } = require('./brandedDocShell');


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

const escHtml = (...args) => (typeof esc === 'function' ? esc(...args) : shellEsc(...args));

async function buildCabVoucherHtml(voucher, booking) {
  const brand = await resolveBrand(booking);
  const p = voucher.payload || booking.transport?.[0] || {};
  const url = vendorUrl(voucher);
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Child`;
  const showGuestPhone = voucher?.payload?.showGuestPhone !== false && booking?.showGuestPhone !== false;
  const customerPhone = showGuestPhone ? (booking.customerPhone || booking.phone || '-') : '';
  const itineraryRows = resolveCabItinerary(booking, p);

  const detailTiles = [
    brandedTile('car', 'Vehicle Type', vehicleLabel(p.vehicleType)),
    brandedTile('car', 'Vehicle', vehicleDisplayName(p)),
    brandedTile('ticket', 'Vehicle Reg. No.', p.vehicleNumber || p.vehicleName || '-'),
    brandedTile('user', 'Driver Name', p.driverName || '-'),
    brandedTile('phone', 'Driver Phone', p.driverPhone || '-'),
    brandedTile('users', 'Vendor', p.vendorName || '-'),
    brandedTile('map', 'Pickup Location', p.pickupLocation || booking.pickup || booking.destination || '-'),
    brandedTile('calendar', 'Pickup Date & Time', fmtDateTime(p.pickupDate || booking.travelDate, p.pickupTime || p.reportingTime || '09:00 AM')),
    brandedTile('map', 'Drop Location', p.dropLocation || booking.drop || booking.destination || '-'),
    brandedTile('calendar', 'Drop Date & Time', fmtDateTime(p.dropDate || booking.returnDate || booking.travelDate, p.dropTime)),
    brandedTile('clock', 'Reporting Time', p.reportingTime || '09:00 AM'),
    brandedTile('info', 'Trip Type', tripTypeLabel(p)),
  ].join('');

  const notes = [
    'This voucher is for the cab driver / vendor — follow pickup, drop and day-wise sightseeing only.',
    'Report at pickup point on time with name placard for the guest.',
    'Cover sightseeing places as listed in the itinerary below (unless operations advise otherwise).',
    'Vehicle is for the mentioned guest & travel dates only.',
    'Inform operations immediately for any delay, breakdown or route change.',
    'Toll, parking & night charges as per actual unless included in package.',
  ];

  const itineraryHtml = itineraryRows.length
    ? `<div class="cv-itinerary-list">${itineraryRows.map((d) => `
        <div class="cv-itinerary-day">
          <div class="cv-itinerary-head">
            <span class="cv-itinerary-num">Day ${escHtml(d.day)}</span>
            ${d.date ? `<span class="cv-itinerary-date">${fmtDate(d.date)}</span>` : ''}
          </div>
          <div class="cv-itinerary-title">${escHtml(d.title)}</div>
          ${d.places ? `<div class="cv-itinerary-places"><strong>Places:</strong> ${escHtml(d.places)}</div>` : ''}
        </div>`).join('')}</div>`
    : `<div class="cv-footnote">${svgIcon('info')}<span>Itinerary will be shared by operations if not listed here.</span></div>`;

  const vendorBlock = url ? `
    <div class="cv-vendor">
      <div>
        <h4>VENDOR CONFIRMATION</h4>
        <p>Please confirm your acceptance by clicking below.</p>
        <div class="cv-btns">
          <a class="cv-btn g" href="${escHtml(url)}&amp;action=accept">Accept Booking</a>
          <a class="cv-btn o" href="${escHtml(url)}&amp;action=changes">Request Changes</a>
          <a class="cv-btn r" href="${escHtml(url)}&amp;action=reject">Reject Booking</a>
        </div>
      </div>
      <div class="cv-vendor-link"><strong>Confirmation Link</strong><span>${escHtml(url)}</span></div>
    </div>` : '';

  const stripItems = [
    { icon: 'user', label: 'Guest Name', value: booking.customerName },
    ...(showGuestPhone ? [{ icon: 'phone', label: 'Guest Phone', value: customerPhone }] : []),
    { icon: 'map', label: 'Destination', value: booking.destination },
    { icon: 'calendar', label: 'Travel Date', value: fmtDate(booking.travelDate) },
    { icon: 'users', label: 'Travelers', value: guests },
  ];

  const bodyHtml = `
  <div class="cv-body stack-gap">
    <div class="cv-panel">
      <div class="cv-panel-title">${svgIcon('car')} Pickup · Drop · Vehicle</div>
      <div class="cv-grid">${detailTiles}</div>
    </div>
    <div class="cv-panel">
      <div class="cv-panel-title">${svgIcon('calendar')} Day-wise Itinerary</div>
      ${itineraryHtml}
    </div>
    <div class="cv-body" style="padding:0;gap:12px">
      <div class="cv-panel">
        <div class="cv-panel-title">${svgIcon('info')} Important Notes for Driver</div>
        <div class="cv-note-list">${notes.map((n) => `<div class="cv-note-item">${escHtml(n)}</div>`).join('')}</div>
      </div>
      ${brandedHelpBox([
        [`Sales Executive${booking.executiveName ? ` (${booking.executiveName})` : ''}`, booking.executivePhone || brand.phone || '-'],
        [`${brand.name || 'Company'} Support`, brand.phone || '-'],
        ['Operations Manager', p.opsPhone || '-'],
        [`Driver (${p.driverName || 'Assigned'})`, p.driverPhone || '-'],
      ])}
    </div>
  </div>
  ${vendorBlock}`;

  return wrapBrandedDocument({
    title: 'CAB DRIVER VOUCHER / ITINERARY',
    brand,
    heroSrc: CAB_HERO,
    pills: [
      { icon: 'ticket', text: `Voucher ID: ${voucher.voucherNumber}` },
      { icon: 'calendar', text: `Booking ID: ${booking.bookingNumber}` },
      { icon: 'clock', text: `Issued On: ${fmtIssued(voucher.createdAt || voucher.issuedAt)}` },
    ],
    stripItems,
    stripCols: stripItems.length >= 5 ? 5 : 4,
    bodyHtml,
    thanksText: 'Present this cab voucher at pickup. Follow the itinerary and contact operations for any route changes.',
  });
}

async function buildHotelVoucherHtml(voucher, booking) {
  const brand = await resolveBrand(booking);
  const hotelIndex = Number(voucher.assignmentIndex ?? 0);
  const p = voucher.payload || booking.hotels?.[hotelIndex] || booking.hotels?.[0] || {};
  const url = vendorUrl(voucher);
  const hotelName = p.hotelName || p.name || 'Hotel';
  const stars = Number((String(p.starRating || p.category || '5').match(/\d/) || ['5'])[0]);
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Children`;
  const address = p.address || p.location || booking.destination || '-';
  const destCity = (booking.destination || '').split(',')[0] || 'Branch';
  const showGuestPhone = voucher?.payload?.showGuestPhone !== false && booking?.showGuestPhone !== false;
  const customerPhone = showGuestPhone ? (booking.customerPhone || booking.phone || '-') : '';

  const fields = [
    ...(p.day ? [['calendar', 'Stay Day', `Day ${p.day}${p.nights ? ` · ${p.nights} Night${p.nights > 1 ? 's' : ''}` : ''}`]] : []),
    ['hotel', 'Room Type', p.roomType || 'Deluxe'],
    ['info', 'Meal Plan', p.mealPlan || 'As per booking'],
    ['hotel', 'No. of Rooms', `${p.roomCount || 1} Room`],
    ['calendar', 'Check In', fmtDateTime(p.checkIn, p.checkInTime || '02:00 PM')],
    ['calendar', 'Check Out', fmtDateTime(p.checkOut, p.checkOutTime || '11:00 AM')],
    ['users', 'Guests', guests],
    ['phone', 'Hotel Contact', p.hotelPhone || p.phone || '-'],
    ['mail', 'Email', p.hotelEmail || p.email || '-'],
    ['phone', 'Front Office', p.frontOfficePhone || p.hotelPhone || '-'],
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

  const vendorBlock = url ? `
    <div class="cv-vendor">
      <div>
        <h4>VENDOR CONFIRMATION</h4>
        <p>Please confirm your acceptance by clicking below.</p>
        <div class="cv-btns">
          <a class="cv-btn g" href="${escHtml(url)}&amp;action=accept">Accept Booking</a>
          <a class="cv-btn o" href="${escHtml(url)}&amp;action=changes">Request Changes</a>
          <a class="cv-btn r" href="${escHtml(url)}&amp;action=reject">Reject Booking</a>
        </div>
      </div>
      <div class="cv-vendor-link"><strong>Confirmation Link</strong><span>${escHtml(url)}</span></div>
    </div>` : '';

  const stripItems = [
    { icon: 'user', label: 'Guest Name', value: booking.customerName },
    ...(showGuestPhone ? [{ icon: 'phone', label: 'Guest Phone', value: customerPhone }] : []),
    { icon: 'map', label: 'Destination', value: booking.destination },
    { icon: 'calendar', label: 'Travel Dates', value: `${fmtDate(booking.travelDate)} to ${fmtDate(booking.returnDate)}` },
    { icon: 'users', label: 'Guests', value: guests },
  ];

  const bodyHtml = `
  <div class="cv-body">
    <div class="cv-panel">
      <div class="cv-panel-title">${svgIcon('hotel')} Hotel Details</div>
      <div class="cv-hotel-card">
        <img src="${escHtml(p.image || DEFAULT_HOTEL_IMG)}" alt=""/>
        <div>
          <div class="cv-hotel-name">${escHtml(hotelName)}</div>
          <div class="cv-hotel-stars">${'★'.repeat(Math.min(5, stars))}${'☆'.repeat(Math.max(0, 5 - stars))}</div>
          <div class="cv-hotel-addr">${escHtml(address)}</div>
        </div>
      </div>
      <div class="cv-grid">${fields.map(([ico, label, value]) => brandedTile(ico, label, value)).join('')}</div>
    </div>
    <div>
      <div class="cv-panel" style="margin-bottom:12px">
        <div class="cv-panel-title">${svgIcon('info')} Important Notes</div>
        <div class="cv-note-list">${notes.map((n) => `<div class="cv-note-item">${escHtml(n)}</div>`).join('')}</div>
      </div>
      ${brandedHelpBox([
        [`Sales Executive${booking.executiveName ? ` (${booking.executiveName})` : ''}`, booking.executivePhone || brand.phone || '-'],
        [`${brand.name || 'Company'} Support`, brand.phone || '-'],
        ['Operations Manager', p.opsPhone || '-'],
        ['Hotel Front Desk', p.hotelPhone || p.frontOfficePhone || '-'],
        [`Local Office (${destCity})`, p.localOfficePhone || brand.phone || '-'],
      ])}
    </div>
  </div>
  ${vendorBlock}`;

  return wrapBrandedDocument({
    title: 'HOTEL VOUCHER',
    brand,
    heroSrc: HOTEL_HERO,
    pills: [
      { icon: 'ticket', text: `Voucher ID: ${voucher.voucherNumber}` },
      { icon: 'calendar', text: `Booking ID: ${booking.bookingNumber}` },
      { icon: 'clock', text: `Issued On: ${fmtIssued(voucher.createdAt || voucher.issuedAt)}` },
    ],
    stripItems,
    stripCols: stripItems.length >= 5 ? 5 : 4,
    bodyHtml,
    thanksText: 'Present this hotel voucher at the front desk with a valid photo ID at check-in.',
  });
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
  const pickup = booking.pickup || transport[0]?.pickupLocation || '-';
  const drop = booking.drop || transport[0]?.dropLocation || '-';
  const execPhone = booking.executivePhone || brand.phone || '-';
  const supportPhone = brand.phone || branding.supportPhone || execPhone || '-';

  const bookingTiles = [];
  if (hotels.length) {
    hotels.forEach((h, i) => {
      const line = [h.hotelName || h.name || 'Confirmed', h.roomType || h.category || '', h.destination || '']
        .filter(Boolean).join(' · ');
      bookingTiles.push(brandedTile('hotel', `Hotel ${hotels.length > 1 ? i + 1 : ''}`, line));
    });
  } else {
    bookingTiles.push(brandedTile('hotel', 'Hotel', 'Details will be shared once confirmed'));
  }
  if (transport.length) {
    transport.forEach((t) => {
      const vehicle = (t.vehicleDisplayName || vehicleLabel(t.vehicleType) || 'Private Cab').toString();
      const status = t.driverName ? `Driver: ${t.driverName}` : 'Confirmed';
      bookingTiles.push(brandedTile('car', 'Car (Transfer)', `${vehicle} · ${status}`));
    });
  } else {
    bookingTiles.push(brandedTile('car', 'Car (Transfer)', 'Private cab · Confirmed'));
  }
  bookingTiles.push(brandedTile('calendar', 'Travel Dates', `${fmtDate(booking.travelDate)} – ${fmtDate(booking.returnDate)}`));
  bookingTiles.push(brandedTile('users', 'Adults', guests));

  const bodyHtml = `
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
          <div class="cv-amount-value">${escHtml(fmtMoney(total))}</div>
        </div>
        <div class="cv-disclaimer">
          ${svgIcon('info')}
          <span>Individual hotel / cab vendor rates are not shown. Only your total package price is listed.</span>
        </div>
      </div>
      ${brandedHelpBox([
        ['Sales Executive', execPhone],
        ['Support', supportPhone],
      ])}
    </div>
  </div>`;

  return wrapBrandedDocument({
    title: 'CLIENT TRAVEL VOUCHER',
    brand,
    heroSrc: SCENIC_HERO,
    pills: [
      { icon: 'ticket', text: `Voucher ID: ${voucher.voucherNumber}` },
      { icon: 'calendar', text: `Booking ID: ${booking.bookingNumber}` },
      { icon: 'clock', text: `Issued On: ${fmtIssued(voucher.createdAt || voucher.issuedAt)}` },
    ],
    stripItems: [
      { icon: 'user', label: 'Guest Name', value: booking.customerName },
      { icon: 'phone', label: 'Phone', value: booking.customerPhone || '-' },
      { icon: 'map', label: 'Destination', value: booking.destination },
      { icon: 'car', label: 'Pickup', value: pickup },
      { icon: 'map', label: 'Drop', value: drop },
    ],
    stripCols: 5,
    bodyHtml,
  });
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
