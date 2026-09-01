/**
 * One-shot: enable website lead ingest on VPS.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/enable-lead-ingest-vps.mjs
 */
import { Client } from 'ssh2';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PASSWORD = process.env.VPS_PASSWORD;
const KEY = '4bd8f5b83382a48286e1f006fbf7fa131098ba240e748acc';
const APP = '/var/www/leadmanagement';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => {
        const s = d.toString();
        process.stdout.write(s);
        out += s;
      });
      stream.stderr.on('data', (d) => {
        const s = d.toString();
        process.stderr.write(s);
        out += s;
      });
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}\n${out}`));
        else resolve(out);
      });
    });
  });
}

function upload(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localPath, remotePath, (e) => (e ? reject(e) : resolve()));
    });
  });
}

const filesToUpload = [
  'backend/src/services/websiteLeadIngestService.js',
  'backend/src/controllers/publicLeadController.js',
  'backend/src/scripts/enableWebsiteLeadIngest.js',
  'backend/src/scripts/vpsEnableLeadIngestOnce.js',
  'backend/src/routes/publicRoutes.js',
  'backend/src/middleware/rateLimiter.js',
  'backend/src/superadmin/models/Company.js',
];

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      console.log('SSH connected\n');

      console.log('==> Upload lead-ingest files');
      await exec(
        conn,
        `mkdir -p ${APP}/backend/src/services ${APP}/backend/src/controllers ${APP}/backend/src/scripts ${APP}/backend/src/routes ${APP}/backend/src/middleware ${APP}/backend/src/superadmin/models`
      );
      for (const rel of filesToUpload) {
        const local = join(__dirname, '..', rel);
        const remote = `${APP}/${rel}`;
        console.log('  put', rel);
        await upload(conn, local, remote);
      }

      console.log('\n==> Enable ingest + patch env + restart');
      await exec(conn, `cd ${APP}/backend && node src/scripts/vpsEnableLeadIngestOnce.js "${KEY}"`);
      await exec(conn, 'pm2 restart ihd-crm-api || pm2 restart all');
      await exec(conn, 'pm2 status');

      console.log('\n==> Smoke test create lead');
      await exec(
        conn,
        `curl -sS -X POST http://127.0.0.1:5000/api/public/leads -H "Content-Type: application/json" -H "X-Lead-Key: ${KEY}" -d '{"name":"VPS Test Lead","phone":"9876543210","destination":"Manali","sourceLabel":"Himachal Cab Website"}'`
      );
      console.log('\n\nDone.');
    } catch (e) {
      console.error(e.message || e);
      process.exit(1);
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: 22, username: USER, password: PASSWORD });
