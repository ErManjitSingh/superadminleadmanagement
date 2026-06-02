/**
 * Remove demo Sales Manager & Sales Executive users from existing DB (no full reseed).
 * Run: node src/scripts/removeSalesDemoUsers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');
const Team = require('../models/Team');

const DEMO_EMAILS = [
  'manager@crm.com',
  'executive@crm.com',
  'amit@unotravel.com',
  'vikram@unotravel.com',
];

async function run() {
  await connectDB();

  const users = await User.find({
    $or: [{ email: { $in: DEMO_EMAILS } }, { role: { $in: ['sales_manager', 'sales_executive'] } }],
  });

  if (!users.length) {
    console.log('No sales manager / executive demo users found.');
    await mongoose.disconnect();
    return;
  }

  const ids = users.map((u) => u._id);
  console.log('Removing', users.length, 'user(s):');
  users.forEach((u) => console.log(`  - ${u.email} (${u.role})`));

  await Lead.updateMany(
    { $or: [{ assignedTo: { $in: ids } }, { assignedManager: { $in: ids } }, { assignedTeamLeader: { $in: ids } }] },
    { $unset: { assignedTo: '', assignedManager: '', assignedTeamLeader: '' } }
  );

  await FollowUp.updateMany(
    { $or: [{ assignedTo: { $in: ids } }, { createdBy: { $in: ids } }] },
    { $set: { assignedTo: null } }
  );

  await Quotation.updateMany(
    { $or: [{ createdByExecutive: { $in: ids } }, { createdBy: { $in: ids } }] },
    { $unset: { createdByExecutive: '' } }
  );

  await Team.updateMany(
    { $or: [{ salesManager: { $in: ids } }, { teamLeader: { $in: ids } }, { members: { $in: ids } }] },
    {
      $pull: { members: { $in: ids } },
      $unset: { salesManager: '' },
    }
  );

  await User.deleteMany({ _id: { $in: ids } });

  console.log('\n✅ Done. Add your Sales Manager & Executives from Admin → Team Management.\n');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
