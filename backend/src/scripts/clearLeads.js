/**
 * Delete all leads and related data for a company. Run:
 *   node src/scripts/clearLeads.js <companyId>
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');
const { clearAllLeadsData } = require('../services/clearAllLeadsService');

async function clearLeads() {
  const companyId = process.argv[2];
  if (!companyId) {
    console.error('Usage: node src/scripts/clearLeads.js <companyId>');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected. Deleting leads for company ${companyId}…`);

  const deleted = await clearAllLeadsData(companyId);
  console.log('Deleted:', deleted);

  await mongoose.disconnect();
  console.log('Done.');
}

clearLeads().catch((err) => {
  console.error(err);
  process.exit(1);
});
