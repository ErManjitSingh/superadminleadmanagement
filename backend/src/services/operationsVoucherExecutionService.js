const crypto = require('crypto');
const Booking = require('../models/Booking');
const Voucher = require('../models/Voucher');
const TripExecutionEvent = require('../models/TripExecutionEvent');
const branding = require('../config/branding');
const { sendMailMessage, isEmailConfigured } = require('./emailService');
const {
  generateVoucherPdfFile,
  generateTravelKitPdf,
  readPdfBuffer,
} = require('./operationsVoucherPdfService');
const { generateVoucherDocument } = require('./operationsVoucherService');

const EXECUTION_STAGES = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'voucher_generated', label: 'Voucher Generated' },
  { key: 'sent', label: 'Sent' },
  { key: 'vendor_confirmed', label: 'Vendor Confirmed' },
  { key: 'ready_to_travel', label: 'Ready To Travel' },
  { key: 'completed', label: 'Completed' },
];

function publicBaseUrl() {
  return (branding.websiteUrl || '').replace(/\/$/, '');
}

function buildVendorConfirmationUrl(token) {
  return `${publicBaseUrl()}/vendor-confirm/${token}`;
}

async function logEvent({ bookingId, voucherId, type, title, description, actor, meta = {} }) {
  const booking = await Booking.findById(bookingId).select('branchId').lean();
  return TripExecutionEvent.create({
    booking: bookingId,
    voucher: voucherId,
    type,
    title,
    description: description || '',
    actorId: actor?._id,
    actorName: actor?.name || 'System',
    branchId: booking?.branchId,
    meta,
  });
}

