/**
 * Clean rebuild travel-crm (Vite + Express) on VPS
 */
import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
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

const script = `set -e
cd ${APP}/backend
echo "=== CRM backend: clean install ==="
rm -rf node_modules
npm install --omit=dev

cd ${APP}/frontend
echo "=== CRM frontend: clean install + build ==="
rm -rf node_modules dist node_modules/.vite
npm install
npm run build

cd ${APP}
pm2 restart testing-unotrips-api
sleep 2
curl -sf http://127.0.0.1:5000/api/health
echo ""
echo "FIX_CRM_OK"
`;

const conn = new Client();
conn.on('ready', async () => {
  try {
    console.log('SSH — fixing testing-unotrips-crm...\n');
    await exec(conn, script);
    conn.end();
  } catch (e) {
    console.error(e.message);
    conn.end();
    process.exit(1);
  }
});
if (!PASSWORD) { console.error('Set VPS_PASSWORD'); process.exit(1); }
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD, readyTimeout: 60000 });
