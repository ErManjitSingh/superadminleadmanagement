const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');
const Lead = require('../models/Lead');
const Booking = require('../models/Booking');
const User = require('../models/User');
const {
  quotationOmitsHotels,
  stripHotelsFromPackageSnapshot,
} = require('../utils/noHotelUtils');

const VEHICLE_TYPES = new Set(['sedan', 'suv', 'innova', 'tempo_traveller', 'bus', 'other']);

function addDays(date, days) {
  if (!date) return null;
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days));
  return d;
}

function asTextValue(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.label || value.name || value.value || value.title || '';
  }
  return String(value);
}

/** Keep catalog ids ("hotel-1") and real ObjectIds as strings; drop empty. */
function asIdString(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'object' && value._id) return String(value._id);
  const s = String(value).trim();
  return s || undefined;
}

/** Only pass Mongo ObjectIds into ObjectId schema fields. */
function asObjectIdOrUndefined(value) {
  const s = asIdString(value);
  if (!s) return undefined;
  if (mongoose.Types.ObjectId.isValid(s) && String(new mongoose.Types.ObjectId(s)) === s) {
    return s;
  }
  return undefined;
}

function asVehicleType(value) {
  const raw = String(value || 'suv').toLowerCase().replace(/\s+/g, '_');
  if (VEHICLE_TYPES.has(raw)) return raw;
  if (raw.includes('innova')) return 'innova';
  if (raw.includes('tempo') || raw.includes('traveller')) return 'tempo_traveller';
  if (raw.includes('sedan') || raw.includes('dzire') || raw.includes('etios')) return 'sedan';
  if (raw.includes('bus') || raw.includes('coach')) return 'bus';
  if (raw.includes('suv') || raw.includes('ertiga') || raw.includes('xuv') || raw.includes('crysta')) return 'suv';
  return 'other';
}

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

