/**
 * Run repairCompanyAdmin.js on the VPS.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/run-repair-admin.mjs <domain> [password]
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const PASSWORD = process.env.VPS_PASSWORD;
const APP_ROOT = '/var/www/leadmanagement';
const DOMAIN = process.argv[2];
const PW = process.argv[3] || '';

if (!PASSWORD) { console.error('Set VPS_PASSWORD'); process.exit(1); }
if (!DOMAIN) { console.error('Usage: node deploy/run-repair-admin.mjs <domain> [password]'); process.exit(1); }

const cmd =
  `cd ${APP_ROOT} && git fetch origin main -q && git checkout origin/main -- backend/src/scripts/repairCompanyAdmin.js && ` +
  `cd backend && node src/scripts/repairCompanyAdmin.js ${DOMAIN} ${PW}`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err.message); conn.end(); process.exit(1); }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => { conn.end(); process.exit(code || 0); });
  });
}).on('error', (e) => { console.error('SSH:', e.message); process.exit(1); })
  .connect({ host: HOST, username: 'root', password: PASSWORD, readyTimeout: 120000 });
