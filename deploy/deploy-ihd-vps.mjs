/**
 * Deploy via Git pull on VPS (no SFTP upload).
 * Usage:
 *   $env:VPS_PASSWORD='...'; node deploy/deploy-ihd-vps.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP_ROOT = '/var/www/leadmanagement';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}: ${errOut || out}`));
        else resolve(out);
      });
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d;
      });
      stream.stderr.on('data', (d) => {
        process.stderr.write(d);
        errOut += d;
      });
    });
  });
}

const conn = new Client();

conn
  .on('ready', async () => {
    console.log('SSH connected.\n');
    try {
      console.log('==> Running git-based deploy on VPS...\n');
      await exec(conn, `chmod +x ${APP_ROOT}/deploy/scripts/ihd-vps-deploy.sh 2>/dev/null || true; bash ${APP_ROOT}/deploy/scripts/ihd-vps-deploy.sh`);
      console.log('\nDeploy complete.');
      console.log('CRM:  https://indiaholidaydestination.com');
      console.log('Admin: https://admin.indiaholidaydestination.com');
    } catch (e) {
      // First deploy: script may not exist yet — bootstrap from git
      if (String(e.message).includes('No such file') || String(e.message).includes('Exit 127')) {
        console.log('Bootstrap: cloning repo and running deploy script...\n');
        await exec(conn, `
set -e
mkdir -p /var/www/indiaholidaydestination.com/public_html /var/www/admin.indiaholidaydestination.com/public_html
if [ ! -d /var/www/leadmanagement/.git ]; then
  if [ -d /var/www/leadmanagement ]; then
    cp -a /var/www/leadmanagement/backend/.env /tmp/ihd-backend.env.bak 2>/dev/null || true
    rm -rf /var/www/leadmanagement
  fi
  git clone https://github.com/ErManjitSingh/superadminleadmanagement.git /var/www/leadmanagement
  cp -a /tmp/ihd-backend.env.bak /var/www/leadmanagement/backend/.env 2>/dev/null || true
fi
chmod +x /var/www/leadmanagement/deploy/scripts/ihd-vps-deploy.sh
bash /var/www/leadmanagement/deploy/scripts/ihd-vps-deploy.sh
`);
        console.log('\nDeploy complete.');
      } else {
        throw e;
      }
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 120000 });
