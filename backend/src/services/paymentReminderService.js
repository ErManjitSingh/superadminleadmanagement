const Booking = require('../models/Booking');
const BookingPaymentEvent = require('../models/BookingPaymentEvent');
const { logPaymentEvent } = require('./bookingPaymentService');
const { notifyUser } = require('./notificationService');

const REMINDER_TYPES = [
  { days: 7, key: '7_days' },
  { days: 3, key: '3_days' },
  { days: 1, key: '1_day' },
];

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysUntil(date) {
  if (!date) return null;
  const target = startOfDay(new Date(date));
  const today = startOfDay();
  return Math.round((target - today) / 86400000);
}

async function alreadyReminded(bookingId, reminderKey) {
  const exists = await BookingPaymentEvent.findOne({
    booking: bookingId,
    type: 'payment_reminder',
    'meta.reminderKey': reminderKey,
  }).select('_id');
  return !!exists;
}

async function sendPaymentReminder(booking, reminderKey, daysLeft, actor = null, { channels = ['notification', 'email', 'whatsapp'] } = {}) {
  const remaining = Math.max(0, (booking.totalAmount || 0) - (booking.totalPaid || booking.advanceReceived || 0));
  if (remaining <= 0) return { sent: false, reason: 'fully_paid' };

  const effectiveActor = actor || { name: 'System', role: 'system' };
  const branding = require('../config/branding');
  const results = { email: false, whatsapp: false, notification: false };

  if (channels.includes('notification')) {
    const assigneeId = booking.operationsManagerId || booking.assignedTo;
    if (assigneeId) {
      await notifyUser(assigneeId, {
        type: 'payment_reminder',
        title: daysLeft > 0 ? `Payment Reminder — ${daysLeft} day(s) to travel` : 'Overdue Payment Reminder',
        message: `${booking.customerName} owes ₹${remaining.toLocaleString('en-IN')} — ${booking.destination}`,
        branchId: booking.branchId,
        meta: { bookingId: booking._id, reminderKey, daysLeft },
      }).catch(() => {});
      results.notification = true;
    }
  }

  if (channels.includes('email') && booking.customerEmail) {
    const { sendMailMessage, isEmailConfigured } = require('./emailService');
    if (isEmailConfigured()) {
      await sendMailMessage({
        to: booking.customerEmail,
        subject: `Payment Reminder — ${booking.bookingNumber}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <h2 style="color:#4f46e5;">Payment Reminder</h2>
            <p>Hello <strong>${booking.customerName}</strong>,</p>
            <p>This is a reminder that <strong>₹${remaining.toLocaleString('en-IN')}</strong> is pending for your trip to <strong>${booking.destination}</strong>.</p>
            <p><strong>Booking ID:</strong> ${booking.bookingNumber}</p>
            <p>Please complete the payment at your earliest convenience.</p>
            <p>Regards,<br/><strong>${branding.brandName}</strong></p>
          </div>
        `,
      }).catch(() => {});
      results.email = true;
    }
  }

  if (channels.includes('whatsapp') && booking.customerPhone) {
    const { normalizePhone } = require('./paymentNotificationService');
    const phone = normalizePhone(booking.customerPhone);
    if (phone) {
      const message = [
        `Hello ${booking.customerName}`,
        '',
        'This is a payment reminder for your upcoming trip.',
        '',
        `Outstanding Balance:\n₹${remaining.toLocaleString('en-IN')}`,
        '',
        `Booking ID:\n${booking.bookingNumber}`,
        '',
        `Destination:\n${booking.destination}`,
        '',
        'Please complete the payment at your earliest convenience.',
        '',
        `Regards,\n${branding.brandName}`,
      ].join('\n');

      if (booking.lead) {
        const { logLeadActivity } = require('./leadActivityService');
        const waMeUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        await logLeadActivity({
          leadId: booking.lead,
          branchId: booking.branchId,
          type: 'whatsapp_sent',
          description: `Payment reminder prepared for WhatsApp — ${booking.bookingNumber}`,
          actor: effectiveActor,
          meta: { bookingId: booking._id, waMeUrl, reminderKey },
        }).catch(() => {});
        results.whatsapp = true;
        results.waMeUrl = waMeUrl;
      }
    }
  }

  const isManual = reminderKey.startsWith('manual');
  await logPaymentEvent({
    bookingId: booking._id,
    leadId: booking.lead,
    branchId: booking.branchId,
    type: 'payment_reminder',
    title: isManual ? 'Manual Payment Reminder' : `Payment Reminder (${daysLeft} days)`,
    description: isManual
      ? `Reminder sent by ${effectiveActor.name} — ₹${remaining} outstanding`
      : `Automated reminder — ₹${remaining} outstanding`,
    actor: effectiveActor,
    amount: remaining,
    meta: { reminderKey, daysLeft, channels, results },
  });

  return { sent: true, remaining, results };
}

async function sendManualPaymentReminder(bookingId, actor, { channels = ['email', 'whatsapp', 'notification'] } = {}) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw new Error('Booking not found');

  const remaining = Math.max(0, (booking.totalAmount || 0) - (booking.totalPaid || booking.advanceReceived || 0));
  if (remaining <= 0) throw new Error('Booking is fully paid');

  const daysLeft = daysUntil(booking.travelDate);
  const reminderKey = `manual_${Date.now()}`;

  return sendPaymentReminder(booking, reminderKey, daysLeft ?? 0, actor, { channels });
}

async function processOverdueReminders() {
  const today = startOfDay();
  const overdueBookings = await Booking.find({
    archivedAt: { $exists: false },
    paymentStatus: { $in: ['pending', 'partial', 'overdue'] },
    travelDate: { $lt: today },
  }).lean();

  for (const booking of overdueBookings) {
    if (await alreadyReminded(booking._id, 'overdue')) continue;
    const remaining = Math.max(0, (booking.totalAmount || 0) - (booking.totalPaid || booking.advanceReceived || 0));
    if (remaining <= 0) continue;
    await sendPaymentReminder(booking, 'overdue', 0);
    await Booking.findByIdAndUpdate(booking._id, { paymentStatus: 'overdue' });
  }
}

async function processUpcomingPaymentReminders() {
  const bookings = await Booking.find({
    archivedAt: { $exists: false },
    paymentStatus: { $in: ['pending', 'partial'] },
    travelDate: { $exists: true },
  }).lean();

  for (const booking of bookings) {
    const days = daysUntil(booking.travelDate);
    if (days == null || days < 0) continue;

    for (const { days: targetDays, key } of REMINDER_TYPES) {
      if (days !== targetDays) continue;
      if (await alreadyReminded(booking._id, key)) continue;
      await sendPaymentReminder(booking, key, targetDays);
    }
  }
}

async function processPaymentReminders() {
  await processUpcomingPaymentReminders();
  await processOverdueReminders();
}

module.exports = { processPaymentReminders, sendManualPaymentReminder };
