
export const PACKAGE_TYPES = [
  { value: 'honeymoon', label: 'Honeymoon', color: 'from-rose-500/20 to-pink-500/10 border-rose-400/40 text-rose-700' },
  { value: 'family', label: 'Family', color: 'from-sky-500/20 to-blue-500/10 border-sky-400/40 text-sky-700' },
  { value: 'group', label: 'Group', color: 'from-violet-500/20 to-purple-500/10 border-violet-400/40 text-violet-700' },
  { value: 'adventure', label: 'Adventure', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/40 text-emerald-700' },
  { value: 'luxury', label: 'Luxury', color: 'from-amber-500/20 to-orange-500/10 border-amber-400/40 text-amber-700' },
  { value: 'corporate', label: 'Corporate', color: 'from-slate-500/20 to-slate-600/10 border-slate-400/40 text-slate-700' },
  { value: 'weekend', label: 'Weekend', color: 'from-cyan-500/20 to-teal-500/10 border-cyan-400/40 text-cyan-700' },
];

export const QUOTE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'text-slate-700 bg-slate-500/15 border-slate-400/40' },
  { value: 'sent', label: 'Sent', color: 'text-sky-700 bg-sky-500/15 border-sky-400/40' },
  { value: 'viewed', label: 'Viewed', color: 'text-indigo-700 bg-indigo-500/15 border-indigo-400/40' },
  { value: 'accepted', label: 'Accepted', color: 'text-emerald-700 bg-emerald-500/15 border-emerald-400/40' },
  { value: 'approved', label: 'Approved', color: 'text-emerald-700 bg-emerald-500/15 border-emerald-400/40' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-700 bg-red-500/15 border-red-400/40' },
  { value: 'expired', label: 'Expired', color: 'text-amber-700 bg-amber-500/15 border-amber-400/40' },
  { value: 'booked', label: 'Booked', color: 'text-violet-700 bg-violet-500/15 border-violet-400/40' },
  { value: 'negotiation', label: 'Negotiation', color: 'text-amber-700 bg-amber-500/15 border-amber-400/40' },
];

export const QUOTE_TIMELINE_TYPES = {
  created: { label: 'Quote Created', color: 'bg-blue-500' },
  sent: { label: 'Quote Sent', color: 'bg-sky-500' },
  viewed: { label: 'Quote Viewed', color: 'bg-indigo-500' },
  negotiation: { label: 'In Negotiation', color: 'bg-amber-500' },
  approved: { label: 'Quote Approved', color: 'bg-emerald-500' },
  rejected: { label: 'Quote Rejected', color: 'bg-red-500' },
};

export const WIZARD_STEPS = [
  { id: 1, title: 'Select Lead', key: 'lead' },
  { id: 2, title: 'Select Package', key: 'package' },
  { id: 3, title: 'Customize', key: 'customize' },
  { id: 4, title: 'Hotel & Meals', key: 'hotels' },
  { id: 5, title: 'Transport', key: 'transport' },
  { id: 6, title: 'Activities', key: 'activities' },
  { id: 7, title: 'Pricing', key: 'pricing' },
  { id: 8, title: 'Generate', key: 'generate' },
];

export const HOTEL_CATEGORIES = ['Budget', '3 Star', '4 Star', '5 Star', 'Luxury', 'Boutique'];
export const NO_HOTEL_MEAL_PLAN = 'No Hotel';
export const MEAL_PLANS = [
  'EP (Room Only)',
  'CP (Breakfast)',
  'MAP (Breakfast + Dinner)',
  'AP (All Meals)',
  'All Inclusive',
  NO_HOTEL_MEAL_PLAN,
];
/** Meal plans shown inside hotel room configuration (excludes No Hotel) */
export const MEAL_PLANS_WITH_HOTEL = MEAL_PLANS.filter((m) => m !== NO_HOTEL_MEAL_PLAN);

const NO_HOTEL_VALUES = new Set([
  'no hotel',
  'no_hotel',
  'nohotel',
  'none',
  'cab only',
  'cab_only',
  'without hotel',
  'without_hotel',
]);

export function isNoHotelLabel(value) {
  if (value == null || value === '') return false;
  const v = String(typeof value === 'object' ? (value.label || value.name || value.value || '') : value)
    .trim()
    .toLowerCase();
  return NO_HOTEL_VALUES.has(v);
}

export function isNoHotelMealPlan(mealPlan) {
  return isNoHotelLabel(mealPlan);
}

/** Lead/quote intentionally has no hotel (cab-only package etc.) */
export function quotationOmitsHotels(quote = {}, lead = null) {
  const info = quote.packageInfo || {};
  if (isNoHotelMealPlan(info.mealPlan)) return true;
  const leadDoc = lead || quote.lead || {};
  if (isNoHotelLabel(info.hotelCategory) || isNoHotelLabel(leadDoc.hotelCategory)) return true;
  return false;
}

/**
 * PDF/display: only show hotel content when named hotels are actually selected.
 * Empty selectedHotels[] means skip hotel / not selected yet.
 * Legacy quotes without selectedHotels still fall back to package hotels.
 */
export function quoteHasHotels(quote = {}) {
  if (quotationOmitsHotels(quote)) return false;
  if (Array.isArray(quote.selectedHotels)) {
    return quote.selectedHotels.some((h) => String(h?.name || h?.hotelName || '').trim());
  }
  const snap = quote.packageSnapshot || quote.package || {};
  return (snap.hotels || []).some((h) => String(h?.name || h?.hotelName || '').trim());
}

import { APP_PLATFORM_DOMAIN, APP_QUOTES_EMAIL, APP_WEBSITE } from '../../config/branding';

export const COMPANY_INFO = {
  name: 'TRAVEL CRM',
  tagline: 'Travel made simple',
  logoUrl: '/homelogo.webp',
  phone: '+91 98765 43210',
  email: APP_QUOTES_EMAIL,
  website: APP_WEBSITE,
  address: '2nd Floor, Sheril Villa, Near East End Hotel NH-22 Bye-Pass, Panthaghati, Shimla, Himachal Pradesh 171009',
};