async function nextVoucherNumber(type = 'hotel') {
  const prefix = { hotel: 'H', transport: 'C', activity: 'A', flight: 'F', travel_kit: 'K', master: 'M' }[type] || 'V';
  const count = await Voucher.countDocuments();
  return `VCH-${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
}

function assignmentKey(type, index) {
  return `${type}:${index}`;
}

function extractPayload(booking, type, index = 0) {
  if (type === 'hotel') {
    const h = booking.hotels?.[index];
    if (!h) return null;
    return {
      hotelName: h.hotelName || h.name,
      roomType: h.roomType,
      mealPlan: h.mealPlan,
      checkIn: h.checkIn,
      checkOut: h.checkOut,
      checkInTime: h.checkInTime || '02:00 PM',
      checkOutTime: h.checkOutTime || '11:00 AM',
      destination: h.destination,
      address: h.address || h.location,
      location: h.location,
      hotelPhone: h.hotelPhone || h.phone,
      hotelEmail: h.hotelEmail || h.email,
      frontOfficePhone: h.frontOfficePhone,
      roomCount: h.roomCount || 1,
      starRating: h.starRating || h.category,
      category: h.category,
      image: h.image,
      status: h.status,
    };
  }
  if (type === 'transport') {
    const t = booking.transport?.[index];
    if (!t) return null;
    const vehicleType = t.vehicleType || 'suv';
    return {
      vehicleType,
      vehicleName: t.vehicleNumber,
      vehicleNumber: t.vehicleNumber,
      vehicleDisplayName: t.vehicleDisplayName || (vehicleType === 'innova' ? 'Toyota Innova Crysta (White)' : undefined),
      driverName: t.driverName,
      driverPhone: t.driverPhone,
      driverLicense: t.driverLicense,
      pickupLocation: t.pickupLocation,
      dropLocation: t.dropLocation,
      pickupDate: t.pickupDate,
      pickupTime: t.pickupTime,
      dropDate: t.dropDate,
      dropTime: t.dropTime,
      reportingTime: t.reportingTime || '09:30 AM',
      tripType: t.tripType,
      vehicleCount: t.vehicleCount || 1,
      vendorName: t.vendorName,
      status: t.status,
    };
  }
  if (type === 'activity') {
    const a = booking.activities?.[index];
    if (!a) return null;
    return {
      name: a.name,
      vendorName: a.vendorName,
      scheduledAt: a.scheduledAt,
      location: booking.destination,
      amount: a.amount,
      status: a.status,
    };
  }
  if (type === 'flight') {
    return booking.flights?.[index] || {
      airline: '—',
      pnr: '—',
      flightNumber: '—',
      departure: booking.travelDate,
      arrival: booking.returnDate,
      passengers: `${booking.adults || 0} Adults`,
    };
  }
  if (type === 'travel_kit' || type === 'master') {
    return { packageName: booking.packageName, destination: booking.destination };
  }
  return {};
}

async function archiveVoucher(voucher, replacedById) {
  await Voucher.findByIdAndUpdate(voucher._id, {
    isActive: false,
    status: 'archived',
    archivedAt: new Date(),
    replacedBy: replacedById,
  });
}

async function generateVoucherForAssignment(bookingId, { type, assignmentIndex = 0, actor, force = false } = {}) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw new Error('Booking not found');

  const normalizedType = type === 'cab' ? 'transport' : type;
  const key = assignmentKey(normalizedType, assignmentIndex);
  let payload = extractPayload(booking, normalizedType, assignmentIndex);

  if (normalizedType === 'hotel' && payload?.hotelId) {
    const Hotel = require('../models/Hotel');
    const catalog = await Hotel.findById(payload.hotelId)
      .select('name image phone email address location category mealPlan')
      .lean();
    if (catalog) {
      payload = {
        ...payload,
        hotelName: payload.hotelName || catalog.name,
        image: payload.image || catalog.image,
        hotelPhone: payload.hotelPhone || catalog.phone,
        hotelEmail: payload.hotelEmail || catalog.email,
        address: payload.address || catalog.address || catalog.location,
        starRating: payload.starRating || catalog.category,
        mealPlan: payload.mealPlan || catalog.mealPlan,
      };
    }
  }

  if (!payload && normalizedType !== 'travel_kit' && normalizedType !== 'master') {
    throw new Error(`No ${normalizedType} assignment found at index ${assignmentIndex}`);
  }

  const existing = await Voucher.findOne({
    booking: bookingId,
    type: normalizedType,
    assignmentIndex,
    isActive: true,
  });

  if (existing && !force) {
    const samePayload = JSON.stringify(existing.payload || {}) === JSON.stringify(payload || {});
    if (samePayload && existing.filePath) return existing;
  }

  if (existing) {
    await archiveVoucher(existing);
  }

  const version = (existing?.version || 0) + 1;
  const voucherNumber = existing?.voucherNumber || (await nextVoucherNumber(normalizedType));
  const token = crypto.randomBytes(24).toString('hex');
  const vendorUrl = ['hotel', 'transport', 'activity'].includes(normalizedType)
    ? buildVendorConfirmationUrl(token)
    : '';

  const voucherDoc = {
    voucherNumber,
    booking: bookingId,
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    branchId: booking.branchId,
    type: normalizedType,
    status: 'issued',
    isActive: true,
    version,
    assignmentIndex,
    assignmentKey: key,
    payload,
    details: {
      title: `${booking.destination} ${normalizedType} voucher`,
      validFrom: booking.travelDate,
      validUntil: booking.returnDate,
    },
    vendorConfirmationToken: token,
    vendorConfirmationUrl: vendorUrl,
    vendorStatus: 'pending',
    issuedAt: new Date(),
    generatedAt: new Date(),
    issuedBy: actor?._id,
  };

  let fileMeta;
  if (normalizedType === 'travel_kit') {
    fileMeta = await generateTravelKitPdf(voucherDoc, booking);
  } else {
    fileMeta = await generateVoucherPdfFile(voucherDoc, booking, payload || {});
  }

  const htmlUrl = normalizedType === 'travel_kit' ? '' : await generateVoucherDocument(voucherDoc, booking);

  const voucher = await Voucher.create({
    ...voucherDoc,
    filePath: fileMeta.filePath,
    fileName: fileMeta.fileName,
    fileSize: fileMeta.fileSize,
    pdfUrl: fileMeta.pdfUrl,
    htmlUrl,
    mimeType: 'application/pdf',
  });

  await linkVoucherToAssignment(bookingId, normalizedType, assignmentIndex, voucher._id);
  await Booking.findByIdAndUpdate(bookingId, { voucherStatus: 'issued' });

  await logEvent({
    bookingId,
    voucherId: voucher._id,
    type: existing ? 'voucher_regenerated' : 'voucher_generated',
    title: existing ? 'Voucher regenerated' : 'Voucher generated',
    description: `${normalizedType} voucher ${voucherNumber} v${version}`,
    actor,
    meta: { type: normalizedType, assignmentIndex },
  });

  return voucher;
}

async function linkVoucherToAssignment(bookingId, type, index, voucherId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) return;

  if (type === 'hotel' && booking.hotels?.[index]) {
    booking.hotels[index].voucherId = voucherId;
  } else if (type === 'transport' && booking.transport?.[index]) {
    booking.transport[index].voucherId = voucherId;
  } else if (type === 'activity' && booking.activities?.[index]) {
    booking.activities[index].voucherId = voucherId;
  }
  await booking.save();
}

async function regenerateVoucher(voucherId, actor) {
  const voucher = await Voucher.findById(voucherId);
  if (!voucher || !voucher.isActive) throw new Error('Active voucher not found');
  return generateVoucherForAssignment(voucher.booking, {
    type: voucher.type,
    assignmentIndex: voucher.assignmentIndex,
    actor,
    force: true,
  });
}

async function getVoucherPdfBuffer(voucherId) {
  let voucher = await Voucher.findById(voucherId).lean();
  if (!voucher) throw new Error('Voucher not found');

  if (!voucher.isActive) {
    const active = await Voucher.findOne({
      booking: voucher.booking,
      type: voucher.type,
      assignmentIndex: voucher.assignmentIndex,
      isActive: true,
    }).lean();
    if (active) voucher = active;
  }

  let buffer = readPdfBuffer(voucher.filePath);
  if (!buffer && voucher.isActive) {
    const regen = await generateVoucherForAssignment(voucher.booking, {
      type: voucher.type,
      assignmentIndex: voucher.assignmentIndex,
      force: true,
    });
    voucher = regen;
    buffer = readPdfBuffer(regen.filePath);
  }
  return { voucher, buffer };
}

async function sendVoucherEmail(voucherId, actor, { to } = {}) {
  const { voucher, buffer } = await getVoucherPdfBuffer(voucherId);
  if (!buffer) throw new Error('PDF file could not be generated');

  const booking = await Booking.findById(voucher.booking).lean();
  const recipient = to || booking?.customerEmail;
  if (!recipient) throw new Error('Recipient email is required');

  if (!isEmailConfigured()) throw new Error('SMTP is not configured');

  const isVendor = recipient !== booking?.customerEmail;
  const typeLabel = voucher.type === 'hotel' ? 'Hotel' : voucher.type === 'transport' ? 'Cab / Transport' : 'Travel';
  const subject = isVendor
    ? `${typeLabel} Booking Voucher — ${booking.bookingNumber}`
    : `Your ${voucher.type} voucher — ${booking.destination}`;
  const html = isVendor
    ? `<p>Hello,</p>
       <p>Please find the ${typeLabel.toLowerCase()} booking voucher attached for booking <strong>${booking.bookingNumber}</strong>.</p>
       <p><strong>Guest:</strong> ${booking.customerName}<br/>
       <strong>Destination:</strong> ${booking.destination}<br/>
       <strong>Travel Date:</strong> ${new Date(booking.travelDate).toLocaleDateString('en-IN')}</p>
       <p>Kindly confirm via the vendor link in the voucher.</p>
       <p>Team ${branding.brandName}</p>`
    : `<p>Hello ${booking.customerName},</p>
       <p>Your travel voucher is attached.</p>
       <p><strong>Destination:</strong> ${booking.destination}<br/>
       <strong>Travel Date:</strong> ${new Date(booking.travelDate).toLocaleDateString('en-IN')}</p>
       <p>Team ${branding.brandName}</p>`;

  await sendMailMessage({
    to: recipient,
    subject,
    html,
    attachments: [{
      filename: voucher.fileName || `${voucher.voucherNumber}.pdf`,
      content: buffer.toString('base64'),
      encoding: 'base64',
      contentType: 'application/pdf',
    }],
  });

  const now = new Date();
  await Voucher.findByIdAndUpdate(voucherId, {
    status: 'sent',
    sentAt: now,
    sentBy: actor?._id,
    'delivery.email.status': 'sent',
    'delivery.email.sentAt': now,
  });
  await Booking.findByIdAndUpdate(voucher.booking, { voucherStatus: 'sent' });

  await logEvent({
    bookingId: voucher.booking,
    voucherId,
    type: 'email_sent',
    title: 'Voucher emailed',
    description: `Sent to ${recipient}`,
    actor,
  });
  await logEvent({
    bookingId: voucher.booking,
    voucherId,
    type: 'voucher_sent',
    title: 'Voucher sent via email',
    description: voucher.voucherNumber,
    actor,
  });

  return { success: true, recipient, voucherId };
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

async function sendVoucherWhatsApp(voucherId, actor, { phone } = {}) {
  const { voucher, buffer } = await getVoucherPdfBuffer(voucherId);
  const booking = await Booking.findById(voucher.booking).lean();
  const recipientPhone = normalizePhone(phone || booking?.customerPhone);
  if (!recipientPhone) throw new Error('Recipient phone is required');

  const payload = voucher.payload || {};
  const isVendor = phone && normalizePhone(phone) !== normalizePhone(booking?.customerPhone);
  const typeLabel = voucher.type === 'hotel' ? 'Hotel' : voucher.type === 'transport' ? 'Cab' : 'Travel';

  const message = isVendor
    ? [
        `Hello,`,
        '',
        `${typeLabel} booking voucher for ${booking.bookingNumber}.`,
        '',
        `Guest: ${booking.customerName}`,
        `Destination: ${booking.destination}`,
        `Travel Date: ${new Date(booking.travelDate).toLocaleDateString('en-IN')}`,
        voucher.type === 'hotel' ? `Hotel: ${payload.hotelName || payload.name || ''}` : '',
        voucher.type === 'transport' ? `Driver: ${payload.driverName || ''}` : '',
        '',
        'Please find the voucher attached and confirm via the link inside.',
        '',
        `Team ${branding.brandName}`,
      ].filter(Boolean).join('\n')
    : [
        `Hello ${booking.customerName}`,
        '',
        'Your travel voucher is attached.',
        '',
        `Destination:\n${booking.destination}`,
        '',
        `Travel Date:\n${new Date(booking.travelDate).toLocaleDateString('en-IN')}`,
        '',
        `Team ${branding.brandName}`,
      ].join('\n');

  const now = new Date();
  await Voucher.findByIdAndUpdate(voucherId, {
    status: 'sent',
    sentAt: now,
    sentBy: actor?._id,
    'delivery.whatsapp.status': 'sent',
    'delivery.whatsapp.sentAt': now,
  });
  await Booking.findByIdAndUpdate(voucher.booking, { voucherStatus: 'sent' });

  await logEvent({
    bookingId: voucher.booking,
    voucherId,
    type: 'whatsapp_sent',
    title: 'Voucher prepared for WhatsApp',
    description: `To ${recipientPhone}`,
    actor,
  });
  await logEvent({
    bookingId: voucher.booking,
    voucherId,
    type: 'voucher_sent',
    title: 'Voucher sent via WhatsApp',
    description: voucher.voucherNumber,
    actor,
  });

  const text = encodeURIComponent(message);
  const waMeUrl = `https://wa.me/${recipientPhone}?text=${text}`;

  return {
    success: true,
    waMeUrl,
    phone: recipientPhone,
    message,
    fileName: voucher.fileName,
    pdfUrl: voucher.pdfUrl,
    pdfBase64: buffer.toString('base64'),
    voucherId,
  };
}

