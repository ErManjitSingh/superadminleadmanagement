import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const conn = new Client();

const script = `cd /var/www/testing-unotrips-crm/backend && node <<'NODE'
require('dotenv').config();
const mongoose = require('mongoose');
const { buildNavCounts } = require('./src/services/navCountsService');
const { withBranch } = require('./src/utils/branchScope');
const Lead = require('./src/models/Lead');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./src/models/User');
  const admin = await User.findOne({ role: 'admin' });
  const branchId = admin.branchId;
  console.log('branchId type:', branchId?.constructor?.name, branchId?.toString());

  const countsNull = await buildNavCounts(admin, { branchId: null });
  const countsObj = await buildNavCounts(admin, { branchId });
  const countsStr = await buildNavCounts(admin, { branchId: branchId.toString() });

  console.log('null branch leads.all:', countsNull.leads.all);
  console.log('ObjectId branch leads.all:', countsObj.leads.all);
  console.log('string branch leads.all:', countsStr.leads.all);

  const match = withBranch({ isDeleted: { $ne: true } }, branchId.toString());
  const direct = await Lead.countDocuments(match);
  console.log('direct count with string branchId:', direct);

  const match2 = withBranch({ isDeleted: { $ne: true } }, branchId);
  const direct2 = await Lead.countDocuments(match2);
  console.log('direct count with ObjectId branchId:', direct2);

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
