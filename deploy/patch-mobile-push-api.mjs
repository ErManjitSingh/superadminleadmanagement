/**
 * Upload mobile push-token API files to VPS and restart API.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/patch-mobile-push-api.mjs
 */
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const APP = '/var/www/leadmanagement';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;

const FILES = [
  ['backend/src/models/User.js', `${APP}/backend/src/models/User.js`],
  ['backend/src/controllers/authController.js', `${APP}/backend/src/controllers/authController.js`],
  ['backend/src/routes/authRoutes.js', `${APP}/backend/src/routes/authRoutes.js`],
];

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

function uploadFile(sftp, localRel, remotePath) {
  const localPath = path.join(ROOT, localRel);
  const content = fs.readFileSync(localPath);
  return new Promise((resolve, reject) => {
    sftp.writeFile(remotePath, content, (err) => {
      if (err) reject(err);
      else {
        console.log(`Uploaded ${localRel} -> ${remotePath}`);
        resolve();
      }
    });
  });
}

const conn = new Client();
conn
  .on('ready', () => {
    conn.sftp(async (err, sftp) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      try {
        for (const [local, remote] of FILES) {
          await uploadFile(sftp, local, remote);
        }
        conn.exec('pm2 restart ihd-crm-api && sleep 2 && curl -sf http://127.0.0.1:5000/api/health && echo && echo PATCH_PUSH_API_OK', (e, stream) => {
          if (e) {
            console.error(e);
            process.exit(1);
          }
          stream.on('data', (d) => process.stdout.write(d));
          stream.stderr.on('data', (d) => process.stderr.write(d));
          stream.on('close', (code) => {
            conn.end();
            process.exit(code || 0);
          });
        });
      } catch (e) {
        console.error(e);
        conn.end();
        process.exit(1);
      }
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 120000 });
