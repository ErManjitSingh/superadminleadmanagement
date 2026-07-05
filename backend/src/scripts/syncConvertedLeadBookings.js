/**
 * One-time repair: create operations bookings for converted leads that have none.
 * Usage: node src/scripts/syncConvertedLeadBookings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Booking = require('../models/Booking');
const { onLeadConverted } = require('../services/leadConversionService');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/indiaholidaydestination_crm';
  await mongoose.connect(uri);
  console.log('[sync] Connected');

  const convertedLeads = await Lead.find({ status: 'converted', isDeleted: { $ne: true } })
    .select('_id name destination')
    .lean();

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of convertedLeads) {
    const exists = await Booking.exists({ lead: lead._id });
    if (exists) {
      skipped += 1;
      continue;
    }
    try {
      const result = await onLeadConverted(lead, { _id: null, name: 'System Sync' });
      if (result?.booking) {
        created += 1;
        console.log(`[sync] Created booking for ${lead.name} (${lead._id})`);
      } else {
        failed += 1;
        console.warn(`[sync] No booking created for ${lead.name} (${lead._id})`);
      }
    } catch (err) {
      failed += 1;
      console.error(`[sync] Failed ${lead.name}:`, err.message);
    }
  }

  console.log(`[sync] Done — created: ${created}, skipped: ${skipped}, failed: ${failed}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
