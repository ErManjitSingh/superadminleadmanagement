/**
 * Delete all leads and related data. Run: npm run clear-leads
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');

const Lead = require('../models/Lead');
const LeadNote = require('../models/LeadNote');
const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppNote = require('../models/WhatsAppNote');

async function clearLeads() {
  await mongoose.connect(mongoUri);
  console.log('Connected. Deleting all leads and related records…');

  const results = await Promise.all([
    LeadNote.deleteMany({}),
    FollowUp.deleteMany({}),
    Quotation.deleteMany({}),
    WhatsAppMessage.deleteMany({}),
    WhatsAppNote.deleteMany({}),
    Lead.deleteMany({}),
  ]);

  const leadCount = results[5].deletedCount;
  console.log(`Deleted ${leadCount} leads (+ notes, follow-ups, quotations, whatsapp data).`);
  await mongoose.disconnect();
  console.log('Done.');
}

clearLeads().catch((err) => {
  console.error(err);
  process.exit(1);
});
