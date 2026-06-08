import { getPackageTypeConfig } from './quotationUtils';
import { getPackageCategoryLabel, QUOTE_POLICIES, QUOTE_BANK_ACCOUNTS } from './quoteTemplateDefaults';

export function resolveQuotePackage(quote) {
  const snap = quote?.packageSnapshot && typeof quote.packageSnapshot === 'object' ? quote.packageSnapshot : {};
  const pop = quote?.package && typeof quote.package === 'object' ? quote.package : {};
  const raw = { ...pop, ...snap };
  const itinerary = (raw.itinerary || []).map((day, i) => ({
    ...day,
    id: day.id || day._id || `day-${i}`,
    hotel: day.hotel || day.accommodation || '',
    activities: day.activities || '',
    transport: day.transport || '',
    sightseeing: day.sightseeing || '',
    activityNotes: day.activityNotes || '',
  }));
  return {
    ...raw,
    itinerary,
    highlights: raw.highlights || [],
    inclusions: raw.inclusions || [],
    exclusions: raw.exclusions || [],
    coverImage: raw.coverImage || '',
    hotels: raw.hotels || [],
    vehicles: raw.vehicles || [],
    routing: raw.routing || raw.destination || '',
    packageCategory: raw.packageCategory || getPackageCategoryLabel(raw.packageType),
    rooms: raw.rooms,
    extraBeds: raw.extraBeds,
    adults: raw.adults,
    kids: raw.kids,
    cabCategory: raw.cabCategory || '',
    shortName: raw.shortName || '',
    policies: raw.policies || {},
    bankAccounts: raw.bankAccounts || [],
  };
}

export function resolveQuoteLead(quote) {
  return quote?.lead || {};
}

export function formatQuoteDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatQuoteDateShort(value) {
  if (!value) return '—';
  const d = new Date(value);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

export function getDayDate(travelDate, dayNumber) {
  if (!travelDate || !dayNumber) return null;
  const d = new Date(travelDate);
  d.setDate(d.getDate() + (dayNumber - 1));
  return d;
}

export function getQuoteTypeLabel(quote) {
  const pkg = resolveQuotePackage(quote);
  return getPackageTypeConfig(pkg.packageType).label;
}

export function perPersonAmount(pricing, travelers = 2) {
  const total = Number(pricing?.total || 0);
  const pax = Math.max(1, Number(travelers) || 2);
  return Math.round(total / pax);
}

export function resolveQuoteHotels(quote) {
  const pkg = resolveQuotePackage(quote);
  if (pkg.hotels?.length) return pkg.hotels;

  const fromSelected = (quote.selectedHotels || []).map((h) => ({
    city: h.location || h.city || '—',
    name: h.name || 'Hotel',
    checkIn: h.checkIn,
    checkOut: h.checkOut,
    roomType: h.roomType || 'Deluxe',
    meals: h.mealPlan || h.meals || 'Breakfast & Dinner',
    similarHotel: h.similarHotel || '',
  }));
  if (fromSelected.length) return fromSelected;

  const seen = new Set();
  const fromItinerary = [];
  for (const day of pkg.itinerary) {
    if (!day.hotel || seen.has(day.hotel)) continue;
    seen.add(day.hotel);
    fromItinerary.push({
      city: pkg.destination?.split(/[,·]/)[0]?.trim() || '—',
      name: day.hotel,
      roomType: 'Deluxe',
      meals: day.meals || 'Breakfast & Dinner',
      similarHotel: '',
    });
  }
  return fromItinerary;
}

export function resolveQuoteVehicles(quote) {
  const pkg = resolveQuotePackage(quote);
  if (pkg.vehicles?.length) return pkg.vehicles;

  const cab = quote.selectedCabs?.[0];
  const cabName = pkg.cabCategory || cab?.vehicleType || 'Private Cab';
  const lead = resolveQuoteLead(quote);
  const start = lead.travelDate;
  const end = getDayDate(lead.travelDate, (pkg.duration || 1) - 1);

  if (cab) {
    return [{
      name: cabName,
      startDate: start,
      endDate: end || start,
    }];
  }

  if (pkg.cabCategory) {
    return [{ name: pkg.cabCategory, startDate: start, endDate: end || start }];
  }

  return [];
}

export function resolveTripPlanner(quote) {
  const exec = quote.createdByExecutive || quote.createdBy;
  return {
    name: quote.tripPlanner?.name || exec?.name || 'Travel Desk',
    phone: quote.tripPlanner?.phone || exec?.phone || '',
  };
}

export function resolvePolicies(quote) {
  const pkg = resolveQuotePackage(quote);
  const p = pkg.policies || {};
  return {
    remarks: p.remarks || QUOTE_POLICIES.remarks,
    terms: p.terms || QUOTE_POLICIES.terms,
    confirmation: p.confirmation || QUOTE_POLICIES.confirmation,
    cancellation: p.cancellation || QUOTE_POLICIES.cancellation,
    amendment: p.amendment || QUOTE_POLICIES.amendment,
  };
}

export function resolveBankAccounts(quote) {
  const pkg = resolveQuotePackage(quote);
  return pkg.bankAccounts?.length ? pkg.bankAccounts : QUOTE_BANK_ACCOUNTS;
}

export function resolveTravelerCounts(quote) {
  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const total = Number(lead.travelers) || 2;
  return {
    adults: pkg.adults ?? Math.max(1, total - (pkg.kids || 0)),
    kids: pkg.kids ?? 0,
    rooms: pkg.rooms ?? Math.ceil(total / 2),
    extraBeds: pkg.extraBeds ?? 0,
  };
}
