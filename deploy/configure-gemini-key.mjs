/**
 * Upsert GEMINI_API_KEY in backend .env on IHD VPS and restart API.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/configure-gemini-key.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ENV_FILE = '/var/www/leadmanagement/backend/.env';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}
if (!GEMINI_KEY) {
  console.error('Set GEMINI_API_KEY environment variable.');
  process.exit(1);
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}: ${errOut || out}`));
        else resolve(out);
      });
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d;
      });
      stream.stderr.on('data', (d) => {
        process.stderr.write(d);
        errOut += d;
      });
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      const keyB64 = Buffer.from(GEMINI_KEY, 'utf8').toString('base64');
      await exec(
        conn,
        `
set -e
KEY=$(echo '${keyB64}' | base64 -d)
ENV_FILE='${ENV_FILE}'
touch "$ENV_FILE"
grep -v '^GEMINI_API_KEY=' "$ENV_FILE" | grep -v '^GEMINI_MODEL=' | grep -v '^AI_ITINERARY_PROVIDER=' > /tmp/ihd.env.tmp || true
cat /tmp/ihd.env.tmp > "$ENV_FILE"
echo "GEMINI_API_KEY=$KEY" >> "$ENV_FILE"
echo "GEMINI_MODEL=gemini-2.5-flash" >> "$ENV_FILE"
echo "AI_ITINERARY_PROVIDER=gemini" >> "$ENV_FILE"
chmod 600 "$ENV_FILE"
rm -f /tmp/ihd.env.tmp
echo "GEMINI configured (key hidden)"
pm2 restart ihd-crm-api
sleep 2
pm2 status ihd-crm-api | head -5
`,
      );
      console.log('\nDone. Test AI itinerary in CRM.');
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD });
