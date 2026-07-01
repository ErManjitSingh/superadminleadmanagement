import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
set -e
APP_ROOT=/var/www/leadmanagement
ADMIN_ROOT=/var/www/admin.indiaholidaydestination.com/public_html

mkdir -p "$ADMIN_ROOT"

cd "$APP_ROOT"
git fetch origin main
git reset --hard origin/main

# Expand SSL cert to include admin subdomain (idempotent)
certbot certonly --nginx \
  -d indiaholidaydestination.com \
  -d www.indiaholidaydestination.com \
  -d admin.indiaholidaydestination.com \
  --non-interactive --agree-tos -m admin@indiaholidaydestination.com --expand 2>&1 || true

# Apply nginx config with HTTPS admin block
cp "$APP_ROOT/deploy/nginx/indiaholidaydestination.com.conf" /etc/nginx/sites-available/indiaholidaydestination.com
ln -sf /etc/nginx/sites-available/indiaholidaydestination.com /etc/nginx/sites-enabled/indiaholidaydestination.com
nginx -t
systemctl reload nginx

# Ensure superadmin build is published
if [ ! -f "$ADMIN_ROOT/index.html" ]; then
  bash "$APP_ROOT/deploy/scripts/ihd-vps-deploy.sh"
fi

echo "=== Verify ==="
curl -sk https://admin.indiaholidaydestination.com/ | grep -o '<title>[^<]*</title>' || true
curl -sk -o /dev/null -w "HTTPS:%{http_code}\\n" https://admin.indiaholidaydestination.com/
`, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      conn.end();
      process.exit(code || 0);
    });
  });
}).connect({
  host: '187.127.188.30',
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
