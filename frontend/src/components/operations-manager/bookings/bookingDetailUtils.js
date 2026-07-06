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
