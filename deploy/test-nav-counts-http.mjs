import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const conn = new Client();

const script = `set -e
cd /var/www/testing-unotrips-crm/backend
TOKEN=$(node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./src/models/User');
  const user = await User.findOne({ role: 'admin' }).lean();
  console.log(jwt.sign({ id: user._id }, process.env.JWT_SECRET));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
")

echo "=== Direct node :5000 ==="
curl -s -w "\\nHTTP:%{http_code}\\n" -H "Authorization: Bearer $TOKEN" http://127.0.0.1:5000/api/nav-counts | head -c 500
echo ""

echo "=== Through nginx (testing.unotrips.com) ==="
curl -s -w "\\nHTTP:%{http_code}\\n" -H "Authorization: Bearer $TOKEN" https://testing.unotrips.com/api/nav-counts | head -c 500
echo ""

BRANCH=$(node -e "
require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const branches = await mongoose.connection.db.collection('branches').find({}).limit(3).toArray();
  console.log(branches[0]?._id?.toString() || 'none');
  process.exit(0);
})().catch(() => process.exit(0));
")
echo "=== With branch header: $BRANCH ==="
curl -s -w "\\nHTTP:%{http_code}\\n" -H "Authorization: Bearer $TOKEN" -H "x-branch-id: $BRANCH" "http://127.0.0.1:5000/api/nav-counts?branchId=$BRANCH" | head -c 500
echo ""

echo "=== PM2 recent errors ==="
pm2 logs testing-unotrips-api --lines 30 --nostream 2>&1 | grep -iE "error|nav-count|ERL|forwarded" | tail -15 || true
`;

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
