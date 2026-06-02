/**
 * Delete all leads on VPS MongoDB. Run from project root:
 *   node deploy/run-clear-leads.mjs
 * Requires VPS_PASSWORD (same as git-pull-deploy).
 */
import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const HOST = process.env.VPS_HOST || '69.62.76.249';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const APP_ROOT = '/var/www/testing-unotrips-crm';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
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
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}`));
        else resolve(out);
      });
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      console.log('==> Sync latest clear-leads script…');
      await exec(conn, `cd ${APP_ROOT} && git fetch origin main && git checkout main && git pull origin main`);
      console.log('==> Clearing all leads on VPS…');
      await exec(conn, `cd ${APP_ROOT}/backend && npm run clear-leads`);
      console.log('CLEAR_LEADS_OK');
    } catch (e) {
      console.error(e.message);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error(e);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD });
