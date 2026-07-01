/**
 * One-time: rename companies.planId -> subscriptionPlanId in MongoDB.
 * Usage: node backend/src/scripts/migratePlanIdField.js
 */
const mongoose = require('mongoose');
require('../../config/env');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const result = await db.collection('companies').updateMany(
    { planId: { $exists: true } },
    { $rename: { planId: 'subscriptionPlanId' } },
  );
  console.log(`[migratePlanIdField] matched=${result.matchedCount} modified=${result.modifiedCount}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
