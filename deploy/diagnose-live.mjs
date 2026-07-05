import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
set -e
echo "=== Health ==="
curl -sf http://127.0.0.1:5000/api/health
echo ""
echo "=== Superadmin login ==="
TOKEN=$(curl -sf -X POST http://127.0.0.1:5000/api/superadmin/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"superadmin@indiaholidaydestination.com","password":"SuperAdmin@IHD2026"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
echo "token_len=\${#TOKEN}"
echo "=== List companies ==="
curl -s -w "\\nHTTP:%{http_code}\\n" http://127.0.0.1:5000/api/superadmin/companies \\
  -H "Authorization: Bearer $TOKEN" | tail -20
echo "=== PM2 errors ==="
pm2 logs ihd-crm-api --lines 40 --nostream --err 2>&1 | tail -40
echo "=== Company count ==="
mongosh indiaholidaydestination_crm --quiet --eval 'db.companies.countDocuments({deletedAt:null})'
`;
  conn.exec(cmd, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      conn.end();
      process.exit(code || 0);
    });
  });
}).connect({
  host: '187.127.188.30',
  port: 22,
  username: 'root',
  password: PASSWORD,
});
