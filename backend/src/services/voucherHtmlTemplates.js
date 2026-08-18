const QRCode = require('qrcode');
const branding = require('../config/branding');
const { SCENIC_HERO, HOTEL_HERO, esc: shellEsc, svgIcon, brandedTile, brandedHelpBox, wrapBrandedDocument } = require('./brandedDocShell');


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
  padding: 10px 12px;
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

@media print {
  .brand-name { font-size: 16px; }
  .brand-tag { font-size: 11px; }
  .qr-label { font-size: 8px; }
  .title { font-size: 20px; }
  .pill { font-size: 10px; padding: 5px 12px; }
  .issued { font-size: 10px; }
  .strip label { font-size: 9px; }
  .strip p { font-size: 12px; }
  .card-title { font-size: 12px; }
  .cell label { font-size: 9px; }
  .cell p { font-size: 12px; }
  .hotel-name { font-size: 14px; }
  .addr { font-size: 11px; }
  .note { font-size: 11px; line-height: 1.45; }
  .itinerary-day-num { font-size: 10px; }
  .itinerary-day-date { font-size: 10px; }
  .itinerary-day-title { font-size: 12px; }
  .itinerary-day-places { font-size: 11px; }
  .itinerary-day-route { font-size: 10px; }
  .emerg-title { font-size: 11px; }
  .emerg-row { font-size: 11px; }
  .vendor-left h4 { font-size: 12px; }
  .vendor-left p { font-size: 10px; }
  .btn { font-size: 10px; padding: 6px 12px; }
  .vendor-link strong { font-size: 10px; }
  .vendor-link span { font-size: 9px; }
  .sign-label { font-size: 9px; }
  .sign-name { font-size: 11px; }
  .stamp { font-size: 8px; }
  .help { font-size: 11px; }
  .foot { font-size: 10px; }
}
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

const CAB_VOUCHER_CAR_IMG = 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&q=80';

