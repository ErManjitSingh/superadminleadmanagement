import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = '/var/www/testing-unotrips-crm';
const PASSWORD = process.env.VPS_PASSWORD;

const files = [
  'frontend/src/components/lead-wizard/WizardFormContext.jsx',
  'frontend/src/components/lead-wizard/WizardFormBody.jsx',
  'frontend/src/components/lead-wizard/useLeadWizard.js',
  'frontend/src/components/lead-wizard/LeadWizard.jsx',
  'frontend/src/components/lead-wizard/constants.js',
  'frontend/src/components/lead-wizard/steps/StepCustomerDetails.jsx',
  'frontend/src/components/lead-wizard/steps/StepTravelDetails.jsx',
  'frontend/src/components/lead-wizard/steps/StepLeadInformation.jsx',
  'frontend/src/components/lead-wizard/steps/StepReview.jsx',
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
      await exec(
        conn,
        `cd ${APP}/frontend && npm run build && cd ${APP} && pm2 restart testing-unotrips-api && echo DONE`
      );
    } catch (e) {
      console.error(e);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  });
}).connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
