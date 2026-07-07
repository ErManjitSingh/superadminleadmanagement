/**
 * Provision nginx vhost + SSL for a tenant custom domain on the VPS.
 * Usage:
 *   $env:VPS_PASSWORD='...'; node deploy/add-custom-domain.mjs crm.exploremybharat.info
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP_ROOT = '/var/www/leadmanagement';

const DOMAIN = process.argv[2];

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}
if (!DOMAIN) {
  console.error('Usage: node deploy/add-custom-domain.mjs <custom-domain>');
  process.exit(1);
}

const conn = new Client();
conn
  .on('ready', () => {
    const cmd =
      `cd ${APP_ROOT} && git fetch origin main -q && git checkout origin/main -- deploy/scripts/add-custom-domain.sh deploy/nginx/custom-domain.template.conf 2>/dev/null; ` +
      `chmod +x ${APP_ROOT}/deploy/scripts/add-custom-domain.sh; ` +
      `bash ${APP_ROOT}/deploy/scripts/add-custom-domain.sh ${DOMAIN}`;
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error(err.message);
        conn.end();
        process.exit(1);
      }
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        conn.end();
        process.exit(code || 0);
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 120000 });
