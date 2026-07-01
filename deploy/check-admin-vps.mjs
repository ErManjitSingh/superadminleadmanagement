import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
echo "=== DNS ==="
dig +short admin.indiaholidaydestination.com A

echo "=== Admin public_html ==="
ls -la /var/www/admin.indiaholidaydestination.com/public_html/ | head -10
test -f /var/www/admin.indiaholidaydestination.com/public_html/index.html && echo "index.html OK" || echo "index.html MISSING"

echo "=== Nginx admin block ==="
grep -A2 "admin.indiaholidaydestination" /etc/nginx/sites-enabled/indiaholidaydestination.com | head -20

echo "=== HTTP test ==="
curl -s -o /dev/null -w "HTTP:%{http_code}\n" -H "Host: admin.indiaholidaydestination.com" http://127.0.0.1/

echo "=== HTTPS test ==="
curl -sk -o /dev/null -w "HTTPS:%{http_code}\n" https://admin.indiaholidaydestination.com/ 2>/dev/null || echo "HTTPS failed"
`, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.188.30',
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
