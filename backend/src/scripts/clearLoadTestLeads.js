/**
 * Remove load-test leads only (channel=load_test).
 * Run: npm run clear:load-test-leads
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { connectDB } = require('../config/db');
const mongoose = require('mongoose');
const Lead = require('../models/Lead');

const CHANNEL = 'load_test';

async function clearLoadTestLeads() {
  await connectDB();
  const result = await Lead.deleteMany({ channel: CHANNEL });
  console.log(`Deleted ${result.deletedCount} load_test lead(s).`);
  await mongoose.disconnect();
}

clearLoadTestLeads().catch((err) => {
  console.error(err);
  process.exit(1);
});
