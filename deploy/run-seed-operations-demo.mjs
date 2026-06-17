import { Client } from 'ssh2';

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

const script = `set -e
cd ${APP_ROOT}
git fetch origin main
git reset --hard origin/main
cd backend
echo "==> Seeding operations demo (10 leads + bookings)..."
npm run seed:operations-demo
echo "SEED_OPERATIONS_DEMO_OK"
`;

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      await exec(conn, script);
      console.log('\nOperations demo data ready on VPS.');
    } catch (err) {
      console.error(err.message);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  })
  .on('error', (err) => {
    console.error(err.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD });
