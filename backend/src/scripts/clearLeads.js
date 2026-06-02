/**
 * Delete all leads and related data. Run: npm run clear-leads
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');
const { clearAllLeadsData } = require('../services/clearAllLeadsService');

async function clearLeads() {
  await mongoose.connect(mongoUri);
  console.log('Connected. Deleting all leads and related records…');

  const deleted = await clearAllLeadsData();
  console.log('Deleted:', deleted);

  await mongoose.disconnect();
  console.log('Done.');
}

clearLeads().catch((err) => {
  console.error(err);
  process.exit(1);
});
