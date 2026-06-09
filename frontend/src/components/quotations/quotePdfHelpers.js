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

export function buildSelectedHotelsSnapshot(unoHotelSelection) {
  if (!unoHotelSelection?.hotel) return [];
  const { hotel, room, mealPlan, nights, perNight, totalCost } = unoHotelSelection;
  return [{
    _id: hotel.id,
    name: hotel.name,
    location: hotel.location,
    city: hotel.city,
    thumbnailUrl: hotel.thumbnailUrl,
    images: hotel.images,
    room,
    mealPlan,
    nights,
    price: perNight,
    total: totalCost,
    externalSource: hotel.externalSource || 'uno_hotels',
  }];
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

function mapSelectedHotelRecord(h) {
  const images = collectHotelImageUrls(h);
  return {
    city: h.city || h.location?.split(',')[0]?.trim() || h.location || '—',
    name: h.name || 'Hotel',
    roomType: h.room?.name || h.roomType || 'Deluxe',
    meals:
      h.mealPlan?.label
      || (typeof h.mealPlan === 'string' ? h.mealPlan : null)
      || h.meals
      || 'Breakfast & Dinner',
    similarHotel: h.similarHotel || '',
    thumbnailUrl: images[0] || '',
    images,
    nights: h.nights,
    price: h.price ?? h.total,
  };
}

export function resolveQuoteHotels(quote) {
  const pkg = resolveQuotePackage(quote);
  if (pkg.hotels?.length) {
    return pkg.hotels.map((h, index) => ({
      day: h.day || index + 1,
      date: h.date || h.checkIn || null,
      ...h,
    }));
  }

  const lead = resolveQuoteLead(quote);
  const selectedRecords = (quote.selectedHotels || []).map(mapSelectedHotelRecord);
  const defaultHotel = selectedRecords[0];
  const itinerary = pkg.itinerary || [];
  const totalDays = Math.max(itinerary.length, Number(pkg.duration) || 1);
  const defaultNights = defaultHotel?.nights || Math.max(1, totalDays - 1);

  const hotelByName = new Map();
  selectedRecords.forEach((record) => {
    if (record.name) hotelByName.set(record.name.toLowerCase(), record);
  });

  const rows = [];

  if (itinerary.length) {
    itinerary.forEach((day, index) => {
      const dayNum = day.day || index + 1;
      const isLastDay = dayNum >= totalDays;
      let hotelName = String(day.hotel || day.accommodation || '').trim();
      const isOvernightDay = dayNum <= defaultNights || (dayNum < totalDays && !isLastDay);

      if (!hotelName && defaultHotel && isOvernightDay) {
        hotelName = defaultHotel.name;
      }
      if (!hotelName) return;

      const enrich = hotelByName.get(hotelName.toLowerCase()) || defaultHotel;
      const dayDate = getDayDate(lead.travelDate, dayNum);

      rows.push({
        day: dayNum,
        date: dayDate,
        city: enrich?.city || pkg.destination?.split(/[,·]/)[0]?.trim() || '—',
        name: hotelName,
        roomType: enrich?.roomType || 'Deluxe',
        meals: day.meals || enrich?.meals || 'Breakfast & Dinner',
        similarHotel: enrich?.similarHotel || '',
        thumbnailUrl: enrich?.thumbnailUrl || '',
        images: enrich?.images || [],
        checkIn: dayDate,
        checkOut: getDayDate(lead.travelDate, dayNum + 1),
        nights: 1,
        price: enrich?.price,
      });
    });
  }

  if (!rows.length && defaultHotel) {
    for (let night = 1; night <= defaultNights; night += 1) {
      const dayDate = getDayDate(lead.travelDate, night);
      rows.push({
        day: night,
        date: dayDate,
        city: defaultHotel.city,
        name: defaultHotel.name,
        roomType: defaultHotel.roomType,
        meals: defaultHotel.meals,
        similarHotel: defaultHotel.similarHotel,
        thumbnailUrl: defaultHotel.thumbnailUrl,
        images: defaultHotel.images,
        checkIn: dayDate,
        checkOut: getDayDate(lead.travelDate, night + 1),
        nights: 1,
        price: defaultHotel.price,
      });
    }
  }

  if (rows.length) return rows;

  const seen = new Set();
  const fromItinerary = [];
  for (const day of itinerary) {
    if (!day.hotel || seen.has(day.hotel)) continue;
    seen.add(day.hotel);
    fromItinerary.push({
      day: day.day,
      date: getDayDate(lead.travelDate, day.day),
      city: pkg.destination?.split(/[,·]/)[0]?.trim() || '—',
      name: day.hotel,
      roomType: 'Deluxe',
      meals: day.meals || 'Breakfast & Dinner',
      similarHotel: '',
      thumbnailUrl: '',
      images: [],
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
