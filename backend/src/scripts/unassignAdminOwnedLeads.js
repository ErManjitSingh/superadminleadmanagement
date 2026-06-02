/**
 * One-time: leads auto-assigned to admin (old bug) → unassigned
 * Run: node src/scripts/unassignAdminOwnedLeads.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { connectDB } = require('../config/db');
const Lead = require('../models/Lead');
const User = require('../models/User');

async function run() {
  await connectDB();
  const admins = await User.find({ role: 'admin' }).select('_id');
  const adminIds = admins.map((a) => a._id);

  const result = await Lead.updateMany(
    { assignedTo: { $in: adminIds } },
    { $set: { assignedTo: null, assignedManager: null, assignedTeamLeader: null } }
  );

  console.log(`Unassigned ${result.modifiedCount} lead(s) previously owned by admin.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
