/**
 * Shared helpers: when a quote/lead explicitly has no hotel (cab-only etc.),
 * hotels must not leak from packageSnapshot into booking/vouchers/PDFs.
 */

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

function normalizeLabel(value) {
  if (value == null) return '';
  if (typeof value === 'object') {
    return String(value.label || value.name || value.value || '').trim().toLowerCase();
  }
  return String(value).trim().toLowerCase();
}

function isNoHotelLabel(value) {
  const v = normalizeLabel(value);
  return Boolean(v) && NO_HOTEL_VALUES.has(v);
}

function isNoHotelMealPlan(mealPlan) {
  return isNoHotelLabel(mealPlan);
}

/**
 * True when quotation / lead indicates hotels should be omitted entirely.
 * Note: empty selectedHotels alone is NOT enough here — drafts may save mid-edit.
 * PDF rendering uses quoteHasHotels() for stricter “no hotel selected” checks.
 */
function quotationOmitsHotels(quotation = {}, lead = null) {
  const info = quotation.packageInfo || {};
  if (isNoHotelMealPlan(info.mealPlan)) return true;

  const leadDoc = lead || quotation.lead || {};
  const category = info.hotelCategory || leadDoc.hotelCategory || '';
  if (isNoHotelLabel(category)) return true;

  return false;
}

/** Stricter check for PDFs / display: no named hotels selected → hide all hotel content */
function quoteHasHotels(quotation = {}, lead = null) {
  if (quotationOmitsHotels(quotation, lead)) return false;
  if (Array.isArray(quotation.selectedHotels)) {
    return quotation.selectedHotels.some((h) => String(h?.name || h?.hotelName || '').trim());
  }
  const snap = quotation.packageSnapshot || quotation.package || {};
  return (snap.hotels || []).some((h) => String(h?.name || h?.hotelName || '').trim());
}

function stripHotelsFromPackageSnapshot(snapshot = {}) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  const itinerary = Array.isArray(snapshot.itinerary)
    ? snapshot.itinerary.map((day) => ({
        ...day,
        hotel: '',
        accommodation: '',
        dayHotel: undefined,
      }))
    : snapshot.itinerary;

  const inclusions = Array.isArray(snapshot.inclusions)
    ? snapshot.inclusions.filter((line) => {
        const t = String(line || '').toLowerCase();
        return !/\bhotel/.test(t) && !/\baccommodation/.test(t) && !/\bstay\b/.test(t);
      })
    : snapshot.inclusions;

  return {
    ...snapshot,
    hotels: [],
    itinerary,
    inclusions,
  };
}

function sanitizeQuotationPayloadForNoHotel(body = {}, lead = null) {
  const quotationLike = {
    packageInfo: body.packageInfo || {},
    selectedHotels: body.selectedHotels,
    lead,
  };
  if (!quotationOmitsHotels(quotationLike, lead) && !isNoHotelMealPlan(body.packageInfo?.mealPlan)) {
    // Also honor explicit empty hotels + skip when meal plan is No Hotel already handled
    if (!(isNoHotelLabel(body.packageInfo?.hotelCategory) || isNoHotelLabel(lead?.hotelCategory))) {
      return body;
    }
  }

  const pkg = body.package ? stripHotelsFromPackageSnapshot(body.package) : body.package;
  return {
    ...body,
    selectedHotels: [],
    package: pkg,
    packageInfo: {
      ...(body.packageInfo || {}),
      mealPlan: body.packageInfo?.mealPlan || 'No Hotel',
      hotelCategory: '',
    },
  };
}

module.exports = {
  isNoHotelLabel,
  isNoHotelMealPlan,
  quotationOmitsHotels,
  quoteHasHotels,
  stripHotelsFromPackageSnapshot,
  sanitizeQuotationPayloadForNoHotel,
};
