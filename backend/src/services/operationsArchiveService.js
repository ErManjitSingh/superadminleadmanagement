const Booking = require('../models/Booking');
const cacheService = require('./cacheService');

const ARCHIVE_AFTER_DAYS = Number(process.env.OPS_ARCHIVE_AFTER_DAYS) || 90;

async function archiveOldTrips() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ARCHIVE_AFTER_DAYS);

  const result = await Booking.updateMany(
    {
      archivedAt: { $exists: false },
      status: { $in: ['completed', 'cancelled', 'refund_completed'] },
      returnDate: { $lt: cutoff },
    },
    { $set: { archivedAt: new Date() } }
  );

  if (result.modifiedCount > 0) {
    await cacheService.invalidate('ops:');
    console.log(`[OperationsArchive] Archived ${result.modifiedCount} trip(s) older than ${ARCHIVE_AFTER_DAYS} days`);
  }

  return result.modifiedCount;
}

module.exports = { archiveOldTrips, ARCHIVE_AFTER_DAYS };
