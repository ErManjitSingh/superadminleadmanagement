/**
 * Keep only admin@crm.com — remove all other users from DB.
 * Run: npm run keep-admin-only
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');
const Team = require('../models/Team');
const Notification = require('../models/Notification');

const ADMIN_EMAIL = 'admin@crm.com';

async function run() {
  await connectDB();

  const admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    console.error(`Admin user ${ADMIN_EMAIL} not found. Create admin first or run npm run seed.`);
    process.exit(1);
  }

  const toRemove = await User.find({ email: { $ne: ADMIN_EMAIL } });
  const ids = toRemove.map((u) => u._id);

  if (!ids.length) {
    console.log('Only admin exists already.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Keeping: ${admin.email} (${admin.name})`);
  console.log(`Removing ${ids.length} user(s):`);
  toRemove.forEach((u) => console.log(`  - ${u.email} (${u.role})`));

  await Lead.updateMany(
    {
      $or: [
        { assignedTo: { $in: ids } },
        { assignedManager: { $in: ids } },
        { assignedTeamLeader: { $in: ids } },
        { createdBy: { $in: ids } },
      ],
    },
    {
      $unset: { assignedTo: '', assignedManager: '', assignedTeamLeader: '' },
      $set: { createdBy: admin._id },
    }
  );

  await FollowUp.deleteMany({ $or: [{ assignedTo: { $in: ids } }, { createdBy: { $in: ids } }] });
  await Quotation.updateMany(
    { $or: [{ createdByExecutive: { $in: ids } }, { teamLeader: { $in: ids } }, { createdBy: { $in: ids } }] },
    { $unset: { createdByExecutive: '', teamLeader: '' }, $set: { createdBy: admin._id } }
  );
  await Notification.deleteMany({ user: { $in: ids } });
  await Team.deleteMany({});

  await User.deleteMany({ _id: { $in: ids } });

  const remaining = await User.countDocuments();
  console.log(`\n✅ Done. ${remaining} user(s) in database (admin only).\n`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
