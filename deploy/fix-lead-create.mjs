/** Deploy lead create fixes to VPS */
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
  'frontend/src/components/lead-wizard/useLeadWizard.js',
  'frontend/src/components/lead-wizard/LeadWizard.jsx',
  'frontend/src/components/lead-wizard/constants.js',
  'frontend/src/components/lead-wizard/leadWizardUtils.js',
  'frontend/src/components/lead-wizard/steps/StepTravelDetails.jsx',
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
        `cd ${APP}/frontend && npm run build && cd ${APP} && pm2 restart testing-unotrips-api && sleep 2 && curl -sf http://127.0.0.1:5000/api/health && echo "" && echo DONE`
      );
    } catch (e) {
      console.error(e);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  });
}).connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
