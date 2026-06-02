import { Client } from 'ssh2';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = '/var/www/testing-unotrips-crm';
const PASSWORD = process.env.VPS_PASSWORD;

const files = [
  'frontend/src/context/ToastContext.jsx',
  'frontend/src/api/toastMessages.js',
  'frontend/src/api/axios.js',
  'frontend/src/App.jsx',
  'frontend/src/auth/authService.js',
  'frontend/src/components/team/TeamManagementPage.jsx',
  'frontend/src/components/followups/followupApi.js',
  'frontend/src/pages/Leads.jsx',
];

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => (code ? reject(new Error(`exit ${code}`)) : resolve()));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

const conn = new Client();
conn.on('ready', () => {
  conn.sftp(async (err, sftp) => {
    if (err) return console.error(err);
    try {
      for (const rel of files) {
        await new Promise((res, rej) =>
          sftp.fastPut(path.join(ROOT, rel), `${APP}/${rel}`, (e) => (e ? rej(e) : res()))
        );
        console.log('Uploaded', rel);
      }
      await exec(conn, `cd ${APP}/frontend && npm run build && echo DONE`);
    } catch (e) {
      console.error(e);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  });
}).connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
