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
  const adults = booking.adults ?? 0;
  const children = booking.children ?? 0;
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
