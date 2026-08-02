/**
 * Shared branded PDF shell used by client / hotel / cab vouchers and payment receipts.
 */
const branding = require('../config/branding');

const SCENIC_HERO = 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=640&q=80';
const HOTEL_HERO = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&q=80';
const CAB_HERO = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=640&q=80';

const BRANDED_DOC_CSS = `
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
}
.cv-header {
  background: linear-gradient(135deg, #4c1d95 0%, #5b21b6 55%, #6d28d9 100%);
  color: #fff; padding: 10px 14px 10px; position: relative; overflow: hidden;
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
  width: 96px; height: 64px; border-radius: 10px; object-fit: cover; flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.55); box-shadow: 0 3px 10px rgba(0,0,0,0.18);
}
.cv-title {
  text-align: center; margin: 8px 0 6px; position: relative; z-index: 1;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 17px; font-weight: 700; letter-spacing: 0.05em;
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
  display: grid; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0;
}
.cv-strip.cols-4 { grid-template-columns: repeat(4, 1fr); }
.cv-strip.cols-5 { grid-template-columns: repeat(5, 1fr); }
.cv-strip.cols-6 { grid-template-columns: repeat(6, 1fr); }
.cv-strip-item {
  padding: 7px 8px; display: flex; align-items: flex-start; gap: 6px;
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
  display: grid; grid-template-columns: 1.55fr 1fr; gap: 8px;
  padding: 8px 12px; flex: 0 0 auto;
}
.cv-body.stack { grid-template-columns: 1fr; }
.cv-body.stack-gap { display: flex; flex-direction: column; gap: 8px; padding: 8px 12px; flex: 0 0 auto; }
.cv-panel {
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px;
  background: #fff; min-width: 0;
}
.cv-panel-title {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 800; color: #4c1d95;
  text-transform: uppercase; letter-spacing: 0.03em;
  margin-bottom: 6px; padding-bottom: 5px;
  border-bottom: 2px solid #f5f3ff;
}
.cv-panel-title svg { width: 14px; height: 14px; }
.cv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.cv-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.cv-tile {
  border: 1px solid #e8e4f5; border-radius: 8px; padding: 5px 7px;
  background: #fafafa; display: flex; gap: 6px; align-items: flex-start; min-width: 0;
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
.cv-hotel-card {
  display: flex; gap: 10px; margin-bottom: 10px; padding: 10px;
  background: #fafafa; border: 1px solid #e8e4f5; border-radius: 10px;
}
.cv-hotel-card img {
  width: 88px; height: 66px; border-radius: 8px; object-fit: cover; flex-shrink: 0;
}
.cv-hotel-name { font-size: 12px; font-weight: 800; color: #1e1b4b; }
.cv-hotel-stars { color: #f59e0b; font-size: 11px; margin: 3px 0; letter-spacing: 1px; }
.cv-hotel-addr { font-size: 8px; color: #64748b; line-height: 1.35; }
.cv-note-list { display: flex; flex-direction: column; gap: 5px; }
.cv-note-item {
  font-size: 7.5px; line-height: 1.35; color: #334155; font-weight: 600;
  padding-left: 14px; position: relative;
}
.cv-note-item::before {
  content: ''; position: absolute; left: 0; top: 2px;
  width: 8px; height: 8px; border-radius: 50%; background: #5b21b6;
}
.cv-note-item::after {
  content: '\\2713'; position: absolute; left: 1.5px; top: 1px;
  color: #fff; font-size: 6px; font-weight: 800;
}
.cv-itinerary-list { display: flex; flex-direction: column; gap: 3px; }
.cv-itinerary-day {
  border: 1px solid #e8e4f5; border-radius: 6px; padding: 4px 6px; background: #fafafa;
}
.cv-itinerary-head {
  display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px;
}
.cv-itinerary-num {
  font-size: 8px; font-weight: 800; color: #5b21b6; text-transform: uppercase;
}
.cv-itinerary-date { font-size: 7px; color: #64748b; font-weight: 600; }
.cv-itinerary-title { font-size: 9px; font-weight: 800; }
.cv-itinerary-places { font-size: 8px; color: #334155; margin-top: 3px; line-height: 1.35; }
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
  font-size: 20px; font-weight: 900; color: #5b21b6; margin-top: 3px;
  font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
}
.cv-amount-banner {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;
  padding: 8px 12px 0;
}
.cv-amount-card {
  border: 1px solid #e8e4f5; border-radius: 8px; padding: 6px; text-align: center; background: #fff;
}
.cv-amount-card.package { background: #f5f3ff; }
.cv-amount-card.advance { background: #ecfdf5; border-color: #a7f3d0; }
.cv-amount-card.remaining { background: #fff7ed; border-color: #fed7aa; }
.cv-amount-card label {
  display: block; font-size: 7px; font-weight: 800; text-transform: uppercase; color: #64748b;
}
.cv-amount-card p {
  font-size: 14px; font-weight: 900; margin-top: 4px; font-variant-numeric: tabular-nums;
}
.cv-amount-card.package p { color: #5b21b6; }
.cv-amount-card.advance p { color: #059669; }
.cv-amount-card.remaining p { color: #c2410c; }
.cv-disclaimer {
  display: flex; gap: 6px; align-items: flex-start;
  background: #f5f3ff; border-radius: 8px; padding: 6px 8px;
  font-size: 7px; color: #5b21b6; line-height: 1.35; font-weight: 600;
  margin-bottom: 8px;
}
.cv-disclaimer svg { width: 11px; height: 11px; flex-shrink: 0; margin-top: 1px; }
.cv-help { background: #f5f3ff; border-radius: 10px; padding: 10px; }
.cv-help-title { font-size: 9px; font-weight: 800; color: #4c1d95; margin-bottom: 8px; }
.cv-help-row {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  font-size: 8px; margin: 5px 0; font-weight: 700;
}
.cv-help-row span:first-child { color: #64748b; }
.cv-help-row span:last-child {
  color: #1e1b4b; display: inline-flex; align-items: center; gap: 4px;
}
.cv-help-row svg { width: 10px; height: 10px; color: #5b21b6; }
.cv-balance-row {
  display: flex; justify-content: space-between; padding: 6px 0;
  border-bottom: 1px solid #f1f5f9; font-size: 8px; font-weight: 700;
}
.cv-balance-row:last-child { border-bottom: none; }
.cv-balance-row span:first-child { color: #64748b; }
.cv-green { color: #059669; }
.cv-red { color: #dc2626; }
.cv-progress-wrap { margin-top: 8px; }
.cv-progress-label {
  display: flex; justify-content: space-between; font-size: 7px; font-weight: 700; margin-bottom: 4px;
}
.cv-progress-bar { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.cv-progress-fill {
  height: 100%; background: linear-gradient(90deg, #5b21b6, #7c3aed); border-radius: 999px;
}
.cv-history {
  margin: 0 16px 12px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
}
.cv-history-title {
  font-size: 9px; font-weight: 800; text-transform: uppercase; color: #fff;
  background: #5b21b6; padding: 8px 10px;
}
.cv-history table { width: 100%; border-collapse: collapse; font-size: 8px; }
.cv-history th {
  text-align: left; padding: 6px 8px; background: #f8fafc; color: #64748b;
  font-weight: 700; text-transform: uppercase; font-size: 6px;
}
.cv-history td { padding: 6px 8px; border-top: 1px solid #f1f5f9; font-weight: 700; }
.cv-history tr.current td { background: #f5f3ff; color: #5b21b6; }
.cv-history .amt { text-align: right; font-variant-numeric: tabular-nums; }
.cv-vendor {
  margin: 0 12px 8px; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 7px 9px;
}
.cv-vendor h4 { font-size: 9px; color: #059669; font-weight: 800; margin-bottom: 4px; }
.cv-vendor p { font-size: 7px; color: #64748b; line-height: 1.3; margin-bottom: 8px; }
.cv-btns { display: flex; gap: 5px; flex-wrap: wrap; }
.cv-btn {
  padding: 5px 10px; border-radius: 6px; color: #fff; font-size: 7px;
  font-weight: 800; text-decoration: none; display: inline-block;
}
.cv-btn.g { background: #059669; }
.cv-btn.o { background: #d97706; }
.cv-btn.r { background: #dc2626; }
.cv-vendor-link {
  background: #f5f3ff; border-radius: 8px; padding: 8px; max-width: 150px;
}
.cv-vendor-link strong { display: block; font-size: 7px; color: #5b21b6; margin-bottom: 4px; }
.cv-vendor-link span { font-size: 5.5px; color: #334155; word-break: break-all; line-height: 1.3; }
.cv-bottom {
  margin-top: 4px; position: relative; padding: 6px 12px 0;
  background: linear-gradient(180deg, #fff 0%, #faf8ff 100%);
}
.cv-landmarks {
  position: absolute; left: 0; right: 0; bottom: 34px; height: 42px;
  opacity: 0.08; pointer-events: none; overflow: hidden;
}
.cv-landmarks svg { width: 100%; height: 100%; }
.cv-thanks-row {
  display: grid; grid-template-columns: 1.2fr 1fr; gap: 8px;
  align-items: end; position: relative; z-index: 1;
  padding-bottom: 8px;
}
.cv-thanks-title {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 800; color: #4c1d95; margin-bottom: 2px;
}
.cv-thanks-title svg { width: 14px; height: 14px; }
.cv-thanks-text { font-size: 7px; color: #64748b; line-height: 1.3; max-width: 240px; }
.cv-sign-wrap { text-align: right; }
.cv-sign-label { font-size: 6.5px; color: #64748b; font-weight: 600; }
.cv-sign-name {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 13px; font-style: italic; font-weight: 700;
  color: #4c1d95; margin: 2px 0 4px;
}
.cv-stamp {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  width: 52px; height: 52px; border-radius: 50%;
  border: 2px solid #5b21b6; color: #5b21b6;
  font-size: 5px; font-weight: 800; text-align: center; line-height: 1.15;
  margin-left: auto; transform: rotate(-8deg);
  background: rgba(245,243,255,0.6);
}
.cv-contact {
  background: #4c1d95; color: #fff; padding: 6px 12px;
  display: flex; justify-content: space-between; gap: 6px; align-items: center;
  font-size: 7px; font-weight: 600; position: relative; z-index: 1;
}
.cv-contact span {
  display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
}
.cv-contact svg { width: 10px; height: 10px; opacity: 0.95; flex-shrink: 0; }

/* Mobile / narrow screen — WhatsApp & phone browser preview */
@media screen and (max-width: 720px) {
  html, body {
    width: 100% !important;
    max-width: 100vw;
    overflow-x: hidden;
  }
  .cv-page {
    width: 100% !important;
    min-height: auto;
    max-width: 100%;
  }
  .cv-header { padding: 18px 14px 16px; }
  .cv-header-top { flex-direction: column; align-items: stretch; }
  .cv-hero { width: 100%; height: 120px; }
  .cv-title { font-size: 18px; margin: 12px 0 10px; }
  .cv-brand-name { font-size: 16px; }
  .cv-brand-tag { font-size: 10px; }
  .cv-pill { font-size: 10px; padding: 6px 12px; }
  .cv-strip,
  .cv-strip.cols-4,
  .cv-strip.cols-5,
  .cv-strip.cols-6 {
    grid-template-columns: 1fr 1fr !important;
  }
  .cv-strip-item {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 12px;
  }
  .cv-strip label { font-size: 9px; }
  .cv-strip p { font-size: 12px; }
  .cv-body {
    grid-template-columns: 1fr !important;
    padding: 14px 12px;
    gap: 12px;
  }
  .cv-grid,
  .cv-grid-3 { grid-template-columns: 1fr !important; }
  .cv-tile { padding: 10px; }
  .cv-tile label { font-size: 9px; }
  .cv-tile p { font-size: 12px; }
  .cv-hotel-card { flex-direction: column; }
  .cv-hotel-card img { width: 100%; height: 140px; }
  .cv-hotel-name { font-size: 16px; }
  .cv-hotel-addr { font-size: 11px; }
  .cv-amount-banner {
    grid-template-columns: 1fr !important;
    padding: 12px 12px 0;
    gap: 8px;
  }
  .cv-amount-card p { font-size: 18px; }
  .cv-amount-card label { font-size: 10px; }
  .cv-amount-value { font-size: 28px; }
  .cv-panel-title { font-size: 12px; }
  .cv-note-item { font-size: 11px; line-height: 1.45; }
  .cv-help-row { font-size: 11px; }
  .cv-vendor {
    margin: 0 12px 12px;
    grid-template-columns: 1fr !important;
  }
  .cv-vendor-link { max-width: none; }
  .cv-btn { font-size: 11px; padding: 8px 12px; }
  .cv-thanks-row {
    grid-template-columns: 1fr !important;
    text-align: left;
  }
  .cv-sign-wrap { text-align: left; }
  .cv-stamp { margin-left: 0; }
  .cv-thanks-title { font-size: 16px; }
  .cv-thanks-text { font-size: 11px; max-width: none; }
  .cv-contact {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
    font-size: 11px;
  }
  .cv-contact span { white-space: normal; }
  .cv-history { margin: 0 12px 12px; }
  .cv-history table { font-size: 11px; }
  .cv-history th { font-size: 9px; }
  .cv-itinerary-title { font-size: 12px; }
  .cv-itinerary-places { font-size: 11px; }
}

@media print {
  html, body, .cv-page { width: 210mm; }
}
`;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
    </g>
  </svg>`;
}

function brandMeta(brand = {}) {
  const name = brand.name || branding.brandName || 'Travel Company';
  const tagline = brand.tagline || 'Explore the World. Experience India.';
  const phone = brand.phone || branding.supportPhone || '-';
  const email = brand.email || branding.salesEmail || '-';
  const site = (brand.website || branding.websiteUrl || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '') || '-';
  const place = brand.address || 'Chandigarh, India';
  const stamp = brand.stamp || [String(name).toUpperCase().slice(0, 16), 'TRAVEL WITH', 'CONFIDENCE'];
  const logoHtml = brand.logoSrc
    ? `<div class="cv-logo"><img src="${esc(brand.logoSrc)}" alt="${esc(name)}"/></div>`
    : `<div class="cv-logo">${esc(brand.initials || String(name).slice(0, 3).toUpperCase())}</div>`;
  return { name, tagline, phone, email, site, place, stamp, logoHtml };
}

function brandedHeaderHtml({ title, pills = [], brand, heroSrc = SCENIC_HERO }) {
  const meta = brandMeta(brand);
  const pillsHtml = pills.map((p) => (
    `<span class="cv-pill">${p.icon ? svgIcon(p.icon) : ''}${esc(p.text)}</span>`
  )).join('');
  return `
  <div class="cv-header">
    <div class="cv-plane">${svgIcon('plane')}</div>
    <div class="cv-header-top">
      <div class="cv-brand">
        ${meta.logoHtml}
        <div>
          <div class="cv-brand-name">${esc(meta.name)}</div>
          <div class="cv-brand-tag">${esc(meta.tagline)}</div>
        </div>
      </div>
      <img class="cv-hero" src="${esc(heroSrc)}" alt=""/>
    </div>
    <div class="cv-title">${esc(title)}</div>
    <div class="cv-pills">${pillsHtml}</div>
  </div>`;
}

function brandedStripHtml(items = [], cols = 5) {
  const colsClass = cols === 4 ? 'cols-4' : cols === 6 ? 'cols-6' : 'cols-5';
  return `<div class="cv-strip ${colsClass}">${items.map((item) => `
    <div class="cv-strip-item">
      <div class="cv-strip-ico">${svgIcon(item.icon || 'info')}</div>
      <div><label>${esc(item.label)}</label><p>${esc(item.value || '-')}</p></div>
    </div>`).join('')}</div>`;
}

function brandedTile(icon, label, value) {
  return `<div class="cv-tile">
    <div class="cv-tile-ico">${svgIcon(icon)}</div>
    <div><label>${esc(label)}</label><p>${esc(value || '-')}</p></div>
  </div>`;
}

function brandedFooterHtml(brand, thanksText) {
  const meta = brandMeta(brand);
  return `
  <div class="cv-bottom">
    <div class="cv-landmarks">${landmarksSvg()}</div>
    <div class="cv-thanks-row">
      <div>
        <div class="cv-thanks-title">${svgIcon('ribbon')} Thank You!</div>
        <div class="cv-thanks-text">${esc(thanksText || 'We wish you a safe and memorable journey. For any assistance during travel, contact your executive or support line below.')}</div>
      </div>
      <div class="cv-sign-wrap">
        <div class="cv-sign-label">Authorised Signatory</div>
        <div class="cv-sign-name">${esc(meta.name)}</div>
        <div class="cv-stamp">${meta.stamp.map((line) => `<div>${esc(line)}</div>`).join('')}</div>
      </div>
    </div>
    <div class="cv-contact">
      <span>${svgIcon('phone')} ${esc(meta.phone)}</span>
      <span>${svgIcon('mail')} ${esc(meta.email)}</span>
      <span>${svgIcon('globe')} ${esc(meta.site)}</span>
      <span>${svgIcon('map')} ${esc(meta.place)}</span>
    </div>
  </div>`;
}

function brandedHelpBox(rows = []) {
  return `<div class="cv-help">
    <div class="cv-help-title">Need Help?</div>
    ${rows.map(([label, value]) => `
      <div class="cv-help-row">
        <span>${esc(label)}</span>
        <span>${svgIcon('phone')} ${esc(value || '-')}</span>
      </div>`).join('')}
  </div>`;
}

function wrapBrandedDocument({ title, bodyHtml, brand, heroSrc, pills, stripItems, stripCols = 5, thanksText }) {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<title>${esc(title)}</title>
<style>${BRANDED_DOC_CSS}</style>
</head><body>
<div class="cv-page">
  ${brandedHeaderHtml({ title, pills, brand, heroSrc })}
  ${stripItems?.length ? brandedStripHtml(stripItems, stripCols) : ''}
  ${bodyHtml}
  ${brandedFooterHtml(brand, thanksText)}
</div>
</body></html>`;
}

module.exports = {
  BRANDED_DOC_CSS,
  SCENIC_HERO,
  HOTEL_HERO,
  CAB_HERO,
  esc,
  svgIcon,
  brandMeta,
  brandedHeaderHtml,
  brandedStripHtml,
  brandedTile,
  brandedFooterHtml,
  brandedHelpBox,
  wrapBrandedDocument,
};