function hotelStayNights(h = {}) {
  const n = Number(h.nights);
  if (Number.isFinite(n) && n > 0) return n;
  const start = parseLocalDate(h.checkIn);
  const end = parseLocalDate(h.checkOut);
  if (!start || !end) return 1;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function dayNumberFromTravel(travelStart, dateValue) {
  const start = parseLocalDate(travelStart);
  const d = parseLocalDate(dateValue);
  if (!start || !d) return null;
  return Math.round((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/** Resolve which selected hotel covers an itinerary day (multi-night aware). */
function resolveHotelForDay(selectedHotels, dayNum, travelDate, duration) {
  if (!selectedHotels.length) return null;
  const maxOvernight = Math.max(0, (Number(duration) || 0) - 1);
  if (maxOvernight > 0 && dayNum > maxOvernight) return null;

  const stays = selectedHotels.map((h) => {
    const nights = hotelStayNights(h);
    let startDay = dayNumberFromTravel(travelDate, h.checkIn);
    if (!startDay || startDay < 1) {
      if (selectedHotels.length === 1 || nights === 1) {
        startDay = Number(h.day) > 0 ? Number(h.day) : null;
      } else {
        startDay = null;
      }
    }
    return { h, nights, startDay };
  });

  let cursor = 1;
  stays.forEach((stay) => {
    if (!stay.startDay || stay.startDay < 1) stay.startDay = cursor;
    cursor = stay.startDay + stay.nights;
  });

  if (stays.length === 1) {
    const stay = stays[0];
    let endDay = stay.startDay + stay.nights - 1;
    if (stay.startDay <= 1 && maxOvernight > 0 && endDay < maxOvernight) {
      endDay = maxOvernight;
    }
    if (dayNum >= stay.startDay && dayNum <= endDay) return stay.h;
    return null;
  }

  for (const stay of stays) {
    const endDay = stay.startDay + stay.nights - 1;
    if (dayNum >= stay.startDay && dayNum <= endDay) return stay.h;
  }
  return null;
}

function mapQuoteItinerary(quotation, travelDate) {
  const omitHotels = quotationOmitsHotels(quotation);
  const snap = quotation?.packageSnapshot || {};
  const days = snap.itinerary || [];
  const selectedHotels = omitHotels ? [] : (quotation?.selectedHotels || []).filter((h) =>
    String(h?.name || h?.hotelName || '').trim(),
  );
  const duration = Number(
    quotation?.packageInfo?.duration || snap.duration || days.length || 0,
  );

  if (!days.length) return [];

  return days.map((d, i) => {
    const dayNum = d.day || i + 1;
    const hotelForDay = omitHotels
      ? null
      : resolveHotelForDay(selectedHotels, dayNum, travelDate, duration);
    const dayDate = travelDate ? addDays(travelDate, dayNum - 1) : null;

    // Prefer SE-selected hotel name over generic itinerary accommodation text
    const hotelName = omitHotels
      ? ''
      : (hotelForDay?.name || hotelForDay?.hotelName || d.accommodation || d.hotel || '');
    const dayHotel = !omitHotels && (hotelForDay || hotelName)
      ? {
          hotelName: hotelForDay?.name || hotelForDay?.hotelName || hotelName,
          destination: hotelForDay?.location || hotelForDay?.city || hotelForDay?.destination || '',
          location: hotelForDay?.location || hotelForDay?.city || '',
          roomType: hotelForDay?.room?.name || hotelForDay?.room || hotelForDay?.roomType || '',
          mealPlan: asTextValue(hotelForDay?.mealPlan),
          source: hotelForDay ? 'manual' : 'manual',
        }
      : undefined;

    return {
      day: dayNum,
      title: d.title || `Day ${dayNum}`,
      description: d.description || '',
      meals: d.meals || '',
      accommodation: hotelName,
      transport: d.transport || '',
      activities: d.activities || d.sightseeing || d.activityNotes || '',
      date: dayDate,
      ...(dayHotel ? { dayHotel } : {}),
    };
  });
}

function mapQuoteHotels(quotation, travelDate) {
  // Cab-only / No Hotel quotes must never inherit package hotels.
  if (quotationOmitsHotels(quotation)) return [];

  const rawSelected = Array.isArray(quotation?.selectedHotels) ? quotation.selectedHotels : null;
  if (rawSelected) {
    const selected = rawSelected.filter((h) => String(h?.name || h?.hotelName || '').trim());
    // Explicit selection list (even empty) wins — do not fall back to package hotels
    if (!selected.length) return [];
    return selected.map((h) => {
      const checkIn = travelDate && h.day ? addDays(travelDate, Number(h.day) - 1) : h.checkIn || null;
      const nights = Number(h.nights) || 1;
      const checkOut = checkIn ? addDays(checkIn, nights) : h.checkOut || null;
      const roomType = asTextValue(h.room?.name || h.roomType) || (typeof h.room === 'string' ? h.room : '');

      return {
        hotelId: asIdString(h.hotelId) || '',
        hotelName: h.name || h.hotelName || '',
        destination: h.location || h.city || h.destination || '',
        category: asTextValue(h.category),
        roomType,
        mealPlan: asTextValue(h.mealPlan),
        phone: asTextValue(h.phone || h.hotelPhone),
        day: h.day,
        nights,
        checkIn,
        checkOut,
        notes: h.externalSource ? `Source: ${h.externalSource}` : '',
        status: 'pending',
      };
    });
  }

  // Legacy quotes without selectedHotels field: use package snapshot hotels
  const snap = quotation?.packageSnapshot || {};
  return (snap.hotels || []).map((h) => ({
    hotelId: asIdString(h.hotelId) || '',
    hotelName: h.name || h.hotelName || '',
    destination: h.location || h.destination || '',
    category: asTextValue(h.category),
    roomType: asTextValue(h.roomType || h.room?.name),
    mealPlan: asTextValue(h.mealPlan),
    phone: asTextValue(h.phone || h.hotelPhone),
    status: 'pending',
  }));
}

function mapQuoteTransport(quotation) {
  const selected = quotation?.selectedCabs || [];
  // Operations keeps a single cab voucher for the whole trip
  return selected.slice(0, 1).map((t) => ({
    vendorId: asObjectIdOrUndefined(t.vendorId),
    vendorName: t.vendorName || t.vendor || '',
    vendorPhone: t.vendorPhone || '',
    vehicleType: asVehicleType(t.vehicleType || t.type),
    pickupLocation: t.pickup || t.pickupLocation || '',
    dropLocation: t.drop || t.dropLocation || '',
    driverName: t.driverName || '',
    driverPhone: t.driverPhone || t.vendorPhone || '',
    vehicleNumber: t.vehicleNumber || '',
    status: 'pending',
  }));
}

function mapQuoteActivities(quotation) {
  const selected = quotation?.selectedActivities || [];
  return selected.map((a) => ({
    name: a.name || a.title || '',
    vendorName: a.vendorName || '',
    scheduledAt: a.date || a.scheduledAt || null,
    status: 'pending',
  }));
}

async function resolveQuotationForBooking(booking) {
  if (booking.quotation) {
    const q = await Quotation.findById(booking.quotation).lean();
    if (q) return q;
  }
  if (booking.lead) {
    return Quotation.findOne({ lead: booking.lead })
      .sort({ updatedAt: -1 })
      .lean();
  }
  if (booking.quotationReference) {
    return Quotation.findOne({ quoteNumber: booking.quotationReference }).lean();
  }
  return null;
}

async function extractFulfillmentFromQuotation(quotation, booking = {}) {
  let quote = quotation;
  // Ensure lead hotelCategory is available for no-hotel detection
  if (quote && !quote.lead?.hotelCategory && (quote.lead || booking.lead)) {
    const leadId = quote.lead?._id || quote.lead || booking.lead;
    if (leadId) {
      const leadDoc = await Lead.findById(leadId).select('hotelCategory assignedTo').lean();
      if (leadDoc) {
        quote = { ...quote, lead: { ...(typeof quote.lead === 'object' ? quote.lead : {}), ...leadDoc } };
      }
    }
  }

  const omitsHotels = quotationOmitsHotels(quote);
  const snap = omitsHotels
    ? stripHotelsFromPackageSnapshot(quote?.packageSnapshot || {})
    : (quote?.packageSnapshot || {});
  const travelDate = booking.travelDate || null;
  let executiveName = booking.executiveName || '';

  if (!executiveName && quote?.createdByExecutive) {
    const exec = await User.findById(quote.createdByExecutive).select('name').lean();
    executiveName = exec?.name || '';
  }

  if (!executiveName) {
    const leadId = quote?.lead?._id || quote?.lead || booking?.lead;
    if (leadId) {
      const lead = await Lead.findById(leadId).select('assignedTo').lean();
      if (lead?.assignedTo) {
        const exec = await User.findById(lead.assignedTo).select('name').lean();
        executiveName = exec?.name || '';
      }
    }
  }

  return {
    itinerary: mapQuoteItinerary(quote, travelDate),
    hotels: mapQuoteHotels(quote, travelDate),
    transport: mapQuoteTransport(quote),
    activities: mapQuoteActivities(quote),
    packageName: snap.name || snap.title || booking.packageName || '',
    destination: snap.destination || booking.destination || '',
    quotationReference: quote?.quoteNumber || booking.quotationReference || '',
    executiveName,
    totalAmount: quote?.pricing?.total || quote?.costing?.grandTotal || booking.totalAmount,
    omitsHotels,
    meta: {
      quoteNumber: quote?.quoteNumber,
      quoteId: quote?._id,
      quoteStatus: quote?.status,
      packageName: snap.name || snap.title,
      inclusions: snap.inclusions || [],
      exclusions: snap.exclusions || [],
    },
  };
}

async function syncBookingFromQuotation(bookingId, { force = false } = {}) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return null;

  const quotation = await resolveQuotationForBooking(booking);
  if (!quotation) return { booking, quotation: null, synced: false };

  const extracted = await extractFulfillmentFromQuotation(quotation, booking);
  const patch = {};
  const omitsHotels = quotationOmitsHotels(quotation);

  if (force || !booking.itinerary?.length) {
    if (extracted.itinerary.length) patch.itinerary = extracted.itinerary;
  }
  if (omitsHotels || !(extracted.hotels || []).length) {
    // Clear leaked package hotels / hotel confirmation when quote is cab-only / no hotel
    patch.hotels = [];
    if (booking.hotelConfirmation !== 'not_required') {
      patch.hotelConfirmation = 'not_required';
    }
  } else if (force || !booking.hotels?.length) {
    if (extracted.hotels.length) {
      patch.hotels = extracted.hotels;
      if (!booking.hotelConfirmation || booking.hotelConfirmation === 'not_required') {
        patch.hotelConfirmation = 'pending';
      }
    }
  }
  if (force || !booking.transport?.length) {
    if (extracted.transport.length) patch.transport = extracted.transport;
  }
  if (force || !booking.activities?.length) {
    if (extracted.activities.length) patch.activities = extracted.activities;
  }
  if (!booking.packageName && extracted.packageName) patch.packageName = extracted.packageName;
  if (!booking.quotationReference && extracted.quotationReference) {
    patch.quotationReference = extracted.quotationReference;
  }
  if (!booking.quotation && quotation._id) patch.quotation = quotation._id;
  if (!booking.executiveName && extracted.executiveName) patch.executiveName = extracted.executiveName;

  let updated = booking;
  if (Object.keys(patch).length) {
    updated = await Booking.findByIdAndUpdate(bookingId, patch, { new: true }).lean();
  }

  return {
    booking: updated,
    quotation,
    quotationPreview: extracted,
    synced: Object.keys(patch).length > 0,
  };
}

async function enrichBookingWithQuotation(booking) {
  const quotation = await resolveQuotationForBooking(booking);
  if (!quotation) return booking;

  const preview = await extractFulfillmentFromQuotation(quotation, booking);
  const needsAutoSync =
    !booking.itinerary?.length ||
    !booking.hotels?.length ||
    (!booking.transport?.length && preview.transport.length > 0);

  if (needsAutoSync) {
    const result = await syncBookingFromQuotation(booking._id, { force: false });
    if (result?.booking) {
      return {
        ...result.booking,
        executiveName: result.booking.executiveName || result.quotationPreview?.executiveName || '',
        quotationPreview: result.quotationPreview,
        quotationMeta: result.quotationPreview?.meta,
        autoSyncedFromQuotation: result.synced,
      };
    }
  }

  return {
    ...booking,
    executiveName: booking.executiveName || preview.executiveName || '',
    quotation: booking.quotation || quotation._id,
    quotationReference: booking.quotationReference || preview.quotationReference || '',
    quotationPreview: preview,
    quotationMeta: preview.meta,
  };
}

module.exports = {
  mapQuoteItinerary,
  mapQuoteHotels,
  mapQuoteTransport,
  mapQuoteActivities,
  extractFulfillmentFromQuotation,
  syncBookingFromQuotation,
  enrichBookingWithQuotation,
  resolveQuotationForBooking,
};
