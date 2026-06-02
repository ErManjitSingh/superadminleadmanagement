/**
 * Fix Next.js unotrips-app on VPS:
 * - sync node_modules from package-lock
 * - clean .next cache
 * - fresh production build
 * - PM2 restart
 *
 * Run: $env:VPS_PASSWORD='...'; node deploy/fix-unotrips-next.mjs
 */
import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/unotrips-app';

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code ? reject(new Error(`Command failed (exit ${code})`)) : resolve()));
    });
  });
}

const script = `set -e
export DEBIAN_FRONTEND=noninteractive

echo "=== Node version (before) ==="
node -v

# Node 22 LTS — better Next 15 compatibility than mixed 20.x + stale builds
if ! node -v | grep -qE '^v22\\.'; then
  echo "=== Installing Node.js 22 LTS ==="
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "=== Node version (after) ==="
node -v
npm -v

cd ${APP}

echo "=== Stop PM2 unotrips ==="
pm2 stop unotrips 2>/dev/null || true

echo "=== Pin compatible versions in package.json ==="
node -e "
const fs = require('fs');
const p = '${APP}/package.json';
const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies.next = '15.5.15';
pkg.dependencies.react = '19.0.0';
pkg.dependencies['react-dom'] = '19.0.0';
if (!pkg.engines) pkg.engines = {};
pkg.engines.node = '>=20.18.0';
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\\n');
console.log('Pinned next@15.5.15 react@19.0.0');
"

echo "=== Clean caches ==="
npm run clean 2>/dev/null || true
rm -rf .next .next-build node_modules/.cache

echo "=== Fresh install (sync lockfile) ==="
rm -rf node_modules
npm install --include=dev

echo "=== Production build ==="
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
npm run build

echo "=== PM2 restart ==="
pm2 delete unotrips 2>/dev/null || true
cd ${APP}
NODE_ENV=production pm2 start npm --name unotrips -- start
pm2 save

sleep 4
echo "=== Health check ==="
curl -sf -o /dev/null -w "HTTP %{http_code}\\n" http://127.0.0.1:3000/ || echo "curl failed"

echo "=== Recent logs ==="
pm2 logs unotrips --lines 20 --nostream 2>/dev/null || true

echo "FIX_UNOTRIPS_OK"
`;

const conn = new Client();
conn.on('ready', async () => {
  try {
    console.log('SSH connected — fixing unotrips Next.js app...\n');
    await exec(conn, script);
    console.log('\nDone.');
    conn.end();
  } catch (e) {
    console.error('\nFailed:', e.message);
    conn.end();
    process.exit(1);
  }
});
conn.on('error', (e) => {
  console.error('SSH error:', e.message);
  process.exit(1);
});

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD, readyTimeout: 60000 });
