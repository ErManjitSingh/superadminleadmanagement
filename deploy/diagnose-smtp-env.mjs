import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const HOST = process.env.VPS_HOST || '69.62.76.249';
const USER = process.env.VPS_USER || 'root';
const APP_ROOT = '/var/www/testing-unotrips-crm';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { process.stdout.write(d); out += d; });
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code !== 0 ? reject(new Error(`exit ${code}`)) : resolve(out)));
    });
  });
}

const script = `set -e
cd ${APP_ROOT}/backend
echo "==> .env SMTP lines (pass length only)"
for k in SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM_NAME; do
  line=$(grep -E "^\\\${k}=" .env 2>/dev/null || true)
  if [ -z "$line" ]; then
    echo "$k: MISSING"
  elif [ "$k" = "SMTP_PASS" ]; then
    val=$(echo "$line" | cut -d= -f2-)
    echo "SMTP_PASS: set (len=\${#val})"
  else
    echo "$line"
  fi
done
echo ""
echo "==> isEmailConfigured via app env.js"
node -e "
require('./src/config/env');
const { isEmailConfigured } = require('./src/services/emailService');
console.log('configured:', isEmailConfigured());
console.log('HOST:', process.env.SMTP_HOST || '(empty)');
console.log('USER:', process.env.SMTP_USER || '(empty)');
console.log('PASS set:', !!process.env.SMTP_PASS);
"
`;

const conn = new Client();
conn.on('ready', async () => {
  try { await exec(conn, script); } finally { conn.end(); }
}).on('error', (e) => { console.error(e); process.exit(1); })
  .connect({ host: HOST, port: 22, username: USER, password: PASSWORD });
