import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
echo "=== backend .env (redacted) ==="
grep -E "SUPERADMIN|CORS|JWT|PLATFORM" /var/www/leadmanagement/backend/.env | sed 's/PASSWORD=.*/PASSWORD=***/;s/SECRET=.*/SECRET=***/'

echo "=== Test login API ==="
curl -sk -X POST https://admin.indiaholidaydestination.com/api/superadmin/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://admin.indiaholidaydestination.com" \
  -d '{"email":"superadmin@indiaholidaydestination.com","password":"SuperAdmin@IHD2026"}'

echo ""
echo "=== SuperAdmin in DB ==="
mongosh indiaholidaydestination_crm --quiet --eval 'db.superadmins.find({}, {email:1,status:1}).toArray()'
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
