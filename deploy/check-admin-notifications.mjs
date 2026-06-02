import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const script = `
cd /var/www/testing-unotrips-crm/backend
node <<'NODE'
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testing_unotrips_crm');
  const admins = await User.find({ role: 'admin' }).select('email name status _id').lean();
  console.log('ADMINS', JSON.stringify(admins, null, 2));
  for (const a of admins) {
    const total = await Notification.countDocuments({ user: a._id });
    const unread = await Notification.countDocuments({ user: a._id, read: false });
    const recent = await Notification.find({ user: a._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type title createdAt read')
      .lean();
    console.log('NOTIFS', a.email, JSON.stringify({ total, unread, recent }, null, 2));
  }
  console.log('TOTAL_NOTIFICATIONS', await Notification.countDocuments());
  const all = await Notification.find().sort({ createdAt: -1 }).limit(10)
    .populate('user', 'email role name').lean();
  console.log('RECENT_ALL', JSON.stringify(all.map(n => ({
    user: n.user?.email,
    role: n.user?.role,
    type: n.type,
    title: n.title,
    createdAt: n.createdAt,
  })), null, 2));
  process.exit(0);
})().catch((e) => {
  console.error(e);
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
