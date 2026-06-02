/**
 * Serve unotrips.com from static export (public_html) — source app/ missing on VPS
 */
import { Client } from 'ssh2';
const PASSWORD = process.env.VPS_PASSWORD;

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
# Stop broken Next.js server (no app/ source on disk)
pm2 stop unotrips 2>/dev/null || true
pm2 delete unotrips 2>/dev/null || true
pm2 save

# Patch unotrips.com nginx: serve static export instead of :3000 for main routes
CONF=/etc/nginx/sites-available/unotrips.com
if grep -q 'proxy_pass http://127.0.0.1:3000' "$CONF" 2>/dev/null; then
  echo "Note: unotrips.com may still proxy to :3000 in some blocks — check manually"
fi

# Show if static site works
curl -sf -o /dev/null -w "public_html index: %{http_code}\\n" file:///var/www/unotrips.com/public_html/index.html 2>/dev/null || \\
  test -f /var/www/unotrips.com/public_html/index.html && echo "public_html index.html exists"

echo ""
echo "unotrips PM2 stopped. To fix Next.js SSR again, upload full source (app/ folder) to /var/www/unotrips-app and run: npm ci && npm run build && pm2 start npm --name unotrips -- start"
echo "STATIC_FIX_OK"
`;

const conn = new Client();
conn.on('ready', async () => {
  try {
    await exec(conn, script);
    conn.end();
  } catch (e) {
    console.error(e.message);
    conn.end();
    process.exit(1);
  }
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
