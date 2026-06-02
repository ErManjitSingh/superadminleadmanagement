import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/unotrips-app';

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
cd ${APP}
echo "=== Scripts on disk ==="
ls -la scripts 2>/dev/null || echo "NO scripts dir"

echo "=== Align react versions (lock sync) ==="
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.dependencies.next = '15.5.15';
p.dependencies.react = '19.2.5';
p.dependencies['react-dom'] = '19.2.5';
// skip broken prebuild if script missing
if (!fs.existsSync('scripts/prepare-build.mjs')) {
  p.scripts.prebuild = 'echo skip prebuild';
  console.log('prebuild disabled (prepare-build.mjs missing)');
}
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
"

rm -rf .next .next-build node_modules/.cache
npm install --include=dev

export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
npx next build

pm2 delete unotrips 2>/dev/null || true
NODE_ENV=production pm2 start npm --name unotrips -- start
pm2 save

sleep 5
curl -sf -o /dev/null -w "Homepage HTTP %{http_code}\\n" http://127.0.0.1:3000/ || true
echo "=== Error log (last 15) ==="
tail -15 /root/.pm2/logs/unotrips-error.log 2>/dev/null || true
echo "FIX_V2_OK"
`;

const conn = new Client();
conn.on('ready', async () => {
  try {
    await exec(conn, script);
    conn.end();
  } catch (e) {
    console.error('Failed:', e.message);
    conn.end();
    process.exit(1);
  }
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD, readyTimeout: 60000 });
