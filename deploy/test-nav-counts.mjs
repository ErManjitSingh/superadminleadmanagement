import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const conn = new Client();

const script = `set -e
cd /var/www/testing-unotrips-crm/backend
node <<'NODE'
require('dotenv').config();
const mongoose = require('mongoose');
const { buildNavCounts } = require('./src/services/navCountsService');
const { getOrSet, navCountsKey, NAV_COUNTS_TTL_MS } = require('./src/services/dashboardCacheService');
const { isRedisReady } = require('./src/config/redis');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./src/models/User');
  const user = await User.findOne({ role: 'admin' }).lean();
  if (!user) throw new Error('No admin user');
  const counts = await buildNavCounts(user, { branchId: null });
  console.log('buildNavCounts:', JSON.stringify(counts, null, 2));
  const key = navCountsKey('admin', user._id, null);
  const cached = await getOrSet(key, () => buildNavCounts(user, { branchId: null }), NAV_COUNTS_TTL_MS);
  console.log('cache key:', key);
  console.log('redis ready:', isRedisReady());
  console.log('cached leads.all:', cached?.leads?.all);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
NODE`;

conn
  .on('ready', () => {
    conn.exec(script, { pty: true }, (err, stream) => {
      if (err) throw err;
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => process.exit(code || 0));
    });
  })
  .on('error', (e) => {
    console.error(e.message);
    process.exit(1);
  })
  .connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD, readyTimeout: 30000 });
