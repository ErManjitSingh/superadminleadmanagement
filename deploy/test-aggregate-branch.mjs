import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const conn = new Client();

const script = `cd /var/www/testing-unotrips-crm/backend && node <<'NODE'
require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./src/models/Lead');
const { withBranch } = require('./src/utils/branchScope');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const branchStr = '6a1e96b881e6765ebf4b8ec4';
  const branchOid = new mongoose.Types.ObjectId(branchStr);

  const matchStr = withBranch({ isDeleted: { $ne: true } }, branchStr);
  const matchOid = withBranch({ isDeleted: { $ne: true } }, branchOid);

  const [aggStr] = await Lead.aggregate([{ $match: matchStr }, { $count: 'n' }]);
  const [aggOid] = await Lead.aggregate([{ $match: matchOid }, { $count: 'n' }]);

  console.log('aggregate string branchId:', aggStr?.n ?? 0, 'filter:', JSON.stringify(matchStr));
  console.log('aggregate ObjectId branchId:', aggOid?.n ?? 0);

  const cntStr = await Lead.countDocuments(matchStr);
  const cntOid = await Lead.countDocuments(matchOid);
  console.log('countDocuments string:', cntStr);
  console.log('countDocuments ObjectId:', cntOid);
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
