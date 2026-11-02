/**
 * Resolve adult/child counts for bookings & vouchers.
 * Prefer the richest credible count — Lead/Booking schema default `1` often
 * shadows travelers/pax and quotation packageInfo.
 */
function positiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function isPopulatedDoc(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && !(value._bsontype === 'ObjectID' || value._bsontype === 'ObjectId')
    && (value.packageInfo != null
      || value.packageSnapshot != null
      || value.adults != null
      || value.travelers != null
      || value.pax != null
      || value.children != null
      || value.name != null
      || value.phone != null),
  );
}

function resolveGuestCounts({ booking, lead, quotation } = {}) {
  const quote = isPopulatedDoc(quotation) ? quotation : null;
  const leadDoc = isPopulatedDoc(lead) ? lead : (isPopulatedDoc(booking?.lead) ? booking.lead : null);
  const info = quote?.packageInfo || {};
  const snap = quote?.packageSnapshot || {};

  const quoteAdults = positiveInt(info.adults) || positiveInt(snap.adults);
  const quoteChildren = positiveInt(info.children ?? info.kids) || positiveInt(snap.children ?? snap.kids);

  const leadTravelers = positiveInt(leadDoc?.travelers) || positiveInt(leadDoc?.pax);
  const leadAdults = positiveInt(leadDoc?.adults);
  const leadChildren = positiveInt(leadDoc?.children);

  const bookingAdults = positiveInt(booking?.adults);
  const bookingChildren = positiveInt(booking?.children);

  // Take the highest credible adult count so schema default `1` cannot hide 4 travelers.
  const adultCandidates = [quoteAdults, leadTravelers, leadAdults, bookingAdults].filter((n) => n > 0);
  const adults = adultCandidates.length ? Math.max(...adultCandidates) : 2;

  const childCandidates = [quoteChildren, leadChildren, bookingChildren].filter((n) => n > 0);
  const children = childCandidates.length ? Math.max(...childCandidates) : 0;

  return { adults, children };
}

module.exports = {
  resolveGuestCounts,
  positiveInt,
  isPopulatedDoc,
};
