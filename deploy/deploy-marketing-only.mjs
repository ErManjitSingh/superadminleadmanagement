/**
 * Marketing-only deploy — updates landing page at domain root.
 * Does NOT touch backend, CRM (/app/), uploads, or superadmin.
 *
 * Usage: $env:VPS_PASSWORD='...'; node deploy/deploy-marketing-only.mjs
 *
 * Requires changes pushed to origin/main (script git-pulls on VPS).
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
  "echo '==> Git pull...'",
  'git fetch origin main',
  'git reset --hard origin/main',
  'echo "HEAD: $(git rev-parse --short HEAD)"',
  'git log -1 --oneline',
  "echo '==> Marketing env...'",
  `cat > ${APP}/marketing/.env.local <<EOF
NEXT_PUBLIC_CRM_URL=/app
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SUPERADMIN_URL=https://admin.${DOMAIN}/admin/login
EOF`,
  "echo '==> Marketing build...'",
  `cd ${APP}/marketing`,
  'npm install --silent',
  'npm run build',
  "echo '==> Publish marketing (preserve /app, /task and /uploads)...'",
  // IMPORTANT: '/app/' (anchored) — bare 'app/' also skips Next.js _next/static/chunks/app/
  `rsync -a --delete --exclude '/app/' --exclude '/task/' --exclude '/uploads/' ${APP}/marketing/out/ ${WEB}/`,
  `test -f ${WEB}/index.html`,
  `ls ${WEB}/_next/static/chunks/app/page-*.js >/dev/null`,
  `test -f ${WEB}/app/index.html`,
  `test -f ${WEB}/task/index.html`,
  "echo '==> Refresh nginx cache headers for / ...'",
  `cp ${APP}/deploy/nginx/indiaholidaydestination.com.conf /etc/nginx/sites-available/indiaholidaydestination.com`,
  'nginx -t',
  'systemctl reload nginx',
  'echo DEPLOY_MARKETING_OK',
  `PAGE_JS=$(ls ${WEB}/_next/static/chunks/app/page-*.js | head -n1)`,
  'echo "Page chunk: $PAGE_JS"',
  'test -n "$PAGE_JS"',
  `echo "Landing: https://${DOMAIN}/"`,
  `echo "CRM still at: https://${DOMAIN}/app/login"`,
].join('\n');

const conn = new Client();

conn
  .on('ready', () => {
    console.log('SSH connected.\n');
    conn.exec(remoteCmd, (err, stream) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        conn.end();
        if (code !== 0) {
          console.error(`\nRemote exited with code ${code}`);
          process.exit(code || 1);
        }
        console.log('\nMarketing deploy complete.');
        console.log(`Landing: https://${DOMAIN}/`);
        console.log(`CRM Login: https://${DOMAIN}/app/login`);
        console.log('Hard-refresh the browser (Ctrl+Shift+R) if you still see old UI.');
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 120000 });
