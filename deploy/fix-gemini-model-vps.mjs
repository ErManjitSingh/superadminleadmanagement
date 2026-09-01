/**
 * Set GEMINI_MODEL=gemini-2.5-flash on VPS and restart API.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/fix-gemini-model-vps.mjs
 */
import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const ENV_FILE = '/var/www/leadmanagement/backend/.env';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const remoteCmd = [
  'set -euo pipefail',
  `ENV_FILE="${ENV_FILE}"`,
  'touch "$ENV_FILE"',
  'if grep -q "^GEMINI_MODEL=" "$ENV_FILE"; then',
  '  sed -i "s/^GEMINI_MODEL=.*/GEMINI_MODEL=gemini-2.5-flash/" "$ENV_FILE"',
  'else',
  '  echo "GEMINI_MODEL=gemini-2.5-flash" >> "$ENV_FILE"',
  'fi',
  'grep "^GEMINI_MODEL=" "$ENV_FILE" || true',
  'grep -q "^GEMINI_API_KEY=" "$ENV_FILE" && echo "GEMINI_API_KEY=present" || echo "WARN: GEMINI_API_KEY missing"',
  'pm2 restart ihd-crm-api',
  'sleep 2',
  'curl -sf http://127.0.0.1:5000/api/health',
  'echo',
  'echo FIX_GEMINI_MODEL_OK',
].join('\n');

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(remoteCmd, (err, stream) => {
      if (err) throw err;
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        conn.end();
        process.exit(code || 0);
      });
    });
  })
  .connect({
    host: process.env.VPS_HOST || '187.127.188.30',
    port: 22,
    username: 'root',
    password: PASSWORD,
    readyTimeout: 60000,
  });
