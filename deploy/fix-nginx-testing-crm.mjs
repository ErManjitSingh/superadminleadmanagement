/**
 * Fix testing.unotrips.com nginx — serve CRM static + API, not Next.js :3000
 */
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PASSWORD = process.env.VPS_PASSWORD;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = '/var/www/testing-unotrips-crm';

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

const conn = new Client();
conn.on('ready', async () => {
  const sftp = await new Promise((res, rej) => conn.sftp((e, s) => (e ? rej(e) : res(s))));
  const localConf = path.join(ROOT, 'deploy/nginx/testing.unotrips.com.conf');
  await new Promise((res, rej) =>
    sftp.fastPut(localConf, '/etc/nginx/sites-available/testing.unotrips.com', (e) => (e ? rej(e) : res()))
  );

  const script = `set -e
ln -sf /etc/nginx/sites-available/testing.unotrips.com /etc/nginx/sites-enabled/testing.unotrips.com
nginx -t && systemctl reload nginx

# CRM clean rebuild
cd ${APP}/backend
rm -rf node_modules
npm install --omit=dev
cd ${APP}/frontend
rm -rf node_modules dist node_modules/.vite
npm install
npm run build
pm2 restart testing-unotrips-api

sleep 2
curl -sf http://127.0.0.1:5000/api/health
echo ""
curl -sf -o /dev/null -w "CRM static via nginx root: %{http_code}\\n" -H "Host: testing.unotrips.com" https://127.0.0.1/ -k || true
echo "NGINX_CRM_OK"
`;

  try {
    console.log('Fixing nginx + rebuilding CRM...\n');
    await exec(conn, script);
    conn.end();
  } catch (e) {
    console.error(e.message);
    conn.end();
    process.exit(1);
  }
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