async function respondVendorConfirmation(token, { action, notes } = {}) {
  const voucher = await Voucher.findOne({ vendorConfirmationToken: token, isActive: true });
  if (!voucher) throw new Error('Invalid or expired confirmation link');

  const actionMap = {
    accept: { vendorStatus: 'confirmed', status: 'vendor_confirmed', event: 'vendor_confirmed' },
    reject: { vendorStatus: 'rejected', status: 'vendor_rejected', event: 'vendor_rejected' },
    changes: { vendorStatus: 'changes_requested', status: 'vendor_changes', event: 'vendor_changes_requested' },
  };
  const mapped = actionMap[action];
  if (!mapped) throw new Error('Invalid action');

  await Voucher.findByIdAndUpdate(voucher._id, {
    vendorStatus: mapped.vendorStatus,
    status: mapped.status,
    vendorRespondedAt: new Date(),
    vendorNotes: notes || '',
  });

  await logEvent({
    bookingId: voucher.booking,
    voucherId: voucher._id,
    type: mapped.event,
    title: `Vendor ${mapped.vendorStatus.replace(/_/g, ' ')}`,
    description: notes || '',
    actor: { name: 'Vendor' },
  });

  return Voucher.findById(voucher._id).lean();
}

async function getVendorConfirmationPage(token) {
  const voucher = await Voucher.findOne({ vendorConfirmationToken: token, isActive: true }).lean();
  if (!voucher) return null;
  const booking = await Booking.findById(voucher.booking)
    .select('bookingNumber customerName destination travelDate returnDate packageName')
    .lean();
  return { voucher, booking };
}

