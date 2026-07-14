const TripTask = require('../models/TripTask');
const { notifyUser } = require('./notificationService');

const AUTO_TASKS = [
  { type: 'hotel_confirmation', title: 'Confirm hotel reservation', requiresHotels: true },
  { type: 'cab_confirmation', title: 'Assign cab & driver', requiresTransport: false },
  { type: 'voucher_creation', title: 'Generate travel vouchers' },
  { type: 'payment_verification', title: 'Verify payment & advance' },
];

async function createOperationsTasksForBooking(booking, actor) {
  const hasHotels = (booking.hotels || []).some((h) => h?.hotelName || h?.name);
  const dueDate = booking.travelDate ? new Date(booking.travelDate) : new Date(Date.now() + 3 * 86400000);

  const taskDefs = AUTO_TASKS.filter((t) => {
    if (t.requiresHotels && !hasHotels) return false;
    return true;
  });

  const tasks = taskDefs.map((t) => ({
    booking: booking._id,
    branchId: booking.branchId,
    title: t.title,
    type: t.type,
    status: 'pending',
    assignedTo: booking.assignedTo || actor?._id || null,
    dueDate,
    createdBy: actor?._id || null,
  }));

  if (!tasks.length) return [];

  const created = await TripTask.insertMany(tasks);

  if (booking.assignedTo) {
    await notifyUser(booking.assignedTo, {
      type: 'operations_task',
      title: 'New operations tasks created',
      message: `${booking.bookingNumber} — ${booking.customerName}: ${created.length} tasks assigned`,
      branchId: booking.branchId,
      meta: { bookingId: booking._id, taskCount: created.length },
    });
  }

  return created;
}

module.exports = { createOperationsTasksForBooking, AUTO_TASKS };
