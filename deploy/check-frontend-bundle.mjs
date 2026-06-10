import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const conn = new Client();

const script = `set -e
echo "=== server.js trust proxy ==="
grep -n "trust proxy" /var/www/testing-unotrips-crm/backend/src/server.js || echo "NOT FOUND"

echo "=== frontend nav-counts in bundle ==="
grep -rl "nav-counts" /var/www/testing-unotrips-crm/frontend/dist/assets/*.js 2>/dev/null | head -3 || echo "NOT IN BUNDLE"

echo "=== frontend applySidebarCounts ==="
grep -rl "applySidebarCounts\\|countKey" /var/www/testing-unotrips-crm/frontend/dist/assets/*.js 2>/dev/null | head -3 || echo "NOT FOUND"

echo "=== useSidebarCounts source on VPS ==="
head -35 /var/www/testing-unotrips-crm/frontend/src/hooks/useSidebarCounts.js
`;

conn
  .on('ready', () => {
    conn.exec(script, { pty: true }, (err, stream) => {
      stream.on('data', (d) => process.stdout.write(d));
      stream.on('close', () => conn.end());
    });
  })
  .connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD, readyTimeout: 30000 });
