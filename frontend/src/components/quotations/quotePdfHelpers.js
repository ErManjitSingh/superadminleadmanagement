import { getPackageTypeConfig } from './quotationUtils';
import {
  getPackageCategoryLabel,
  QUOTE_BANK_ACCOUNTS,
  QUOTE_PAYMENT_DETAILS,
  QUOTE_POLICIES,
  resolveQuoteExclusions,
  resolveQuoteInclusions,
  resolveQuoteTermsAndConditions,
} from './quoteTemplateDefaults';
import { quotationOmitsHotels, quoteHasHotels } from './constants';

/** Remove "AC" from private cab wording in PDFs (new + saved itineraries). */
export function sanitizeTransportLabel(text = '') {
  return String(text || '')
    .replace(/\bprivate\s+AC\s+cab\b/gi, 'Private cab')
    .replace(/\bPrivate\s+AC\s+cab\b/g, 'Private cab')
    .replace(/\bAC\s+cab\b/gi, 'cab')
    .replace(/\bprivate\s+AC\s+vehicle\b/gi, 'private vehicle')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** When no hotel is selected, drop breakfast/meal phrasing from day copy. */
export function stripBreakfastFromText(text = '') {
  if (!text) return '';
  return String(text)
    .replace(/\bafter\s+(a\s+hearty\s+)?breakfast(\s+at\s+the\s+hotel)?[,.]?\s*/gi, '')
    .replace(/\benjoy\s+breakfast(\s+at\s+the\s+hotel)?[,.]?\s*/gi, '')
    .replace(/\bbreakfast\s+at\s+(the\s+)?hotel[,.]?\s*/gi, '')
    .replace(/\b(morning\s+)?breakfast(\s+&|\s+and)?\s*(dinner)?\b/gi, '')
    .replace(/\bBreakfast(\s*&\s*Dinner|\s*\+\s*Dinner)?\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function resolveQuotePackage(quote) {
  const snap = quote?.packageSnapshot && typeof quote.packageSnapshot === 'object' ? quote.packageSnapshot : {};
  const pop = quote?.package && typeof quote.package === 'object' ? quote.package : {};
  const raw = { ...pop, ...snap };
  const omitHotels = quotationOmitsHotels(quote) || !quoteHasHotels(quote);
  const itinerary = (raw.itinerary || []).map((day, i) => ({
    ...day,
    id: day.id || day._id || `day-${i}`,
    hotel: omitHotels ? '' : (day.hotel || day.accommodation || ''),
    accommodation: omitHotels ? '' : (day.accommodation || ''),
    meals: omitHotels ? '' : (day.meals || ''),
    description: omitHotels ? stripBreakfastFromText(day.description) : (day.description || ''),
    activities: day.activities || '',
    transport: sanitizeTransportLabel(day.transport || ''),
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
    hotels: omitHotels ? [] : (raw.hotels || []),
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

export function buildSelectedHotelsSnapshot(dayWiseHotels) {
  const list = Array.isArray(dayWiseHotels)
    ? dayWiseHotels
    : dayWiseHotels?.hotel
      ? [{ day: 1, ...dayWiseHotels }]
      : [];

  return list
    .filter((entry) => entry?.hotel)
    .map((entry) => ({
      day: entry.day,
      _id: entry.hotel.id,
      name: entry.hotel.name,
      location: entry.hotel.location,
      city: entry.hotel.city,
      thumbnailUrl: entry.hotel.thumbnailUrl,
      images: entry.hotel.images,
      room: entry.room,
      mealPlan: entry.mealPlan,
      nights: entry.nights || 1,
      price: entry.perNight,
      total: entry.totalCost ?? entry.perNight,
      externalSource: entry.hotel.isManual ? 'manual' : (entry.hotel.externalSource || 'uno_hotels'),
    }));
}

export function collectHotelImageUrls(hotel = {}) {
  const urls = [];
  const add = (url) => {
    if (typeof url === 'string' && url.trim() && !urls.includes(url.trim())) {
      urls.push(url.trim());
    }
  };
  add(hotel.thumbnailUrl);
  (hotel.images || []).forEach(add);
  (hotel.room?.images || []).forEach(add);
  return urls;
}

export function collectHotelOnlyImages(hotel = {}) {
  const urls = [];
  const add = (url) => {
    if (typeof url === 'string' && url.trim() && !urls.includes(url.trim())) {
      urls.push(url.trim());
    }
  };
  add(hotel.thumbnailUrl);
  (hotel.images || []).forEach(add);
  return urls;
}

export function collectRoomImages(hotel = {}) {
  return (hotel.room?.images || []).filter((url) => typeof url === 'string' && url.trim());
}

/** Parse YYYY-MM-DD (or Date) as local midnight — avoids UTC off-by-one. */
function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const raw = String(value).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function nightsBetweenDates(checkIn, checkOut) {
  const startDate = parseLocalDate(checkIn);
  const endDate = parseLocalDate(checkOut);
  if (!startDate || !endDate) return 0;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Trip day number (1-based) for a date relative to travel start. */
function dayNumberFromTravel(travelStart, dateValue) {
  const startDate = parseLocalDate(travelStart);
  const d = parseLocalDate(dateValue);
  if (!startDate || !d) return null;
  return Math.round((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function hotelStayNights(h = {}) {
  const fromDates = nightsBetweenDates(h.checkIn, h.checkOut);
  if (fromDates > 0) return fromDates;
  const n = Number(h.nights);
  if (Number.isFinite(n) && n > 0) return n;
  return 1;
}

function mapSelectedHotelRecord(h, lead, pkg, travelStart) {
  const hotelImages = collectHotelOnlyImages(h);
  const roomImages = collectRoomImages(h);
  const start = travelStart || pkg.travelDate || lead.travelDate;
  const nights = hotelStayNights(h);
  const startDay = Number(h.day) > 0 ? Number(h.day) : (dayNumberFromTravel(start, h.checkIn) || 1);
  return {
    day: startDay,
    date: h.checkIn ? parseLocalDate(h.checkIn) : (startDay ? getDayDate(start, startDay) : null),
    checkIn: h.checkIn || (startDay ? getDayDate(start, startDay) : null),
    checkOut: h.checkOut || (startDay ? getDayDate(start, startDay + nights) : null),
    city: h.city || h.location?.split(',')[0]?.trim() || h.location || pkg.destination?.split(/[,|/]/)[0]?.trim() || '-',
    name: h.name || h.hotelName || 'Hotel',
    roomType: h.room?.name || h.roomType || 'Deluxe',
    meals:
      h.mealPlan?.label
      || (typeof h.mealPlan === 'string' ? h.mealPlan : null)
      || h.meals
      || 'Breakfast & Dinner',
    similarHotel: h.similarHotel || '',
    thumbnailUrl: hotelImages[0] || '',
    hotelImages,
    roomImages,
    roomImage: roomImages[0] || '',
    images: collectHotelImageUrls(h),
    nights,
    stayStartDay: startDay,
    price: h.price ?? h.total,
  };
}

/**
 * Expand stay blocks onto every overnight itinerary day.
 * - Same hotel entire trip (1 block) → that hotel on all overnight days
 * - Per-destination / manual (multiple blocks) → each hotel covers checkIn…checkOut
 *   (or day + nights), so a 2–3 night stay repeats on consecutive days
 */
export function resolveDayHotelMap(quote) {
  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const packageInfo = quote?.packageInfo || {};
  const travelStart = packageInfo.travelDate || lead.travelDate || pkg.travelDate;
  const duration = Math.max(
    1,
    Number(pkg.duration || packageInfo.duration || (pkg.itinerary || []).length || 1),
  );
  const maxOvernightDay = Math.max(0, duration - 1);
  const map = new Map();

  if (quotationOmitsHotels(quote) || !quoteHasHotels(quote)) {
    return { map, lead, pkg, duration, travelStart };
  }

  const selected = (quote.selectedHotels || []).filter((h) =>
    String(h?.name || h?.hotelName || '').trim(),
  );
  const source = selected.length
    ? selected
    : (!Array.isArray(quote.selectedHotels) ? (pkg.hotels || []) : []).filter((h) =>
      String(h?.name || h?.hotelName || '').trim(),
    );

  if (!source.length) return { map, lead, pkg, duration, travelStart };

  const stays = source.map((h, index) => {
    const nights = hotelStayNights(h);
    let startDay = dayNumberFromTravel(travelStart, h.checkIn);
    if (!startDay || startDay < 1) {
      // Trust day index for single stay or true per-night rows; otherwise sequence by nights
      if (source.length === 1 || nights === 1) {
        startDay = Number(h.day) > 0 ? Number(h.day) : null;
      } else {
        startDay = null;
      }
    }
    return { h, nights, startDay, index };
  });

  // Fill missing start days sequentially (multi-night destination blocks)
  let cursor = 1;
  stays.forEach((stay) => {
    if (!stay.startDay || stay.startDay < 1) {
      stay.startDay = cursor;
    }
    cursor = stay.startDay + stay.nights;
  });

  const assignStay = (stay, endDay) => {
    const record = mapSelectedHotelRecord(stay.h, lead, pkg, travelStart);
    const start = Math.max(1, stay.startDay);
    const end = Math.max(start, Math.min(maxOvernightDay, endDay));
    for (let d = start; d <= end; d += 1) {
      map.set(d, {
        ...record,
        day: d,
        date: getDayDate(travelStart, d),
        nights: stay.nights,
        stayStartDay: start,
        stayNights: stay.nights,
      });
    }
  };

  if (stays.length === 1) {
    // One hotel for the trip: cover every overnight day (extend if nights under-reported)
    const stay = stays[0];
    let endDay = stay.startDay + stay.nights - 1;
    if (stay.startDay <= 1 && endDay < maxOvernightDay) {
      endDay = maxOvernightDay;
    }
    assignStay(stay, endDay);
  } else {
    stays.forEach((stay) => {
      assignStay(stay, stay.startDay + stay.nights - 1);
    });
  }

  return { map, lead, pkg, duration, travelStart };
}

export function resolveDayHotelForItinerary(quote, dayNum) {
  const { map, pkg, duration } = resolveDayHotelMap(quote);
  const dur = Math.max(
    1,
    Number(duration || pkg.duration || quote?.packageInfo?.duration || 1),
  );
  // Last day is usually departure — no overnight hotel.
  if (dayNum >= dur) return null;
  if (map.has(dayNum)) return map.get(dayNum);
  return null;
}

/** Unique stay blocks (not expanded per night) — for summaries / legacy callers. */
export function resolveQuoteHotels(quote) {
  if (quotationOmitsHotels(quote) || !quoteHasHotels(quote)) return [];

  const pkg = resolveQuotePackage(quote);
  const lead = resolveQuoteLead(quote);
  const packageInfo = quote?.packageInfo || {};
  const travelStart = packageInfo.travelDate || lead.travelDate || pkg.travelDate;

  const selected = (quote.selectedHotels || []).filter((h) =>
    String(h?.name || h?.hotelName || '').trim(),
  );

  if (selected.length) {
    return selected
      .map((h) => mapSelectedHotelRecord(h, lead, pkg, travelStart))
      .sort((a, b) => (a.stayStartDay || a.day || 0) - (b.stayStartDay || b.day || 0));
  }

  if (pkg.hotels?.length && !Array.isArray(quote.selectedHotels)) {
    return pkg.hotels
      .filter((h) => String(h?.name || h?.hotelName || '').trim())
      .map((h, index) => ({
        ...mapSelectedHotelRecord({ ...h, day: h.day || index + 1 }, lead, pkg, travelStart),
        hotelImages: h.hotelImages || collectHotelOnlyImages(h),
        roomImages: h.roomImages || collectRoomImages(h),
        roomImage: h.roomImage || collectRoomImages(h)[0] || '',
      }));
  }

  return [];
}

export function resolveQuoteVehicles(quote) {
  const pkg = resolveQuotePackage(quote);
  const lead = resolveQuoteLead(quote);
  const packageInfo = quote?.packageInfo || {};
  const duration = Number(packageInfo.duration || pkg.duration || 1);
  const start = packageInfo.travelDate || lead.travelDate;
  const end = getDayDate(start, Math.max(1, duration));

  if (pkg.vehicles?.length) {
    return pkg.vehicles.map((v) => ({
      name: v.name || v.vehicleName || v.vehicle || 'Vehicle',
      type: v.type || v.vehicleType || v.category || '',
      count: v.count || v.vehicleCount || 1,
      cost: Number(v.cost || v.price || 0),
      seats: v.seats || '',
      notes: v.notes || '',
      startDate: v.startDate || start,
      endDate: v.endDate || end || start,
    }));
  }

  const cabs = Array.isArray(quote.selectedCabs) ? quote.selectedCabs : [];
  if (cabs.length) {
    return cabs.map((cab) => ({
      name: cab.vehicleName || cab.name || cab.vehicleType || 'Private Cab',
      type: cab.vehicleType || cab.type || pkg.cabCategory || '',
      count: cab.vehicleCount || cab.count || 1,
      cost: Number(cab.cost || cab.price || 0),
      seats: cab.seats || '',
      notes: cab.notes || '',
      startDate: start,
      endDate: end || start,
    }));
  }

  if (pkg.cabCategory || packageInfo.transportation) {
    return [{
      name: pkg.cabCategory || packageInfo.transportation,
      type: packageInfo.transportation || pkg.cabCategory || '',
      count: 1,
      cost: 0,
      notes: '',
      startDate: start,
      endDate: end || start,
    }];
  }

  return [];
}

export function resolveTripPlanner(quote) {
  const exec = quote.createdByExecutive || quote.createdBy;
  const leadExec = quote.lead?.assignedTo && typeof quote.lead.assignedTo === 'object'
    ? quote.lead.assignedTo
    : null;
  const person = exec?.name ? exec : leadExec;
  return {
    name: quote.tripPlanner?.name || person?.name || 'Travel Desk',
    phone: quote.tripPlanner?.phone || person?.phone || leadExec?.phone || '',
  };
}

export function resolveQuoteDisplayNumber(quote) {
  const raw = String(quote?.quoteNumber || '').trim();
  if (!raw || /^draft$/i.test(raw) || /^preview$/i.test(raw)) return 'No';
  return raw;
}

export function resolvePolicies(quote) {
  const pkg = resolveQuotePackage(quote);
  const p = pkg.policies || {};
  return {
    remarks: p.remarks || QUOTE_POLICIES.remarks,
    terms: p.terms || [],
    confirmation: p.confirmation?.length ? p.confirmation : QUOTE_PAYMENT_DETAILS,
    cancellation: p.cancellation || QUOTE_POLICIES.cancellation,
    amendment: p.amendment || QUOTE_POLICIES.amendment,
    inclusions: resolveQuoteInclusions(quote),
    exclusions: resolveQuoteExclusions(quote),
    paymentDetails: QUOTE_PAYMENT_DETAILS,
    termsAndConditions: resolveQuoteTermsAndConditions(quote),
  };
}

export function resolveBankAccounts(quote) {
  const pkg = resolveQuotePackage(quote);
  const list = pkg.bankAccounts?.length ? pkg.bankAccounts : QUOTE_BANK_ACCOUNTS;
  return list.slice(0, 1);
}

export function resolvePaymentPlan(quote, total = 0) {
  const amount = Math.max(0, Number(total) || 0);
  const schedule = [
    { label: 'Booking Confirmation (Advance)', percent: 30 },
    { label: 'Before Tour Begins', percent: 50 },
    { label: 'On Arrival (Balance)', percent: 20 },
  ];

  // Allocate so the rows always add up exactly to the total (last row = remainder).
  let allocated = 0;
  return schedule.map((row, i) => {
    const isLast = i === schedule.length - 1;
    const amt = isLast ? amount - allocated : Math.round((amount * row.percent) / 100);
    allocated += amt;
    return { label: row.label, percent: row.percent, amount: amt };
  });
}

export function resolveQuoteTotal(quote) {
  const p = quote?.pricing || {};
  const c = quote?.costing || {};
  const lead = quote?.lead && typeof quote.lead === 'object' ? quote.lead : {};

  const candidates = [
    p.grandTotal,
    p.total,
    p.baseCost,
    c.grandTotal,
    c.subtotal,
    quote?.totalPrice,
    quote?.packageInfo?.totalCost,
    lead.budget,
    lead.packageCost,
    quote?.budget,
  ];

  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const planSum = (quote?.paymentPlan || []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  );
  if (planSum > 0) return planSum;

  const cabSum = (quote?.selectedCabs || []).reduce(
    (sum, cab) => sum + (Number(cab.cost) || Number(cab.price) || 0),
    0,
  );
  return cabSum > 0 ? cabSum : 0;
}

export function resolveTravelerCounts(quote) {
  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const info = quote?.packageInfo || {};
  const adults = Number(info.adults ?? lead.adults ?? pkg.adults);
  const kids = Number(info.children ?? lead.children ?? pkg.kids ?? 0);
  const total = Number(lead.travelers) || (Number.isFinite(adults) ? adults + kids : 2);
  return {
    adults: Number.isFinite(adults) && adults > 0 ? adults : Math.max(1, total - kids),
    kids: Number.isFinite(kids) ? kids : 0,
    rooms: pkg.rooms ?? Math.ceil((Number.isFinite(adults) && adults > 0 ? adults : total) / 2),
    extraBeds: pkg.extraBeds ?? 0,
  };
}
