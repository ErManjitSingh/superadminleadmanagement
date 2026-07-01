import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
echo "=== CRM login test ==="
curl -sk -X POST https://indiaholidaydestination.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://indiaholidaydestination.com" \
  -d '{"email":"admin@crm.com","password":"123456"}'
echo ""

echo "=== Health ==="
curl -sk https://indiaholidaydestination.com/api/health
echo ""

echo "=== PM2 ==="
pm2 status | head -5

echo "=== Recent errors ==="
pm2 logs ihd-crm-api --lines 20 --nostream 2>&1 | tail -25
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