const CAB_BOOKING_VOUCHER_CSS = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 210mm; margin: 0; padding: 0;
  font-family: 'Poppins', 'Segoe UI', system-ui, Arial, sans-serif;
  color: #1a2744; background: #fff;
  -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  -webkit-text-size-adjust: 100%;
}
.emb-page {
  width: 210mm; min-height: 297mm; background: #fff; overflow: hidden;
  position: relative;
}
.emb-page::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.03;
  background: radial-gradient(ellipse at 50% 22%, #94a3b8 0%, transparent 50%);
}
.emb-top {
  display: grid; grid-template-columns: 1.15fr 1.2fr 1fr; gap: 6px;
  padding: 8px 12px 4px; align-items: start; position: relative; z-index: 1;
}
.emb-logo-wrap { display: flex; align-items: center; gap: 7px; }
.emb-logo {
  width: 36px; height: 36px; border-radius: 50%; background: #0b1c36; color: #fff;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  font-weight: 800; font-size: 11px; flex-shrink: 0;
}
.emb-logo img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
.emb-brand-name {
  font-size: 15px; font-weight: 800; color: #0b1c36; line-height: 1.1;
  letter-spacing: 0.01em;
}
.emb-brand-tag { font-size: 8px; color: #64748b; margin-top: 1px; font-weight: 500; }
.emb-title-wrap { text-align: center; padding-top: 2px; }
.emb-title {
  font-size: 17px; font-weight: 900; color: #0b1c36; letter-spacing: 0.05em;
  line-height: 1.1;
}
.emb-stars { color: #e8a017; font-size: 10px; letter-spacing: 2px; margin-top: 2px; }
.emb-id-box {
  background: #0b1c36; color: #fff; border-radius: 0 0 0 14px;
  padding: 8px 10px; margin: -8px -12px 0 0; text-align: right;
}
.emb-id-box .lbl {
  display: block; font-size: 7px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; opacity: 0.75; margin-bottom: 1px;
}
.emb-id-box .id {
  font-size: 12px; font-weight: 800; color: #f0a020; line-height: 1.15;
}
.emb-id-box .date {
  margin-top: 4px; font-size: 8px; font-weight: 600; opacity: 0.95;
  display: flex; align-items: center; justify-content: flex-end; gap: 4px;
}
.emb-hero-row {
  display: grid; grid-template-columns: 1.1fr 1fr 1.1fr; gap: 8px;
  padding: 2px 12px 6px; align-items: center; position: relative; z-index: 1;
}
.emb-pill {
  display: inline-block; background: #0b1c36; color: #fff;
  font-size: 7px; font-weight: 800; letter-spacing: 0.06em;
  padding: 2px 7px; border-radius: 999px; margin-bottom: 3px;
}
.emb-booked-by { font-size: 8px; line-height: 1.35; color: #334155; }
.emb-booked-by strong { display: block; font-size: 11px; color: #0b1c36; margin-bottom: 2px; }
.emb-car-wrap { text-align: center; }
.emb-car {
  width: 100%; max-width: 180px; height: 72px; object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.15));
}
.emb-thanks { text-align: right; }
.emb-thanks-script {
  font-family: 'Great Vibes', 'Segoe Script', 'Brush Script MT', cursive;
  font-size: 22px; color: #1e3a8a; line-height: 1; margin-bottom: 2px;
}
.emb-thanks-text { font-size: 8px; color: #64748b; line-height: 1.3; margin-bottom: 4px; }
.emb-safe-badge {
  display: inline-flex; align-items: center; gap: 4px;
  border: 1px solid #cbd5e1; border-radius: 5px; padding: 3px 7px;
  font-size: 7px; font-weight: 700; color: #0b1c36; background: #fff;
}
.emb-safe-badge span { color: #16a34a; font-size: 8px; }
.emb-grid-3 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 7px;
  padding: 0 12px 6px; position: relative; z-index: 1;
}
.emb-card {
  border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff;
  min-width: 0;
}
.emb-card-h {
  background: #0b1c36; color: #fff; font-size: 9px; font-weight: 800;
  letter-spacing: 0.04em; text-transform: uppercase; padding: 5px 8px;
}
.emb-card-b { padding: 5px 8px; }
.emb-row {
  display: flex; gap: 6px; align-items: flex-start; padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
}
.emb-row:last-child { border-bottom: none; }
.emb-ico {
  width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; background: #eff6ff; color: #1d4ed8; margin-top: 1px;
}
.emb-ico.g { background: #ecfdf5; color: #059669; }
.emb-ico.o { background: #fff7ed; color: #ea580c; }
.emb-ico.p { background: #faf5ff; color: #7c3aed; }
.emb-ico.r { background: #fef2f2; color: #dc2626; }
.emb-row label {
  display: block; font-size: 7px; color: #94a3b8; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.02em;
}
.emb-row p {
  font-size: 10px; font-weight: 700; color: #0b1c36; line-height: 1.25;
  word-break: break-word;
}
.emb-vnum {
  display: inline-block; background: #0b1c36; color: #fff;
  font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 999px;
  letter-spacing: 0.03em;
}
.emb-fare-line {
  display: flex; justify-content: space-between; gap: 6px;
  font-size: 9px; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;
}
.emb-fare-line span:first-child { color: #64748b; font-weight: 600; }
.emb-fare-line span:last-child { font-weight: 700; color: #0b1c36; }
.emb-fare-total {
  margin-top: 4px; background: #0b1c36; color: #fff; border-radius: 6px;
  padding: 6px 8px; display: flex; justify-content: space-between; align-items: center;
}
.emb-fare-total label { font-size: 8px; font-weight: 700; letter-spacing: 0.04em; opacity: 0.85; }
.emb-fare-total p { font-size: 13px; font-weight: 900; }
.emb-fare-adv, .emb-fare-bal {
  margin-top: 4px; border-radius: 6px; padding: 5px 7px;
  display: flex; justify-content: space-between; align-items: center;
}
.emb-fare-adv { background: #ecfdf5; }
.emb-fare-adv label { font-size: 8px; font-weight: 700; color: #047857; }
.emb-fare-adv p { font-size: 11px; font-weight: 900; color: #047857; }
.emb-fare-bal { background: #fff7ed; }
.emb-fare-bal label { font-size: 8px; font-weight: 700; color: #c2410c; }
.emb-fare-bal p { font-size: 11px; font-weight: 900; color: #c2410c; }
.emb-check {
  display: flex; align-items: center; gap: 5px; font-size: 9px;
  font-weight: 600; color: #334155; padding: 2px 0;
}
.emb-check i {
  width: 12px; height: 12px; border-radius: 50%; background: #16a34a; color: #fff;
  font-style: normal; font-size: 7px; font-weight: 900;
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.emb-terms { font-size: 8px; color: #475569; line-height: 1.35; padding-left: 10px; }
.emb-terms li { margin: 2px 0; }
.emb-itinerary {
  margin: 0 12px 6px; border: 1px solid #e2e8f0; border-radius: 8px;
  overflow: hidden; position: relative; z-index: 1;
}
.emb-itinerary-h {
  background: #0b1c36; color: #fff; font-size: 9px; font-weight: 800;
  letter-spacing: 0.04em; text-transform: uppercase; padding: 5px 8px;
}
.emb-itinerary-b { padding: 5px 7px; display: flex; flex-direction: column; gap: 4px; }
.emb-day {
  display: grid; grid-template-columns: 48px 1fr; gap: 6px;
  border: 1px solid #f1f5f9; border-radius: 6px; padding: 5px 7px; background: #fafafa;
}
.emb-day-num {
  background: #fff7ed; color: #c2410c; border-radius: 4px;
  font-size: 8px; font-weight: 900; text-align: center; padding: 4px 2px;
  line-height: 1.2; align-self: start;
}
.emb-day-title { font-size: 10px; font-weight: 800; color: #0b1c36; }
.emb-day-date { font-size: 8px; color: #94a3b8; font-weight: 600; margin-top: 0; }
.emb-day-places { font-size: 9px; color: #475569; margin-top: 2px; line-height: 1.3; }
.emb-empty { font-size: 9px; color: #94a3b8; font-weight: 600; padding: 2px; }
.emb-vendor {
  margin: 0 12px 6px; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 7px 9px; position: relative; z-index: 1;
}
.emb-vendor h4 { font-size: 9px; color: #059669; font-weight: 800; margin-bottom: 2px; }
.emb-vendor p { font-size: 8px; color: #64748b; margin-bottom: 4px; }
.emb-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.emb-btn {
  padding: 4px 9px; border-radius: 5px; color: #fff; font-size: 8px;
  font-weight: 800; text-decoration: none; display: inline-block;
}
.emb-btn.g { background: #059669; }
.emb-btn.o { background: #d97706; }
.emb-btn.r { background: #dc2626; }
.emb-vendor-link { display: none; }
.emb-foot-row {
  display: grid; grid-template-columns: 1.1fr 1.2fr 1fr; gap: 6px;
  padding: 2px 12px 6px; align-items: center;
  position: relative; z-index: 1;
}
.emb-support {
  background: #0b1c36; color: #fff; border-radius: 8px; padding: 7px 9px;
  display: flex; align-items: center; gap: 7px;
}
.emb-support-ico {
  width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;
}
.emb-support .lbl { font-size: 7px; font-weight: 700; letter-spacing: 0.05em; opacity: 0.8; }
.emb-support .num { font-size: 11px; font-weight: 900; margin-top: 1px; }
.emb-wish {
  text-align: center;
  font-family: 'Great Vibes', 'Segoe Script', 'Brush Script MT', cursive;
  font-size: 20px; color: #e08a10; line-height: 1.05;
}
.emb-sign-wrap { text-align: right; display: flex; gap: 6px; justify-content: flex-end; align-items: end; }
.emb-sign { min-width: 90px; }
.emb-sign-script {
  font-family: 'Great Vibes', 'Segoe Script', cursive;
  font-size: 15px; color: #1d4ed8; line-height: 1;
}
.emb-sign-line { border-top: 1px solid #94a3b8; margin-top: 1px; padding-top: 2px; }
.emb-sign-line .n { font-size: 8px; font-weight: 800; color: #0b1c36; }
.emb-sign-line .l { font-size: 7px; color: #64748b; }
.emb-qr { width: 48px; text-align: center; }
.emb-qr img { width: 44px; height: 44px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1px; background: #fff; }
.emb-qr span { display: block; font-size: 6px; color: #64748b; margin-top: 1px; font-weight: 600; }
.emb-bottom-bar {
  background: #0b1c36; color: #fff; padding: 6px 12px;
  display: flex; justify-content: space-between; gap: 8px; align-items: center;
  font-size: 8px; font-weight: 600; position: relative; z-index: 1;
}
.emb-bottom-bar span { opacity: 0.95; }

/* Mobile / WhatsApp / phone browser — readable stacked layout */
@media screen and (max-width: 720px) {
  html, body {
    width: 100% !important;
    max-width: 100vw;
    overflow-x: hidden;
    font-size: 15px;
    background: #f1f5f9;
  }
  .emb-page {
    width: 100% !important;
    min-height: auto !important;
    max-width: 100%;
    border-radius: 0;
  }
  .emb-top {
    grid-template-columns: 1fr !important;
    gap: 10px;
    padding: 14px 14px 8px;
  }
  .emb-logo { width: 48px; height: 48px; font-size: 14px; }
  .emb-brand-name { font-size: 18px; }
  .emb-brand-tag { font-size: 11px; }
  .emb-title-wrap { text-align: left; padding-top: 0; }
  .emb-title { font-size: 18px; letter-spacing: 0.04em; }
  .emb-stars { font-size: 12px; }
  .emb-id-box {
    margin: 0;
    border-radius: 12px;
    text-align: left;
    padding: 12px 14px;
  }
  .emb-id-box .lbl { font-size: 10px; }
  .emb-id-box .id { font-size: 16px; }
  .emb-id-box .date { justify-content: flex-start; font-size: 12px; margin-top: 6px; }
  .emb-hero-row {
    grid-template-columns: 1fr !important;
    gap: 12px;
    padding: 8px 14px 12px;
  }
  .emb-car { max-width: 100%; height: 140px; }
  .emb-thanks { text-align: left; }
  .emb-thanks-script { font-size: 28px; }
  .emb-thanks-text { font-size: 13px; line-height: 1.45; }
  .emb-safe-badge { font-size: 11px; padding: 6px 10px; }
  .emb-pill { font-size: 10px; padding: 4px 10px; }
  .emb-booked-by { font-size: 13px; line-height: 1.45; }
  .emb-booked-by strong { font-size: 15px; }
  .emb-grid-3 {
    grid-template-columns: 1fr !important;
    gap: 10px;
    padding: 0 14px 12px;
  }
  .emb-card { border-radius: 14px; }
  .emb-card-h { font-size: 12px; padding: 10px 12px; }
  .emb-card-b { padding: 10px 12px; }
  .emb-row { gap: 10px; padding: 8px 0; }
  .emb-ico { width: 28px; height: 28px; font-size: 13px; border-radius: 8px; }
  .emb-row label { font-size: 10px; margin-bottom: 2px; }
  .emb-row p { font-size: 14px; line-height: 1.35; }
  .emb-vnum { font-size: 12px; padding: 4px 10px; }
  .emb-fare-line { font-size: 13px; padding: 6px 0; }
  .emb-fare-total { padding: 10px 12px; border-radius: 10px; margin-top: 8px; }
  .emb-fare-total label { font-size: 11px; }
  .emb-fare-total p { font-size: 18px; }
  .emb-fare-adv, .emb-fare-bal { padding: 10px 12px; margin-top: 6px; border-radius: 10px; }
  .emb-fare-adv label, .emb-fare-bal label { font-size: 11px; }
  .emb-fare-adv p, .emb-fare-bal p { font-size: 16px; }
  .emb-check { font-size: 13px; padding: 5px 0; gap: 8px; }
  .emb-check i { width: 16px; height: 16px; font-size: 10px; }
  .emb-terms { font-size: 12px; line-height: 1.45; padding-left: 16px; }
  .emb-terms li { margin: 6px 0; }
  .emb-itinerary { margin: 0 14px 12px; border-radius: 14px; }
  .emb-itinerary-h { font-size: 12px; padding: 10px 12px; }
  .emb-itinerary-b { padding: 10px; gap: 8px; }
  .emb-day {
    grid-template-columns: 56px 1fr;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
  }
  .emb-day-num { font-size: 12px; padding: 8px 4px; }
  .emb-day-title { font-size: 14px; }
  .emb-day-date { font-size: 11px; }
  .emb-day-places { font-size: 13px; line-height: 1.4; margin-top: 4px; }
  .emb-empty { font-size: 13px; padding: 8px; }
  .emb-vendor { margin: 0 14px 12px; padding: 12px; border-radius: 14px; }
  .emb-vendor h4 { font-size: 13px; }
  .emb-vendor p { font-size: 12px; margin-bottom: 8px; }
  .emb-btns { gap: 8px; }
  .emb-btn { font-size: 13px; padding: 10px 14px; border-radius: 8px; }
  .emb-foot-row {
    grid-template-columns: 1fr !important;
    gap: 12px;
    padding: 4px 14px 12px;
  }
  .emb-support { padding: 12px 14px; border-radius: 12px; }
  .emb-support-ico { width: 40px; height: 40px; font-size: 18px; }
  .emb-support .lbl { font-size: 11px; }
  .emb-support .num { font-size: 16px; }
  .emb-wish { font-size: 26px; text-align: left; }
  .emb-sign-wrap {
    justify-content: space-between;
    align-items: flex-end;
  }
  .emb-sign-script { font-size: 20px; }
  .emb-sign-line .n { font-size: 13px; }
  .emb-sign-line .l { font-size: 11px; }
  .emb-qr { width: 72px; }
  .emb-qr img { width: 68px; height: 68px; }
  .emb-qr span { font-size: 10px; }
  .emb-bottom-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 12px 14px;
    font-size: 12px;
  }
}

@media print {
  .emb-brand-name { font-size: 16px; }
  .emb-brand-tag { font-size: 11px; }
  .emb-title { font-size: 18px; }
  .emb-id-box .lbl { font-size: 9px; }
  .emb-id-box .id { font-size: 14px; }
  .emb-id-box .date { font-size: 11px; }
  .emb-thanks-text { font-size: 11px; line-height: 1.4; }
  .emb-safe-badge { font-size: 10px; }
  .emb-booked-by { font-size: 11px; line-height: 1.4; }
  .emb-booked-by strong { font-size: 13px; }
  .emb-card-h { font-size: 12px; }
  .emb-row label { font-size: 9px; }
  .emb-row p { font-size: 12px; }
  .emb-fare-total label { font-size: 10px; }
  .emb-fare-total p { font-size: 16px; }
  .emb-fare-adv label, .emb-fare-bal label { font-size: 10px; }
  .emb-fare-adv p, .emb-fare-bal p { font-size: 13px; }
  .emb-check { font-size: 11px; }
  .emb-terms { font-size: 11px; line-height: 1.45; }
  .emb-itinerary-h { font-size: 12px; }
  .emb-day-num { font-size: 11px; }
  .emb-day-title { font-size: 12px; }
  .emb-day-date { font-size: 10px; }
  .emb-day-places { font-size: 11px; }
  .emb-vendor h4 { font-size: 12px; }
  .emb-vendor p { font-size: 11px; }
  .emb-btn { font-size: 10px; }
  .emb-support .lbl { font-size: 9px; }
  .emb-support .num { font-size: 13px; }
  .emb-wish { font-size: 22px; }
  .emb-sign-line .n { font-size: 11px; }
  .emb-sign-line .l { font-size: 10px; }
  .emb-qr span { font-size: 8px; }
  .emb-bottom-bar { font-size: 10px; padding: 8px 14px; }
}
`;

function embRow(icoClass, icon, label, value, valueHtml = null) {
  return `<div class="emb-row">
    <div class="emb-ico ${icoClass || ''}">${icon}</div>
    <div>
      <label>${escHtml(label)}</label>
      ${valueHtml != null ? valueHtml : `<p>${escHtml(value || '-')}</p>`}
    </div>
  </div>`;
}

async function buildCabVoucherHtml(voucher, booking) {
  const brand = await resolveBrand(booking);
  const transportIndex = Number(voucher.assignmentIndex ?? 0);
  const p = voucher.payload || booking.transport?.[transportIndex] || booking.transport?.[0] || {};
  const url = vendorUrl(voucher);
  const adults = Number(booking.adults || 0);
  const children = Number(booking.children || 0);
  const guests = [
    adults ? `${adults} Adult${adults > 1 ? 's' : ''}` : '',
    children ? `${children} Child${children > 1 ? 'ren' : ''}` : '',
  ].filter(Boolean).join(', ') || '—';
  const showGuestPhone = voucher?.payload?.showGuestPhone !== false && booking?.showGuestPhone !== false;
  const customerPhone = showGuestPhone ? (booking.customerPhone || booking.phone || '-') : 'Hidden';
  const itineraryRows = resolveCabItinerary(booking, p);
  const fmtMoney = (n) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(n) || 0);
  const cabAmount = Number(p.amount || 0);
  const advancePaid = Number(p.advancePaid || 0);
  const remainingBalance = p.remainingBalance != null && p.remainingBalance !== ''
    ? Number(p.remainingBalance)
    : Math.max(0, cabAmount - advancePaid);

  const brandName = brand?.name || branding.brandName || 'Explore My Bharat';
  const tagline = brand?.tagline || 'Discover Incredible India';
  const phone = brand?.phone || branding.supportPhone || '-';
  const email = brand?.email || branding.salesEmail || '-';
  const site = (brand?.website || branding.websiteUrl || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '') || '-';
  const address = brand?.address || [brand?.city, brand?.state].filter(Boolean).join(', ') || 'India';
  const logoHtml = brand?.logoSrc
    ? `<div class="emb-logo"><img src="${escHtml(brand.logoSrc)}" alt="${escHtml(brandName)}"/></div>`
    : `<div class="emb-logo">${escHtml((brand?.initials || brandName).toString().slice(0, 3).toUpperCase())}</div>`;

  const bookingId = voucher.voucherNumber || booking.bookingNumber || '-';
  const bookingDate = fmtIssued(voucher.createdAt || voucher.issuedAt || booking.createdAt);
  const pickupLoc = p.pickupLocation || booking.pickup || booking.destination || '-';
  const dropLoc = p.dropLocation || booking.drop || booking.destination || '-';
  const pickupWhen = fmtDate(p.pickupDate || booking.travelDate);
  const vehicleName = vehicleDisplayName(p);
  const vehicleType = vehicleLabel(p.vehicleType);
  const vehicleNo = p.vehicleNumber || p.vehicleName || '-';
  const distance = p.totalDistance || p.distance || booking.distance || '';
  const duration = p.estimatedDuration || p.duration || '';
  const specialNotes = p.notes || p.specialNotes || booking.specialRequests || 'Follow itinerary as shared by operations.';
  const qrTarget = url || brand?.website || branding.websiteUrl || '';
  const qrSrc = await qrDataUrl(qrTarget);

  const itineraryHtml = itineraryRows.length
    ? itineraryRows.map((d) => `
      <div class="emb-day">
        <div class="emb-day-num">Day ${escHtml(d.day)}</div>
        <div>
          <div class="emb-day-title">${escHtml(d.title)}</div>
          ${d.date ? `<div class="emb-day-date">${fmtDate(d.date)}</div>` : ''}
          ${d.places ? `<div class="emb-day-places"><strong>Places:</strong> ${escHtml(d.places)}</div>` : ''}
          ${d.transport ? `<div class="emb-day-places"><strong>Route:</strong> ${escHtml(d.transport)}</div>` : ''}
        </div>
      </div>`).join('')
    : `<div class="emb-empty">Day-wise itinerary will be shared by operations if not listed here. Follow pickup &amp; drop as mentioned above.</div>`;

  const vendorBlock = url ? `
  <div class="emb-vendor">
    <div>
      <h4>VENDOR CONFIRMATION</h4>
      <p>Please confirm your acceptance by clicking below.</p>
      <div class="emb-btns">
        <a class="emb-btn g" href="${escHtml(url)}&amp;action=accept">Accept Booking</a>
        <a class="emb-btn o" href="${escHtml(url)}&amp;action=changes">Request Changes</a>
        <a class="emb-btn r" href="${escHtml(url)}&amp;action=reject">Reject Booking</a>
      </div>
    </div>
  </div>` : '';

  const inclusions = [
    'Fuel Charges',
    'Driver Allowance',
    'Toll Tax & Parking (as per package)',
    'State Permit (if included)',
    'All Applicable Taxes (as per package)',
  ];

  const terms = [
    'Vehicle is for the mentioned guest & travel dates only.',
    'Waiting charges apply after free waiting time.',
    'Night charges may apply as per company policy.',
    'This is a computer-generated voucher and does not require a physical signature.',
  ];

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Cab Booking Voucher — ${escHtml(brandName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Poppins:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>${CAB_BOOKING_VOUCHER_CSS}</style>
</head><body>
<div class="emb-page">
  <div class="emb-top">
    <div class="emb-logo-wrap">
      ${logoHtml}
      <div>
        <div class="emb-brand-name">${escHtml(brandName)}</div>
        <div class="emb-brand-tag">${escHtml(tagline)}</div>
      </div>
    </div>
    <div class="emb-title-wrap">
      <div class="emb-title">CAB BOOKING VOUCHER</div>
      <div class="emb-stars">★★★★★</div>
    </div>
    <div class="emb-id-box">
      <span class="lbl">Booking ID</span>
      <div class="id">${escHtml(bookingId)}</div>
      <div class="date">📅 ${escHtml(bookingDate)}</div>
    </div>
  </div>

  <div class="emb-hero-row">
    <div>
      <span class="emb-pill">BOOKED BY</span>
      <div class="emb-booked-by">
        <strong>${escHtml(brandName)}</strong>
        ${escHtml(address)}<br/>
        📞 ${escHtml(phone)} · ✉️ ${escHtml(email)}<br/>
        🌐 ${escHtml(site)}
      </div>
    </div>
    <div class="emb-car-wrap">
      <img class="emb-car" src="${CAB_VOUCHER_CAR_IMG}" alt="Cab"/>
    </div>
    <div class="emb-thanks">
      <div class="emb-thanks-script">Thank You!</div>
      <div class="emb-thanks-text">Thank you for choosing ${escHtml(brandName)}. We are delighted to serve you and wish you a comfortable journey.</div>
      <div class="emb-safe-badge"><span>🛡</span> Safe Journey, Happy Journey</div>
    </div>
  </div>

  <div class="emb-grid-3">
    <div class="emb-card">
      <div class="emb-card-h">Journey Details</div>
      <div class="emb-card-b">
        ${embRow('o', '📅', 'Pickup Date', pickupWhen)}
        ${embRow('', '📍', 'Pickup Location', pickupLoc)}
        ${embRow('r', '🏁', 'Drop Location', dropLoc)}
        ${embRow('g', '🛣', 'Total Distance', distance ? String(distance) : 'As per itinerary')}
        ${embRow('p', '⏱', 'Estimated Duration', duration ? String(duration) : 'As per route')}
      </div>
    </div>
    <div class="emb-card">
      <div class="emb-card-h">Vehicle Details</div>
      <div class="emb-card-b">
        ${embRow('', '🚗', 'Vehicle Details', vehicleName)}
        ${embRow('o', '🚙', 'Vehicle Type', vehicleType)}
        ${embRow('p', '🔢', 'Vehicle Number', null, `<p><span class="emb-vnum">${escHtml(vehicleNo)}</span></p>`)}
        ${embRow('g', '👤', 'Driver Name', p.driverName || 'To be assigned')}
        ${embRow('', '📞', 'Driver Contact', p.driverPhone || p.vendorPhone || '-')}
      </div>
    </div>
    <div class="emb-card">
      <div class="emb-card-h">Passenger Details</div>
      <div class="emb-card-b">
        ${embRow('p', '👥', 'Total Passengers', guests)}
        ${embRow('', '👤', 'Lead Passenger Name', booking.customerName || '-')}
        ${embRow('g', '📞', 'Contact Number', customerPhone)}
        ${embRow('o', '⭐', 'Special Notes', specialNotes)}
      </div>
    </div>
  </div>

  <div class="emb-grid-3">
    <div class="emb-card">
      <div class="emb-card-h">Fare Details</div>
      <div class="emb-card-b">
        <div class="emb-fare-line"><span>Base Fare / Cab Price</span><span>${escHtml(fmtMoney(cabAmount))}</span></div>
        <div class="emb-fare-line"><span>Toll / Parking</span><span>As actual</span></div>
        <div class="emb-fare-line"><span>Driver Allowance</span><span>As per package</span></div>
        <div class="emb-fare-total">
          <label>TOTAL AMOUNT</label>
          <p>${escHtml(fmtMoney(cabAmount))}</p>
        </div>
        <div class="emb-fare-adv">
          <label>ADVANCE PAID</label>
          <p>${escHtml(fmtMoney(advancePaid))}</p>
        </div>
        <div class="emb-fare-bal">
          <label>BALANCE / PENDING</label>
          <p>${escHtml(fmtMoney(remainingBalance))}</p>
        </div>
      </div>
    </div>
    <div class="emb-card">
      <div class="emb-card-h">Inclusions</div>
      <div class="emb-card-b">
        ${inclusions.map((item) => `<div class="emb-check"><i>✓</i>${escHtml(item)}</div>`).join('')}
      </div>
    </div>
    <div class="emb-card">
      <div class="emb-card-h">Terms &amp; Conditions</div>
      <div class="emb-card-b">
        <ul class="emb-terms">${terms.map((t) => `<li>${escHtml(t)}</li>`).join('')}</ul>
      </div>
    </div>
  </div>

  <div class="emb-itinerary">
    <div class="emb-itinerary-h">Day-wise Itinerary</div>
    <div class="emb-itinerary-b">${itineraryHtml}</div>
  </div>

  ${vendorBlock}

  ${(() => {
    try {
      const { paymentQrBlockHtml } = require('./paymentQrAsset');
      return paymentQrBlockHtml('Scan QR to Pay');
    } catch {
      return '';
    }
  })()}

  <div class="emb-foot-row">
    <div class="emb-support">
      <div class="emb-support-ico">🎧</div>
      <div>
        <div class="lbl">24/7 SUPPORT</div>
        <div class="num">${escHtml(phone)}</div>
      </div>
    </div>
    <div class="emb-wish">Have a Wonderful Trip!</div>
    <div class="emb-sign-wrap">
      <div class="emb-sign">
        <div class="emb-sign-script">${escHtml(brandName.split(' ').slice(0, 2).join(' '))}</div>
        <div class="emb-sign-line">
          <div class="n">${escHtml(brandName)}</div>
          <div class="l">Authorised Signatory</div>
        </div>
      </div>
      ${qrSrc ? `<div class="emb-qr"><img src="${qrSrc}" alt="QR"/><span>Scan for Support</span></div>` : ''}
    </div>
  </div>

  <div class="emb-bottom-bar">
    <span>🌐 ${escHtml(site)} &nbsp;|&nbsp; ✉️ ${escHtml(email)} &nbsp;|&nbsp; 📞 ${escHtml(phone)}</span>
    <span>Thank you for travelling with ${escHtml(brandName)}!</span>
  </div>
</div>
</body></html>`;
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
  const fmtMoney = (n) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(n) || 0);
  const hotelAmount = Number(p.amount || 0);
  const advancePaid = Number(p.advancePaid || 0);
  const remainingBalance = p.remainingBalance != null && p.remainingBalance !== ''
    ? Number(p.remainingBalance)
    : Math.max(0, hotelAmount - advancePaid);
  const showPayment = hotelAmount > 0 || advancePaid > 0 || remainingBalance > 0;

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
    </div>` : '';

  const stripItems = [
    { icon: 'user', label: 'Guest Name', value: booking.customerName },
    ...(showGuestPhone ? [{ icon: 'phone', label: 'Guest Phone', value: customerPhone }] : []),
    { icon: 'map', label: 'Destination', value: booking.destination },
    { icon: 'calendar', label: 'Travel Dates', value: `${fmtDate(booking.travelDate)} to ${fmtDate(booking.returnDate)}` },
    { icon: 'users', label: 'Guests', value: guests },
  ];

  const paymentBanner = showPayment ? `
  <div class="cv-amount-banner">
    <div class="cv-amount-card package"><label>Hotel Price</label><p>${escHtml(fmtMoney(hotelAmount))}</p></div>
    <div class="cv-amount-card advance"><label>Advance Paid</label><p>${escHtml(fmtMoney(advancePaid))}</p></div>
    <div class="cv-amount-card remaining"><label>Remaining Balance</label><p>${escHtml(fmtMoney(remainingBalance))}</p></div>
  </div>` : '';

  const bodyHtml = `
  ${paymentBanner}
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
  const payloadHotels = Array.isArray(p.hotels) ? p.hotels : [];
  const bookingHotels = Array.isArray(booking.hotels) ? booking.hotels : [];
  const hotels = (payloadHotels.length ? payloadHotels : bookingHotels).map((h, i) => {
    const fromBooking = bookingHotels[i] || {};
    const phone = h.hotelPhone || h.phone || fromBooking.hotelPhone || fromBooking.phone || '';
    return { ...fromBooking, ...h, phone, hotelPhone: phone };
  });
  const transport = Array.isArray(p.transport) ? p.transport : (booking.transport || []);
  const guests = `${booking.adults || 0} Adults, ${booking.children || 0} Children`;
  const total = Number(p.amount ?? p.totalAmount ?? booking.totalAmount ?? 0);
  const advancePaid = Number(p.advancePaid ?? booking.advanceReceived ?? booking.totalPaid ?? 0);
  const remainingBalance = p.remainingBalance != null && p.remainingBalance !== ''
    ? Number(p.remainingBalance)
    : (booking.remainingBalance != null && booking.remainingBalance !== ''
      ? Number(booking.remainingBalance)
      : (booking.pendingAmount != null && booking.pendingAmount !== ''
        ? Number(booking.pendingAmount)
        : Math.max(0, total - advancePaid)));
  const showPayment = total > 0 || advancePaid > 0 || remainingBalance > 0;
  const fmtMoney = (n) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(n) || 0);
  // Lead / booking pick-drop only — no destination fallback, no invented defaults
  const pickup = String(p.pickup || booking.pickup || transport[0]?.pickupLocation || '').trim() || '-';
  const drop = String(p.drop || booking.drop || transport[0]?.dropLocation || '').trim() || '-';
  const execPhone = booking.executivePhone || brand.phone || '-';
  const supportPhone = brand.phone || branding.supportPhone || execPhone || '-';

  const bookingTiles = [];
  const hotelHelpRows = [];
  if (hotels.length) {
    hotels.forEach((h, i) => {
      const label = hotels.length > 1 ? `Hotel ${i + 1}` : 'Hotel';
      const hotelName = h.hotelName || h.name || 'Confirmed';
      const line = [hotelName, h.roomType || h.category || '', h.destination || '']
        .filter(Boolean).join(' · ');
      bookingTiles.push(brandedTile('hotel', label, line));
      const hotelPhone = h.hotelPhone || h.phone || '';
      if (hotelPhone) {
        bookingTiles.push(brandedTile('phone', `${label} Contact`, hotelPhone));
        hotelHelpRows.push([
          hotels.length > 1 ? `${hotelName} Contact` : 'Hotel Contact',
          hotelPhone,
        ]);
      }
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

  const paymentBanner = showPayment ? `
  <div class="cv-amount-banner">
    <div class="cv-amount-card package"><label>Total Package Cost</label><p>${escHtml(fmtMoney(total))}</p></div>
    <div class="cv-amount-card advance"><label>Advance Paid</label><p>${escHtml(fmtMoney(advancePaid))}</p></div>
    <div class="cv-amount-card remaining"><label>Remaining / Pending</label><p>${escHtml(fmtMoney(remainingBalance))}</p></div>
  </div>` : '';

  const bodyHtml = `
  ${paymentBanner}
  <div class="cv-body">
    <div class="cv-panel">
      <div class="cv-panel-title">${svgIcon('check')} Your Confirmed Bookings</div>
      <div class="cv-grid">${bookingTiles.join('')}</div>
      <div class="cv-footnote" style="margin-top:6px">
        ${svgIcon('info')}
        <span>Hotel &amp; cab are confirmed. Present this voucher when requested.</span>
      </div>
    </div>
    <div>
      ${brandedHelpBox([
        ['Sales Executive', execPhone],
        ['Support', supportPhone],
        ...hotelHelpRows,
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
