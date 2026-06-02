/** Rebuild frontend with VITE_API_URL=/api on VPS */
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const APP = '/var/www/testing-unotrips-crm';
const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const files = [
  'frontend/src/api/axios.js',
  'frontend/src/pages/Login.jsx',
  'frontend/src/components/lead-wizard/useLeadWizard.js',
  'frontend/src/components/lead-wizard/leadWizardUtils.js',
  'frontend/src/components/lead-wizard/constants.js',
  'frontend/src/components/lead-wizard/steps/StepAssignment.jsx',
  'frontend/src/components/lead-wizard/steps/StepReview.jsx',
  'frontend/src/lib/zodUtils.js',
  'frontend/.env.production',
  'deploy/env/frontend.env.production',
  'backend/src/utils/normalizeLeadInput.js',
  'backend/src/models/Lead.js',
  'backend/src/controllers/leadController.js',
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
conn
  .on('ready', () => {
    conn.sftp(async (err, sftp) => {
      if (err) return console.error(err);
      try {
        for (const rel of files) {
          const local = path.join(ROOT, rel);
          const remote = `${APP}/${rel.replace(/\\/g, '/')}`;
          await new Promise((res, rej) => sftp.fastPut(local, remote, (e) => (e ? rej(e) : res())));
          console.log('Uploaded', rel);
        }
        await exec(
          conn,
          `cd ${APP}/frontend && cp ../deploy/env/frontend.env.production .env && npm run build && echo BUILD_OK`
        );
        console.log('Done. Hard-refresh browser (Ctrl+Shift+R) and login with admin@crm.com / 123456');
      } catch (e) {
        console.error(e);
        process.exitCode = 1;
      } finally {
        conn.end();
      }
    });
  })
  .connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
