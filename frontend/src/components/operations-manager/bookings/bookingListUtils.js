import { BOOKING_STATUS_CONFIG } from '../constants';

const DESTINATION_FLAGS = {
  Singapore: '🇸🇬',
  Bali: '🇮🇩',
  Dubai: '🇦🇪',
  Thailand: '🇹🇭',
  Maldives: '🇲🇻',
  Goa: '🇮🇳',
  Kerala: '🇮🇳',
  Manali: '🇮🇳',
  Europe: '🇪🇺',
  Kashmir: '🇮🇳',
  Ladakh: '🇮🇳',
  Himachal: '🇮🇳',
};

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-indigo-500',
];

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getDestinationFlag(destination = '') {
  const key = Object.keys(DESTINATION_FLAGS).find((d) =>
    destination.toLowerCase().includes(d.toLowerCase())
  );
  return key ? DESTINATION_FLAGS[key] : '🌍';
}

export function formatTravelDateWithDay(dateStr, style = 'default') {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (style === 'parentheses') {
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
    return `${date} (${day})`;
  }
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatINRCompact(amount) {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildSparkline(base, points = 8) {
  const n = Number(base) || 0;
  if (n <= 0) return Array(points).fill(0);
  return Array.from({ length: points }, (_, i) =>
    Math.round((n / points) * (0.55 + (i / points) * 0.95 + Math.sin(i * 0.8) * 0.1))
  );
}

export function resolveListStatus(booking, listStatus = 'pending') {
  if (!booking) return { label: '—', className: 'bg-slate-100 text-slate-600' };

  if (listStatus === 'active') {
    return resolveActiveTripStatus(booking);
  }

  if (listStatus === 'completed') {
    if (booking.voucherStatus === 'redeemed') {
      return { label: 'Fulfilled', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };
    }
    if (booking.paymentStatus === 'paid') {
      return { label: 'Completed', className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' };
    }
    return { label: 'Closed', className: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' };
  }

  if (listStatus === 'confirmed' || booking.status === 'confirmed') {
    return { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300' };
  }

  if (booking.paymentStatus === 'pending' || booking.paymentStatus === 'partial') {
    return { label: 'Payment Pending', className: 'bg-orange-100 text-orange-700' };
  }
  if (booking.status === 'booking_received') {
    return { label: 'Booking Received', className: 'bg-sky-100 text-sky-700' };
  }
  if (booking.status === 'pending_verification' || booking.status === 'pending') {
    return { label: 'Under Process', className: 'bg-violet-100 text-violet-700' };
  }

  const cfg = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.pending;
  return {
    label: cfg.label,
    className: cfg.className.replace(/ring-\S+/g, '').replace(/\/15/g, '/20'),
  };
}

export function formatDateRangeLabel(from, to) {
  const fmt = (d) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!from && !to) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return `${fmt(start)} – ${fmt(end)}`;
  }
  if (from && to) return `${fmt(new Date(from))} – ${fmt(new Date(to))}`;
  if (from) return `From ${fmt(new Date(from))}`;
  return `Until ${fmt(new Date(to))}`;
}

export function isNewBooking(booking, days = 14) {
  if (!booking?.createdAt) return false;
  const created = new Date(booking.createdAt).getTime();
  return Date.now() - created <= days * 86400000;
}

export function getPrimaryHotelName(booking) {
  return (
    booking?.hotels?.[0]?.hotelName
    || booking?.itinerary?.[0]?.dayHotel?.hotelName
    || booking?.itinerary?.[0]?.accommodation
    || null
  );
}

export function getPrimaryCabLabel(booking) {
  const transport = booking?.transport?.[0];
  if (!transport) return null;
  const vehicle = transport.vehicleType
    ? String(transport.vehicleType).replace(/_/g, ' ')
    : '';
  if (vehicle && transport.vendorName) return `${vehicle} · ${transport.vendorName}`;
  return vehicle || transport.vendorName || transport.pickupLocation || null;
}

export function countActiveBookingFilters(filters) {
  return Object.values(filters).filter((v) => v !== '' && v != null).length;
}

export function formatPercent(part, total) {
  if (!total) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}

function isSameCalendarDay(a, b = new Date()) {
  if (!a) return false;
  const d = new Date(a);
  return d.toDateString() === new Date(b).toDateString();
}

export function resolveActiveTripStatus(booking) {
  const travel = booking?.travelDate || booking?.travelStart;
  const returnDate = booking?.returnDate || booking?.travelEnd;
  const today = new Date();

  if (isSameCalendarDay(travel, today)) {
    return { label: 'On Trip', className: 'bg-orange-100 text-orange-700' };
  }
  if (travel && new Date(travel) < today && (!returnDate || new Date(returnDate) >= today)) {
    return { label: 'Traveling', className: 'bg-sky-100 text-sky-700' };
  }
  return { label: 'In Progress', className: 'bg-emerald-100 text-emerald-700' };
}

export function formatCompletedReturnDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
  return `${date} (${day})`;
}

export function formatActiveTravelDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (isSameCalendarDay(d)) return `${date} (Today)`;
  const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
  return `${date} (${day})`;
}

export function getHotelDisplayDetail(booking) {
  if (booking?.hotelConfirmation === 'confirmed') {
    return getPrimaryHotelName(booking);
  }
  if (booking?.hotelConfirmation === 'pending' || !booking?.hotelConfirmation) {
    return 'To be assigned';
  }
  return getPrimaryHotelName(booking);
}

export function getCabDisplayDetail(booking) {
  const transport = booking?.transport?.[0];
  if (booking?.cabConfirmation === 'confirmed') {
    return transport?.vehicleNumber || getPrimaryCabLabel(booking);
  }
  if (booking?.cabConfirmation === 'pending' || !booking?.cabConfirmation) {
    return 'To be assigned';
  }
  return getPrimaryCabLabel(booking);
}
