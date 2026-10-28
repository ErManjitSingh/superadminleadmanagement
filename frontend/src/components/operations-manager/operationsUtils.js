export function formatINR(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPax(booking) {
  if (!booking) return '—';
  const quoteAdults = Number(
    booking.quotationPreview?.meta?.adults
      ?? booking.quotation?.packageInfo?.adults
      ?? booking.packageInfo?.adults
      ?? 0,
  );
  const quoteChildren = Number(
    booking.quotationPreview?.meta?.children
      ?? booking.quotation?.packageInfo?.children
      ?? booking.packageInfo?.children
      ?? 0,
  );
  // Prefer quotation counts when booking is stuck at schema default (1 adult)
  let adults = Number(booking.adults ?? 0);
  let children = Number(booking.children ?? 0);
  if (quoteAdults > 0 && (adults <= 1 || adults !== quoteAdults)) {
    adults = quoteAdults;
  }
  if (quoteChildren > 0 && children !== quoteChildren) {
    children = quoteChildren;
  }
  if (!adults && !children && booking.pax) return String(booking.pax);
  const parts = [];
  if (adults) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
  if (children) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
  return parts.length ? parts.join(', ') : '—';
}

export function formatTravelRange(booking) {
  if (!booking) return '—';
  const start = booking.travelDate || booking.travelStart;
  const end = booking.returnDate || booking.travelEnd;
  if (!start) return '—';
  return end ? `${formatDate(start)} → ${formatDate(end)}` : formatDate(start);
}
