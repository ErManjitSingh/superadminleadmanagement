import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const conn = new Client();

const script = `cd /var/www/testing-unotrips-crm/backend && node <<'NODE'
require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./src/models/User');
  const Lead = require('./src/models/Lead');
  const admin = await User.findOne({ role: 'admin' }).lean();
  console.log('admin:', { id: admin._id, name: admin.name, branchId: admin.branchId });
  const branches = await mongoose.connection.db.collection('branches').find({}).toArray();
  console.log('branches:', branches.map(b => ({ id: b._id.toString(), name: b.name })));
  const leadByBranch = await Lead.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$branchId', n: { $sum: 1 } } },
  ]);
  console.log('leads by branch:', leadByBranch.map(r => ({ branchId: r._id?.toString() || 'null', n: r.n })));
  const total = await Lead.countDocuments({ isDeleted: { $ne: true } });
  console.log('total leads:', total);
  if (admin.branchId) {
    const scoped = await Lead.countDocuments({ isDeleted: { $ne: true }, branchId: admin.branchId });
    console.log('leads in admin.branchId:', scoped);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
NODE`;

conn
  .on('ready', () => {
    conn.exec(script, { pty: true }, (err, stream) => {
      stream.on('data', (d) => process.stdout.write(d));
      stream.on('close', () => conn.end());
    });
  })
  .connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD, readyTimeout: 30000 });
