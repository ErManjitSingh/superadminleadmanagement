import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
echo "=== admin index.html title ==="
grep title /var/www/admin.indiaholidaydestination.com/public_html/index.html

echo "=== CRM index.html title ==="
grep title /var/www/indiaholidaydestination.com/public_html/index.html

echo "=== curl with resolve ==="
curl -sk --resolve admin.indiaholidaydestination.com:443:127.0.0.1 https://admin.indiaholidaydestination.com/ | grep title

echo "=== nginx -T admin 443 ==="
nginx -T 2>/dev/null | grep -A3 "server_name admin"
`, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.188.30',
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
