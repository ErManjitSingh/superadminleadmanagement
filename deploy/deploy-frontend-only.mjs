/**
 * Fast frontend-only deploy (git pull + CRM build + publish).
 * Usage: $env:VPS_PASSWORD='...'; node deploy/deploy-frontend-only.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/leadmanagement';
const WEB = '/var/www/indiaholidaydestination.com/public_html';

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
  "echo '==> Frontend build...'",
  `cd ${APP}/frontend`,
  "echo 'VITE_API_URL=/api' > .env",
  "echo 'VITE_BASE=/app/' >> .env",
  'npm install --silent',
  'VITE_BASE=/app/ npm run build',
  "echo '==> Publish CRM to /app/...'",
  `mkdir -p ${WEB}/app`,
  `rsync -a --delete ${APP}/frontend/dist/ ${WEB}/app/`,
  `ls -la ${WEB}/app/index.html`,
  'echo DEPLOY_FRONTEND_OK',
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
        console.log('\nFrontend deploy complete.');
        console.log('CRM: https://crm.exploremybharat.info/app/');
        console.log('Hard-refresh the browser (Ctrl+Shift+R) if you still see old UI.');
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 120000 });
