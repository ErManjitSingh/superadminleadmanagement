/**
 * WorkFlow Hub-only deploy: builds and publishes the /task SPA.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/deploy-task-only.mjs
 *
 * Requires committed changes on origin/main and existing /task Nginx routing.
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/leadmanagement';
const WEB = '/var/www/indiaholidaydestination.com/public_html';
const DOMAIN = 'indiaholidaydestination.com';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

const remoteCmd = [
  'set -euo pipefail',
  `cd ${APP}`,
  'git fetch origin main',
  'git reset --hard origin/main',
  `cd ${APP}/frontend`,
  'npm ci --silent',
  'VITE_API_URL=/api VITE_BASE=/task/ npm run build:task',
  `test -f ${APP}/frontend/dist-task/index.html`,
  'rm -rf /tmp/workflow-hub-release',
  'mkdir -p /tmp/workflow-hub-release',
  `rsync -a --delete ${APP}/frontend/dist-task/ /tmp/workflow-hub-release/`,
  `mkdir -p ${WEB}/task`,
  `rsync -a --delete /tmp/workflow-hub-release/ ${WEB}/task/`,
  'rm -rf /tmp/workflow-hub-release',
  `test -f ${WEB}/task/index.html`,
  `curl -fsS https://${DOMAIN}/task/ | grep -q 'WorkFlow Hub'`,
  `curl -fsS https://${DOMAIN}/task/projects/deep-link-check | grep -q 'WorkFlow Hub'`,
  `curl -fsS https://${DOMAIN}/api/health >/dev/null`,
  'echo DEPLOY_TASK_OK',
].join('\n');

const connection = new Client();

connection
  .on('ready', () => {
    console.log('SSH connected.\n');
    connection.exec(remoteCmd, (error, stream) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      stream.on('data', (data) => process.stdout.write(data));
      stream.stderr.on('data', (data) => process.stderr.write(data));
      stream.on('close', (code) => {
        connection.end();
        if (code !== 0) {
          console.error(`\nRemote exited with code ${code}`);
          process.exit(code || 1);
        }
        console.log(`\nWorkFlow Hub deployed: https://${DOMAIN}/task/`);
      });
    });
  })
  .on('error', (error) => {
    console.error('SSH error:', error.message);
    process.exit(1);
  })
  .connect({
    host: HOST,
    port: PORT,
    username: USER,
    password: PASSWORD,
    readyTimeout: 120000,
  });
