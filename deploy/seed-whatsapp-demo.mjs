/**
 * Seed 10 demo WhatsApp leads on VPS MongoDB.
 * Run from project root: node deploy/seed-whatsapp-demo.mjs
 * Requires VPS_PASSWORD (same as git-pull-deploy).
 */
import { Client } from 'ssh2';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const PASSWORD = process.env.VPS_PASSWORD;
const HOST = process.env.VPS_HOST || '69.62.76.249';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const APP_ROOT = '/var/www/testing-unotrips-crm';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d;
      });
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}`));
        else resolve(out);
      });
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      console.log('==> Upload seed script…');
      const scriptPath = path.join(REPO_ROOT, 'backend/src/scripts/seedWhatsappDemo.js');
      const scriptBody = fs.readFileSync(scriptPath, 'utf8');
      const b64 = Buffer.from(scriptBody).toString('base64');
      await exec(conn, `mkdir -p ${APP_ROOT}/backend/src/scripts`);
      await exec(
        conn,
        `echo '${b64}' | base64 -d > ${APP_ROOT}/backend/src/scripts/seedWhatsappDemo.js`
      );
      console.log('==> Seeding WhatsApp demo leads…');
      await exec(conn, `cd ${APP_ROOT}/backend && node src/scripts/seedWhatsappDemo.js`);
      console.log('SEED_WHATSAPP_DEMO_OK');
    } catch (e) {
      console.error(e.message);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error(e);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD });
