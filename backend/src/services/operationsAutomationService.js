const TripTask = require('../models/TripTask');
const { notifyUser } = require('./notificationService');

const AUTO_TASKS = [
  { type: 'hotel_confirmation', title: 'Confirm hotel reservation' },
  { type: 'cab_confirmation', title: 'Assign cab & driver' },
  { type: 'voucher_creation', title: 'Generate travel vouchers' },
  { type: 'payment_verification', title: 'Verify payment & advance' },
];

async function createOperationsTasksForBooking(booking, actor) {
  const dueDate = booking.travelDate ? new Date(booking.travelDate) : new Date(Date.now() + 3 * 86400000);
  const tasks = AUTO_TASKS.map((t) => ({
    booking: booking._id,
    branchId: booking.branchId,
    title: t.title,
    type: t.type,
    status: 'pending',
    assignedTo: booking.assignedTo || actor?._id || null,
    dueDate,
    createdBy: actor?._id || null,
  }));

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
