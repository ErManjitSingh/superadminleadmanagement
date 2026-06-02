import { Client } from 'ssh2';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = '/var/www/testing-unotrips-crm';
const PASSWORD = process.env.VPS_PASSWORD;

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code ? reject(new Error(`exit ${code}`)) : resolve()));
    });
  });
}

const files = [
  'backend/src/services/notificationService.js',
  'backend/src/scripts/backfillAdminNotifications.js',
];

const conn = new Client();
conn.on('ready', () => {
  conn.sftp(async (err, sftp) => {
    if (err) return console.error(err);
    try {
      for (const rel of files) {
        await new Promise((res, rej) =>
          sftp.fastPut(path.join(ROOT, rel), `${APP}/${rel}`, (e) => (e ? rej(e) : res()))
        );
        console.log('OK', rel);
      }
      await exec(conn, `set -e
cd ${APP}/backend
node src/scripts/backfillAdminNotifications.js
pm2 restart testing-unotrips-api
echo DONE
`);
      conn.end();
    } catch (e) {
      console.error(e);
      conn.end();
      process.exit(1);
    }
  });
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
