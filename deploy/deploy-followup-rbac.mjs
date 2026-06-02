import { Client } from 'ssh2';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = '/var/www/testing-unotrips-crm';
const PASSWORD = process.env.VPS_PASSWORD;

const files = [
  'backend/src/models/FollowUp.js',
  'backend/src/utils/followUpHelpers.js',
  'backend/src/utils/queryHelpers.js',
  'backend/src/services/followUpService.js',
  'backend/src/controllers/followUpController.js',
  'backend/src/controllers/salesExecutiveController.js',
  'backend/src/controllers/salesManagerController.js',
  'backend/src/controllers/teamLeaderController.js',
  'backend/src/controllers/leadController.js',
  'backend/src/routes/followUpRoutes.js',
  'backend/src/routes/salesExecutiveRoutes.js',
  'frontend/src/lib/followupPermissions.js',
  'frontend/src/components/followups/constants.js',
  'frontend/src/components/followups/followupApi.js',
  'frontend/src/components/followups/FollowUpCategoryBadge.jsx',
  'frontend/src/components/followups/FollowUpCategoryTabs.jsx',
  'frontend/src/components/followups/AddFollowUpModal.jsx',
  'frontend/src/components/followups/FollowUpPage.jsx',
  'frontend/src/components/followups/FollowUpHeader.jsx',
  'frontend/src/components/followups/FollowUpDataTable.jsx',
  'frontend/src/components/followups/FollowUpDetailDrawer.jsx',
  'frontend/src/components/lead-detail/LeadFollowUpSection.jsx',
  'frontend/src/components/lead-detail/LeadActionPanel.jsx',
  'frontend/src/components/lead-detail/leadDetailData.js',
  'frontend/src/components/sales-executive/ExecutiveFollowUpsPage.jsx',
  'frontend/src/components/sales-executive/ExecutiveLeadDetailPage.jsx',
  'frontend/src/components/sales-executive/MyLeadsPage.jsx',
  'frontend/src/components/sales-manager/FollowUpMonitoringPage.jsx',
  'frontend/src/components/sales-manager/ManagerLeadDetailPage.jsx',
  'frontend/src/components/team-leader/LeaderFollowUpsPage.jsx',
  'frontend/src/pages/LeadDetail.jsx',
  'frontend/src/components/whatsapp/WhatsAppLeadsPage.jsx',
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
