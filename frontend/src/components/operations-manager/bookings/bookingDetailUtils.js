const DESTINATION_IMAGES = [
  { match: /kashmir|srinagar|gulmarg|pahalgam/i, url: 'https://images.unsplash.com/photo-1595815774626-957cb5c0d5e3?w=800&q=80' },
  { match: /goa|calangute|panaji/i, url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80' },
  { match: /manali|himachal|shimla/i, url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80' },
  { match: /kerala|munnar|alleppey/i, url: 'https://images.unsplash.com/photo-1602216059996-18fef6b5934a?w=800&q=80' },
  { match: /rajasthan|jaipur|udaipur/i, url: 'https://images.unsplash.com/photo-1477587451673-041ed90a7e3b?w=800&q=80' },
];

const TYPE_IMAGES = {
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  transport: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80',
  activity: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',
  travel_kit: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
};

const DEFAULT_HERO = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&q=80';

export function getDestinationImage(destination = '') {
  const hit = DESTINATION_IMAGES.find((d) => d.match.test(destination));
  return hit?.url || DEFAULT_HERO;
}

export function getVoucherTypeImage(type) {
  return TYPE_IMAGES[type] || DEFAULT_HERO;
}

export function destinationTags(destination = '') {
  return destination
    .split(/[,/&+]/).map((s) => s.trim()).filter(Boolean);
}

export function getExecutiveDisplayName(booking) {
  return booking?.executiveName
    || booking?.quotationPreview?.executiveName
    || booking?.assignedExecutiveName
    || '';
}

export function hasLinkedQuotation(booking) {
  return !!(booking?.quotation || booking?.quotationReference || booking?.quotationMeta?.quoteId);
}

/** True when booking actually has hotel assignments (cab-only bookings return false). */
export function bookingHasHotels(booking) {
  return (booking?.hotels || []).some((h) => String(h?.hotelName || h?.name || '').trim());
}

export function bookingHasTransport(booking) {
  return (booking?.transport || []).some((t) => String(t?.vehicleType || t?.vendorName || '').trim());
}

export function buildBookingProgressSteps(booking, execution, paymentSummary) {
  const vouchers = execution?.activeVouchers || [];
  const voucherDone = vouchers.some((v) => v.status !== 'draft');
  const supplierDone = vouchers.some((v) => v.vendorStatus === 'confirmed')
    || booking?.hotelConfirmation === 'confirmed'
    || booking?.cabConfirmation === 'confirmed';
  const paymentStatus = paymentSummary?.paymentStatus || booking?.paymentStatus || 'pending';
  const paymentDone = paymentStatus === 'paid';
  const paymentActive = ['partial', 'overdue'].includes(paymentStatus) || (paymentSummary?.totalPaid > 0 && !paymentDone);
  const readyToTravel = ['confirmed', 'in_progress'].includes(booking?.status) && voucherDone && supplierDone;
  const tripDone = booking?.status === 'completed';

  const steps = [
    { key: 'voucher', label: 'Voucher Generated', state: voucherDone ? 'done' : 'pending' },
    { key: 'supplier', label: 'Supplier Confirmed', state: supplierDone ? 'done' : voucherDone ? 'current' : 'pending' },
    { key: 'payment', label: 'Payment Collection', state: paymentDone ? 'done' : paymentActive ? 'current' : 'pending' },
    { key: 'ready', label: 'Ready to Travel', state: tripDone ? 'done' : readyToTravel ? 'current' : 'pending' },
    { key: 'completed', label: 'Trip Completed', state: tripDone ? 'done' : 'pending' },
  ];

  if (tripDone) steps.forEach((s) => { s.state = 'done'; });
  return steps;
}

/** Full command-center stepper (hotel step skipped when no hotels). */
export function buildCommandProgressSteps(booking, execution, paymentSummary) {
  const hasHotels = bookingHasHotels(booking);
  const vouchers = execution?.activeVouchers || [];
  const advancePaid = (paymentSummary?.advanceReceived || booking?.advanceReceived || 0) > 0
    || (paymentSummary?.totalPaid || booking?.totalPaid || 0) > 0;
  const paymentDone = (paymentSummary?.paymentStatus || booking?.paymentStatus) === 'paid';
  const hotelDone = booking?.hotelConfirmation === 'confirmed'
    || (booking?.hotels || []).some((h) => h.status === 'confirmed');
  const cabDone = booking?.cabConfirmation === 'confirmed'
    || (booking?.transport || []).some((t) => t.status === 'confirmed');
  const voucherDone = vouchers.some((v) => !['draft', 'archived'].includes(v.status));
  const tripRunning = booking?.status === 'in_progress';
  const tripDone = booking?.status === 'completed';
  const quoteOk = ['confirmed', 'in_progress', 'completed', 'booking_received'].includes(booking?.status)
    || hasLinkedQuotation(booking);

  const mark = (done, currentIf) => {
    if (tripDone || done) return 'done';
    if (currentIf) return 'current';
    return 'pending';
  };

  const steps = [
    { key: 'lead', label: 'Lead Won', state: 'done' },
    { key: 'quote', label: 'Quotation Approved', state: mark(quoteOk, !quoteOk) },
    { key: 'advance', label: 'Advance Received', state: mark(advancePaid || paymentDone, quoteOk && !advancePaid) },
  ];

  if (hasHotels) {
    steps.push({
      key: 'hotel',
      label: 'Hotel Confirmed',
      state: mark(hotelDone, advancePaid && !hotelDone),
    });
  }

  steps.push(
    {
      key: 'cab',
      label: 'Cab Confirmed',
      state: mark(cabDone, (hasHotels ? hotelDone : advancePaid) && !cabDone),
    },
    {
      key: 'voucher',
      label: 'Voucher Generated',
      state: mark(voucherDone, cabDone && !voucherDone),
    },
    {
      key: 'running',
      label: 'Trip Running',
      state: mark(tripRunning || tripDone, voucherDone && !tripRunning && !tripDone),
    },
    {
      key: 'completed',
      label: 'Trip Completed',
      state: mark(tripDone, tripRunning && !tripDone),
    },
  );

  if (tripDone) steps.forEach((s) => { s.state = 'done'; });
  return steps;
}

export function buildActionCenterItems(booking, execution, paymentSummary) {
  const hasHotels = bookingHasHotels(booking);
  const vouchers = execution?.activeVouchers || [];
  const hotelVoucher = vouchers.find((v) => v.type === 'hotel' && v.isActive !== false);
  const cab = booking?.transport?.[0] || {};
  const remaining = paymentSummary?.remainingBalance
    ?? Math.max(0, (booking?.totalAmount || 0) - (booking?.totalPaid || booking?.advanceReceived || 0));
  const advance = paymentSummary?.advanceReceived || booking?.advanceReceived || 0;
  const items = [];

  if (booking?.cabConfirmation !== 'confirmed') {
    items.push({
      id: 'cab-pending',
      title: 'Cab Pending',
      description: cab.driverName ? 'Awaiting cab confirmation' : 'Driver / cab not confirmed yet',
      priority: 'high',
      tone: 'rose',
    });
  }

  if (hasHotels && !hotelVoucher) {
    items.push({
      id: 'hotel-voucher',
      title: 'Hotel Voucher Missing',
      description: 'Generate & send hotel voucher',
      priority: 'medium',
      tone: 'amber',
    });
  }

  if (remaining > 0) {
    items.push({
      id: 'payment-due',
      title: 'Payment Due',
      description: `₹${Number(remaining).toLocaleString('en-IN')} still outstanding`,
      priority: 'medium',
      tone: 'amber',
    });
  }

  if (!cab.driverName && bookingHasTransport(booking)) {
    items.push({
      id: 'driver',
      title: 'Driver Not Assigned',
      description: 'Assign driver before trip start',
      priority: 'low',
      tone: 'sky',
    });
  }

  if (advance > 0) {
    items.push({
      id: 'advance-ok',
      title: 'Customer Paid Advance',
      description: `Advance ₹${Number(advance).toLocaleString('en-IN')} received`,
      priority: 'completed',
      tone: 'emerald',
      done: true,
    });
  }

  return items;
}

export function computeNextPaymentDue(booking, payments = [], summary) {
  const remaining = summary?.remainingBalance ?? Math.max(0, (booking?.totalAmount || 0) - (booking?.totalPaid || booking?.advanceReceived || 0));
  if (remaining <= 0) return null;
  const dueDate = booking?.travelDate;
  const secondInstallment = remaining > (summary?.advanceReceived || 0) ? Math.min(remaining, Math.round((booking?.totalAmount || 0) * 0.5)) : remaining;
  return {
    amount: secondInstallment || remaining,
    date: dueDate,
  };
}

export function filterTimelineForHotels(events = [], hasHotels = true) {
  if (hasHotels) return events;
  return events.filter((e) => {
    const text = `${e.title || ''} ${e.message || ''} ${e.type || ''} ${e.label || ''}`.toLowerCase();
    return !text.includes('hotel');
  });
}
