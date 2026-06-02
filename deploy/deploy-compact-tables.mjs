import { Client } from 'ssh2';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = '/var/www/testing-unotrips-crm';
const PASSWORD = process.env.VPS_PASSWORD;

const files = [
  'frontend/src/components/ui/compactTable.js',
  'frontend/src/components/ui/TablePagination.jsx',
  'frontend/src/components/sales-manager/LeadListBadges.jsx',
  'frontend/src/components/sales-manager/TeamLeadsPage.jsx',
  'frontend/src/components/sales-manager/LeadAssignmentPage.jsx',
  'frontend/src/components/leads/LeadDataTable.jsx',
  'frontend/src/components/team/UserDataTable.jsx',
  'frontend/src/components/packages/PackageDataTable.jsx',
  'frontend/src/components/sales-executive/MyLeadsPage.jsx',
  'frontend/src/components/followups/FollowUpDataTable.jsx',
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
      await exec(conn, `cd ${APP}/frontend && npm run build && cd ${APP} && pm2 restart testing-unotrips-api && echo DONE`);
    } catch (e) {
      console.error(e);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  });
}).connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
