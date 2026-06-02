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
  'backend/src/utils/leadSourceLabels.js',
  'backend/src/utils/queryHelpers.js',
  'backend/src/controllers/leadController.js',
  'backend/src/services/navCountsService.js',
  'backend/src/scripts/unassignAdminOwnedLeads.js',
  'backend/package.json',
  'frontend/src/lib/leadSourceLabels.js',
  'frontend/src/components/leads/constants.js',
  'frontend/src/components/leads/leadFilters.js',
  'frontend/src/components/leads/LeadFilterBar.jsx',
  'frontend/src/components/leads/LeadDataTable.jsx',
  'frontend/src/components/sidebar/sidebar-config.js',
  'frontend/src/components/sales-manager/LeadListBadges.jsx',
  'frontend/src/components/dashboard/RecentLeadsTable.jsx',
  'frontend/src/components/lead-detail/LeadCustomerPanel.jsx',
  'frontend/src/components/lead-wizard/constants.js',
  'frontend/src/pages/Leads.jsx',
  'frontend/src/App.jsx',
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
npm install --omit=dev
node src/scripts/unassignAdminOwnedLeads.js || true
cd ${APP}/frontend
npm install
npm run build
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
