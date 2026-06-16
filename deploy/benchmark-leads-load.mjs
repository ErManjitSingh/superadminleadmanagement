import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d;
      });
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code ? reject(new Error(`exit ${code}`)) : resolve(out)));
    });
  });
}

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

BRANCH=$(node -e "
require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const b = await mongoose.connection.db.collection('branches').findOne({ status: 'active' });
  console.log(b?._id?.toString() || '');
  process.exit(0);
})().catch(() => process.exit(0));
")

bench() {
  local label="$1"
  local url="$2"
  echo ""
  echo "=== $label ==="
  curl -s -o /tmp/bench.json -w "HTTP %{http_code} | time_total %{time_total}s | size %{size_download} bytes\\n" \\
    -H "Authorization: Bearer $TOKEN" \\
    -H "x-branch-id: $BRANCH" \\
    "$url"
  head -c 200 /tmp/bench.json
  echo ""
}

echo "==> Mongo lead counts"
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const total = await db.collection('leads').countDocuments({});
  const loadTest = await db.collection('leads').countDocuments({ channel: 'load_test' });
  console.log('Total leads:', total);
  console.log('Load test leads:', loadTest);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
"

bench "Admin leads page 1 (limit 50)" "http://127.0.0.1:5000/api/leads?page=1&limit=50&branchId=$BRANCH"
bench "Admin leads search Speed Test" "http://127.0.0.1:5000/api/leads?page=1&limit=50&search=Speed+Test&branchId=$BRANCH"
bench "Nav counts" "http://127.0.0.1:5000/api/nav-counts?branchId=$BRANCH"
bench "Admin dashboard" "http://127.0.0.1:5000/api/dashboard?branchId=$BRANCH"

EXEC_TOKEN=$(node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./src/models/User');
  const user = await User.findOne({ role: 'sales_executive', status: 'active' }).lean();
  if (!user) { process.exit(0); }
  console.log(jwt.sign({ id: user._id }, process.env.JWT_SECRET));
  process.exit(0);
})().catch(() => process.exit(0));
")

if [ -n "$EXEC_TOKEN" ]; then
  bench "Sales exec leads all (limit 50)" "http://127.0.0.1:5000/api/sales-executive/leads?filter=all&page=1&limit=50" 
  # override token for exec endpoints
  TOKEN_SAVE="$TOKEN"
  TOKEN="$EXEC_TOKEN"
  curl -s -o /tmp/bench.json -w "HTTP %{http_code} | time_total %{time_total}s | size %{size_download} bytes\\n" \\
    -H "Authorization: Bearer $EXEC_TOKEN" \\
    -H "x-branch-id: $BRANCH" \\
    "http://127.0.0.1:5000/api/sales-executive/leads?filter=all&page=1&limit=50"
  echo ""
  bench "Sales exec dashboard" "http://127.0.0.1:5000/api/sales-executive/dashboard"
  TOKEN="$TOKEN_SAVE"
fi

echo ""
echo "BENCHMARK_OK"
`;

const conn = new Client();
conn.on('ready', async () => {
  try {
    await exec(conn, script);
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
});
conn.connect({
  host: process.env.VPS_HOST || '69.62.76.249',
  port: 22,
  username: 'root',
  password: PASSWORD,
});