function computeProgress(booking, vouchers = []) {
  const activeVouchers = vouchers.filter((v) => v.isActive !== false);
  const hasHotels = (booking.hotels || []).length > 0;
  const hasTransport = (booking.transport || []).length > 0;
  const hasAssignments = hasHotels || hasTransport || (booking.activities || []).length > 0;
  const confirmed = ['confirmed', 'in_progress', 'completed'].includes(booking.status);
  const assigned = hasAssignments && (
    (!hasHotels || booking.hotelConfirmation === 'confirmed' || booking.hotels.some((h) => h.hotelName))
    && (!hasTransport || booking.cabConfirmation === 'confirmed' || booking.transport.some((t) => t.driverName || t.pickupLocation))
  );
  const voucherGenerated = activeVouchers.some((v) => v.status !== 'draft');
  const sent = activeVouchers.some((v) => ['sent', 'delivered', 'vendor_confirmed', 'vendor_pending'].includes(v.status));
  const vendorConfirmed = activeVouchers.length > 0 && activeVouchers.every((v) =>
    !['hotel', 'transport', 'activity'].includes(v.type) || v.vendorStatus === 'confirmed' || v.vendorStatus === 'pending'
  ) && activeVouchers.some((v) => v.vendorStatus === 'confirmed');
  const readyToTravel = sent && vendorConfirmed && booking.status !== 'completed';
  const completed = booking.status === 'completed';

  const flags = { confirmed, assigned, voucher_generated: voucherGenerated, sent, vendor_confirmed: vendorConfirmed, ready_to_travel: readyToTravel, completed };
  let currentIndex = 0;
  EXECUTION_STAGES.forEach((s, i) => {
    if (flags[s.key]) currentIndex = i;
  });

  return {
    stages: EXECUTION_STAGES.map((s, i) => ({
      ...s,
      done: flags[s.key],
      current: i === currentIndex,
    })),
    currentStage: EXECUTION_STAGES[currentIndex]?.key,
    percent: Math.round((currentIndex / (EXECUTION_STAGES.length - 1)) * 100),
  };
}

