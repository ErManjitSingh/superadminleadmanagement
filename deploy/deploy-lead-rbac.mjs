import { Client } from 'ssh2';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = '/var/www/testing-unotrips-crm';
const PASSWORD = process.env.VPS_PASSWORD;

const files = [
  'backend/src/config/permissions.js',
  'backend/src/middleware/requirePermission.js',
  'backend/src/routes/leadRoutes.js',
  'backend/src/controllers/salesExecutiveController.js',
  'backend/src/controllers/teamLeaderController.js',
  'frontend/src/lib/permissions.js',
  'frontend/src/lib/rolePermissions.js',
  'frontend/src/hooks/usePermissions.js',
  'frontend/src/App.jsx',
  'frontend/src/pages/Leads.jsx',
  'frontend/src/pages/LeadDetail.jsx',
  'frontend/src/components/leads/LeadDataTable.jsx',
  'frontend/src/components/leads/LeadPreviewDrawer.jsx',
  'frontend/src/components/leads/LeadPageHeader.jsx',
  'frontend/src/components/lead-detail/LeadActionPanel.jsx',
  'frontend/src/components/sales-executive/ExecutiveLeadDetailPage.jsx',
  'frontend/src/components/sales-executive/LeadActionsMenu.jsx',
  'frontend/src/lib/followupPermissions.js',
  'frontend/src/components/followups/AddFollowUpModal.jsx',
  'frontend/src/components/followups/followupApi.js',
  'frontend/src/components/lead-detail/LeadFollowUpSection.jsx',
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

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD env var');
  process.exit(1);
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
      await exec(conn, `cd ${APP}/frontend && npm run build`);
      await exec(conn, `cd ${APP}/backend && pm2 restart testing-unotrips-api`);
      console.log('Deploy complete — hard refresh browser (Ctrl+Shift+R)');
      conn.end();
    } catch (e) {
      console.error(e);
      conn.end();
      process.exit(1);
    }
  });
});
conn.on('error', console.error);
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
