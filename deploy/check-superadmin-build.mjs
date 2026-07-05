import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
grep -r "api/superadmin\\|VITE_API" /var/www/admin.indiaholidaydestination.com/public_html/assets/*.js 2>/dev/null | head -3
echo "=== superadmin .env on server ==="
cat /var/www/leadmanagement/superadmin/.env
echo "=== pm2 logs errors ==="
pm2 logs ihd-crm-api --lines 15 --nostream 2>&1 | tail -20
`, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.188.30',
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