async function getBookingExecution(bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return null;

  const [vouchers, timeline] = await Promise.all([
    Voucher.find({ booking: bookingId }).sort({ createdAt: -1 }).lean(),
    TripExecutionEvent.find({ booking: bookingId }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const activeVouchers = vouchers.filter((v) => v.isActive !== false);
  const progress = computeProgress(booking, activeVouchers);

  const operationStatus = progress.currentStage;
  const voucherStatusSummary = activeVouchers.length
    ? activeVouchers.some((v) => v.status === 'sent') ? 'sent' : 'issued'
    : booking.voucherStatus || 'pending';

  return {
    booking,
    vouchers,
    activeVouchers,
    timeline,
    progress,
    operationStatus,
    voucherStatus: voucherStatusSummary,
    analytics: {
      totalVouchers: activeVouchers.length,
      pendingVendor: activeVouchers.filter((v) => v.vendorStatus === 'pending').length,
      rejected: activeVouchers.filter((v) => v.vendorStatus === 'rejected').length,
    },
  };
}

async function autoRegenerateOnBookingUpdate(prev, next, actor) {
  if (!prev || !next) return;

  const fields = ['hotels', 'transport', 'activities', 'travelDate', 'returnDate', 'adults', 'children'];
  const changed = fields.some((f) => JSON.stringify(prev[f]) !== JSON.stringify(next[f]));
  if (!changed) return;

  const activeVouchers = await Voucher.find({ booking: next._id, isActive: true }).lean();
  for (const v of activeVouchers) {
    await generateVoucherForAssignment(next._id, {
      type: v.type,
      assignmentIndex: v.assignmentIndex,
      actor,
      force: true,
    });
  }

  if (['hotels', 'transport', 'activities'].some((f) => JSON.stringify(prev[f]) !== JSON.stringify(next[f]))) {
    if (JSON.stringify(prev.hotels) !== JSON.stringify(next.hotels)) {
      await logEvent({ bookingId: next._id, type: 'hotel_assigned', title: 'Hotels updated', actor });
    }
    if (JSON.stringify(prev.transport) !== JSON.stringify(next.transport)) {
      await logEvent({ bookingId: next._id, type: 'cab_assigned', title: 'Transport updated', actor });
    }
    if (JSON.stringify(prev.activities) !== JSON.stringify(next.activities)) {
      await logEvent({ bookingId: next._id, type: 'activity_assigned', title: 'Activities updated', actor });
    }
  }
}

async function getVoucherAnalytics() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    generatedToday,
    pendingConfirmations,
    rejectedVouchers,
    hotelConfirmations,
    cabConfirmations,
    whatsappDeliveries,
    emailDeliveries,
    tripsReady,
  ] = await Promise.all([
    Voucher.countDocuments({ generatedAt: { $gte: startOfDay }, isActive: true }),
    Voucher.countDocuments({ vendorStatus: 'pending', isActive: true, type: { $in: ['hotel', 'transport', 'activity'] } }),
    Voucher.countDocuments({ vendorStatus: 'rejected', isActive: true }),
    Voucher.countDocuments({ type: 'hotel', vendorStatus: 'confirmed', isActive: true }),
    Voucher.countDocuments({ type: 'transport', vendorStatus: 'confirmed', isActive: true }),
    Voucher.countDocuments({ 'delivery.whatsapp.status': 'sent' }),
    Voucher.countDocuments({ 'delivery.email.status': 'sent' }),
    Booking.countDocuments({ status: { $in: ['confirmed', 'in_progress'] }, voucherStatus: 'sent', travelDate: { $gte: new Date() } }),
  ]);

  return {
    generatedToday,
    pendingConfirmations,
    rejectedVouchers,
    hotelConfirmations,
    cabConfirmations,
    whatsappDeliveries,
    emailDeliveries,
    tripsReadyToTravel: tripsReady,
  };
}

async function listVouchersFiltered(query = {}) {
  const filter = {};
  if (query.type) {
    filter.type = query.type === 'cab' ? 'transport' : query.type;
  }
  if (query.status) filter.status = query.status;
  if (query.bookingId) filter.booking = query.bookingId;
  if (query.isActive !== 'false') filter.isActive = true;

  return Voucher.find(filter)
    .populate('booking', 'bookingNumber customerName destination travelDate status')
    .sort({ createdAt: -1 })
    .lean();
}

async function generateAllVouchersForBooking(bookingId, actor) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw new Error('Booking not found');

  const created = [];
  (booking.hotels || []).forEach((_, i) => {
    created.push(generateVoucherForAssignment(bookingId, { type: 'hotel', assignmentIndex: i, actor }));
  });
  (booking.transport || []).forEach((_, i) => {
    created.push(generateVoucherForAssignment(bookingId, { type: 'transport', assignmentIndex: i, actor }));
  });
  (booking.activities || []).forEach((_, i) => {
    created.push(generateVoucherForAssignment(bookingId, { type: 'activity', assignmentIndex: i, actor }));
  });

  return Promise.all(created);
}

module.exports = {
  EXECUTION_STAGES,
  generateVoucherForAssignment,
  regenerateVoucher,
  sendVoucherEmail,
  sendVoucherWhatsApp,
  respondVendorConfirmation,
  getVendorConfirmationPage,
  getBookingExecution,
  autoRegenerateOnBookingUpdate,
  getVoucherAnalytics,
  listVouchersFiltered,
  generateAllVouchersForBooking,
  getVoucherPdfBuffer,
  logEvent,
  computeProgress,
};
