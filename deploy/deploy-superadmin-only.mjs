/**
 * Fast superadmin-only deploy (git pull + build + publish).
 * Usage: $env:VPS_PASSWORD='...'; node deploy/deploy-superadmin-only.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/leadmanagement';
const ADMIN = '/var/www/admin.indiaholidaydestination.com/public_html';
const DOMAIN = 'indiaholidaydestination.com';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

const remoteCmd = [
  'set -euo pipefail',
  `cd ${APP}`,
  "echo '==> Git pull...'",
  'git fetch origin main',
  'git reset --hard origin/main',
  'echo "HEAD: $(git rev-parse --short HEAD)"',
  'git log -1 --oneline',
  "echo '==> Superadmin env...'",
  `cat > ${APP}/superadmin/.env <<EOF
VITE_API_URL=/api/superadmin
VITE_CRM_URL=https://${DOMAIN}
VITE_PLATFORM_DOMAIN=${DOMAIN}
EOF`,
  "echo '==> Superadmin build...'",
  `cd ${APP}/superadmin`,
  'npm install --silent',
  'npm run build',
  "echo '==> Publish superadmin...'",
  `rsync -a --delete ${APP}/superadmin/dist/ ${ADMIN}/`,
  `ls -la ${ADMIN}/index.html`,
  'echo DEPLOY_SUPERADMIN_OK',
].join('\n');

const conn = new Client();

conn
  .on('ready', () => {
    console.log('SSH connected.\n');
    conn.exec(remoteCmd, (err, stream) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        conn.end();
        if (code !== 0) {
          console.error(`\nRemote exited with code ${code}`);
          process.exit(code || 1);
        }
        console.log('\nSuperadmin deploy complete.');
        console.log('Admin: https://admin.indiaholidaydestination.com');
        console.log('Hard-refresh the browser (Ctrl+Shift+R) if you still see old UI.');
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 120000 });
