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
echo "==> Email module on VPS?"
ls -la src/services/emailService.js 2>/dev/null || echo "MISSING: emailService.js (not deployed)"
echo ""
echo "==> SMTP env on VPS"
grep -E '^SMTP_(HOST|PORT|USER|FROM_NAME)=' .env || echo "No SMTP vars"
echo ""
echo "==> SMTP verify + send from VPS"
node -e "
require('dotenv').config();
const nodemailer = require('nodemailer');
const port = Number(process.env.SMTP_PORT || 465);
const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
(async () => {
  await t.verify();
  console.log('SMTP verify: OK');
  const info = await t.sendMail({
    from: '\\\"' + (process.env.SMTP_FROM_NAME || 'UNO Trips') + '\\\" <' + process.env.SMTP_USER + '>',
    to: process.env.SMTP_USER,
    subject: 'VPS SMTP Test ' + new Date().toISOString(),
    text: 'Test from VPS production server.',
    html: '<p>Test from <strong>VPS</strong> production server.</p>',
  });
  console.log('Send: OK', info.messageId);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
"
echo ""
echo "==> Email API route on production?"
curl -s -o /dev/null -w "GET /api/emails/stats => %{http_code}\\n" http://127.0.0.1:5000/api/emails/stats
`;

const conn = new Client();
conn.on('ready', async () => {
  try { await exec(conn, script); } finally { conn.end(); }
}).on('error', (e) => { console.error(e); process.exit(1); })
  .connect({ host: HOST, port: 22, username: USER, password: PASSWORD });
