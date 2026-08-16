/**
 * Backend-only VPS deploy: git pull + pm2 restart.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/deploy-backend-only.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/leadmanagement';

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
  "echo '==> Restart API...'",
  'pm2 restart ihd-crm-api',
  'sleep 2',
  'curl -sf http://127.0.0.1:5000/api/health',
  'echo',
  'echo DEPLOY_BACKEND_OK',
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
        process.exit(code || 0);
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 120000 });
