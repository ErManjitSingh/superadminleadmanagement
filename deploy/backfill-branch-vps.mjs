import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const script = `
cd /var/www/testing-unotrips-crm/backend
node <<'NODE'
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Branch = require('./src/models/Branch');
const User = require('./src/models/User');
const Team = require('./src/models/Team');
const Lead = require('./src/models/Lead');
const FollowUp = require('./src/models/FollowUp');
const Quotation = require('./src/models/Quotation');
const Booking = require('./src/models/Booking');
const Payment = require('./src/models/Payment');
const Notification = require('./src/models/Notification');
const Attendance = require('./src/models/Attendance');
const ActivityLog = require('./src/models/ActivityLog');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testing_unotrips_crm');

  let branches = await Branch.find({ status: 'active' }).sort({ createdAt: 1 }).lean();
  if (!branches.length) {
    await Branch.insertMany([
      { name: 'Shimla', code: 'SHIMLA', status: 'active' },
      { name: 'PTW', code: 'PTW', status: 'active' },
    ]);
    branches = await Branch.find({ status: 'active' }).sort({ createdAt: 1 }).lean();
  }
  if (!branches.length) throw new Error('No active branches found after bootstrap');
  const defaultBranchId = branches[0]._id;
  console.log('Using default branch:', branches[0].name, String(defaultBranchId));

  const admins = await User.find({ role: 'admin' }).select('_id').lean();
  if (admins.length) {
    await User.updateMany(
      { _id: { $in: admins.map((a) => a._id) }, $or: [{ branchId: { $exists: false } }, { branchId: null }] },
      { $set: { branchId: defaultBranchId } }
    );
  }

  await Promise.all([
    User.updateMany({ $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId: defaultBranchId } }),
    Team.updateMany({ $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId: defaultBranchId } }),
    Lead.updateMany({ $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId: defaultBranchId } }),
    Booking.updateMany({ $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId: defaultBranchId } }),
    Payment.updateMany({ $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId: defaultBranchId } }),
    Attendance.updateMany({ $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId: defaultBranchId } }),
    ActivityLog.updateMany({ $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId: defaultBranchId } }),
  ]);

  const leads = await Lead.find().select('_id branchId').lean();
  const leadBranchMap = new Map(leads.map((l) => [String(l._id), l.branchId || defaultBranchId]));

  const followUps = await FollowUp.find({ $or: [{ branchId: { $exists: false } }, { branchId: null }] })
    .select('_id lead')
    .lean();
  for (const f of followUps) {
    await FollowUp.updateOne(
      { _id: f._id },
      { $set: { branchId: leadBranchMap.get(String(f.lead)) || defaultBranchId } }
    );
  }

  const quotations = await Quotation.find({ $or: [{ branchId: { $exists: false } }, { branchId: null }] })
    .select('_id lead')
    .lean();
  for (const q of quotations) {
    await Quotation.updateOne(
      { _id: q._id },
      { $set: { branchId: leadBranchMap.get(String(q.lead)) || defaultBranchId } }
    );
  }

  const users = await User.find().select('_id branchId').lean();
  const userBranchMap = new Map(users.map((u) => [String(u._id), u.branchId || defaultBranchId]));
  const notifications = await Notification.find({ $or: [{ branchId: { $exists: false } }, { branchId: null }] })
    .select('_id user')
    .lean();
  for (const n of notifications) {
    await Notification.updateOne(
      { _id: n._id },
      { $set: { branchId: userBranchMap.get(String(n.user)) || defaultBranchId } }
    );
  }

  const stats = {
    users: await User.countDocuments({ branchId: { $exists: true, $ne: null } }),
    leads: await Lead.countDocuments({ branchId: { $exists: true, $ne: null } }),
    followups: await FollowUp.countDocuments({ branchId: { $exists: true, $ne: null } }),
    quotations: await Quotation.countDocuments({ branchId: { $exists: true, $ne: null } }),
    notifications: await Notification.countDocuments({ branchId: { $exists: true, $ne: null } }),
  };
  console.log('BACKFILL_OK', JSON.stringify(stats));
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
NODE
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      conn.end();
      process.exit(code || 0);
    });
  });
});

conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
