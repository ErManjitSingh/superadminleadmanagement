import { getPackageTypeConfig } from './quotationUtils';
import { getPackageCategoryLabel, QUOTE_BANK_ACCOUNTS, QUOTE_PAYMENT_DETAILS, QUOTE_POLICIES, QUOTE_REFUND_POLICY, QUOTE_TERMS_OF_SERVICE, resolveQuoteExclusions, resolveQuoteInclusions } from './quoteTemplateDefaults';

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

function mapSelectedHotelRecord(h, lead, pkg) {
  const hotelImages = collectHotelOnlyImages(h);
  const roomImages = collectRoomImages(h);
  return {
    day: h.day,
    date: h.day ? getDayDate(lead.travelDate, h.day) : null,
    city: h.city || h.location?.split(',')[0]?.trim() || h.location || pkg.destination?.split(/[,·]/)[0]?.trim() || '—',
    name: h.name || 'Hotel',
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
    nights: h.nights || 1,
    price: h.price ?? h.total,
  };
}

export function resolveDayHotelMap(quote) {
  const lead = resolveQuoteLead(quote);
  const pkg = resolveQuotePackage(quote);
  const map = new Map();
  resolveQuoteHotels(quote).forEach((row) => {
    if (row.day) map.set(row.day, row);
  });
  if (map.size === 0) {
    resolveQuoteHotels(quote).forEach((row, index) => {
      map.set(row.day || index + 1, row);
    });
  }
  return { map, lead, pkg };
}

export function resolveDayHotelForItinerary(quote, dayNum) {
  const { map, pkg } = resolveDayHotelMap(quote);
  if (map.has(dayNum)) return map.get(dayNum);

  const hotels = resolveQuoteHotels(quote);
  if (!hotels.length) return null;

  const duration = Math.max(
    1,
    Number(pkg.duration || quote?.packageInfo?.duration || hotels.length + 1),
  );
  // Last day is usually departure — no overnight hotel.
  if (dayNum >= duration) return null;

  // Same hotel for entire trip: reuse first hotel on every overnight day.
  return hotels[0] || null;
}

export function resolveQuoteHotels(quote) {
  const pkg = resolveQuotePackage(quote);
  const lead = resolveQuoteLead(quote);

  if (pkg.hotels?.length) {
    return pkg.hotels.map((h, index) => ({
      day: h.day || index + 1,
      date: h.date || h.checkIn || getDayDate(lead.travelDate, h.day || index + 1),
      hotelImages: h.hotelImages || collectHotelOnlyImages(h),
      roomImages: h.roomImages || collectRoomImages(h),
      roomImage: h.roomImage || collectRoomImages(h)[0] || '',
      ...h,
    }));
  }

  const dayKeyed = (quote.selectedHotels || []).filter((h) => h.day && h.name);
  if (dayKeyed.length) {
    return dayKeyed
      .map((h) => mapSelectedHotelRecord(h, lead, pkg))
      .sort((a, b) => a.day - b.day);
  }

  const selectedRecords = (quote.selectedHotels || []).map((h) => mapSelectedHotelRecord(h, lead, pkg));
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
        thumbnailUrl: enrich?.thumbnailUrl || enrich?.hotelImages?.[0] || '',
        hotelImages: enrich?.hotelImages || [],
        roomImages: enrich?.roomImages || [],
        roomImage: enrich?.roomImage || enrich?.roomImages?.[0] || '',
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
        hotelImages: defaultHotel.hotelImages || [],
        roomImages: defaultHotel.roomImages || [],
        roomImage: defaultHotel.roomImage || '',
        images: defaultHotel.images || [],
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
    terms: p.terms?.length ? p.terms : QUOTE_TERMS_OF_SERVICE,
    confirmation: p.confirmation?.length ? p.confirmation : QUOTE_PAYMENT_DETAILS,
    cancellation: p.cancellation?.length ? p.cancellation : QUOTE_REFUND_POLICY,
    amendment: p.amendment || QUOTE_POLICIES.amendment,
    inclusions: resolveQuoteInclusions(quote),
    exclusions: resolveQuoteExclusions(quote),
    refundPolicy: QUOTE_REFUND_POLICY,
    paymentDetails: QUOTE_PAYMENT_DETAILS,
    termsOfService: QUOTE_TERMS_OF_SERVICE,
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
    { label: 'Advance (Booking Amount)', percent: 30 },
    { label: 'Balance (3 days prior to trip)', percent: 70 },
  ];

  return schedule.map((row) => ({
    label: row.label,
    percent: row.percent,
    amount: Math.round((amount * row.percent) / 100),
  }));
}

export function resolveQuoteTotal(quote) {
  const p = quote?.pricing || {};
  const c = quote?.costing || {};

  const candidates = [
    p.grandTotal,
    p.total,
    p.baseCost,
    c.grandTotal,
    c.subtotal,
    quote?.totalPrice,
    quote?.packageInfo?.totalCost,
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
  const total = Number(lead.travelers) || 2;
  return {
    adults: info.adults ?? pkg.adults ?? Math.max(1, total - (pkg.kids || info.children || 0)),
    kids: info.children ?? pkg.kids ?? 0,
    rooms: pkg.rooms ?? Math.ceil((Number(info.adults) || total) / 2),
    extraBeds: pkg.extraBeds ?? 0,
  };
}
