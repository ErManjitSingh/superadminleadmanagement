/**
 * Resolve adult/child counts for bookings & vouchers.
 * Prefer quotation packageInfo (what was sold), then lead, then booking, then safe defaults.
 */
function positiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function resolveGuestCounts({ booking, lead, quotation } = {}) {
  const info = quotation?.packageInfo || {};
  const snap = quotation?.packageSnapshot || {};

  const quoteAdults = positiveInt(info.adults) || positiveInt(snap.adults);
  const quoteChildren = positiveInt(info.children ?? info.kids) || positiveInt(snap.children ?? snap.kids);

  const leadAdults = positiveInt(lead?.adults) || positiveInt(lead?.travelers) || positiveInt(lead?.pax);
  const leadChildren = positiveInt(lead?.children);

  const bookingAdults = positiveInt(booking?.adults);
  const bookingChildren = positiveInt(booking?.children);

  // Quotation wins — lead/booking often stuck at schema default 1.
  const adults = quoteAdults || leadAdults || bookingAdults || 2;
  const children = quoteChildren || leadChildren || bookingChildren || 0;

  return { adults, children };
}

module.exports = {
  resolveGuestCounts,
  positiveInt,
};
