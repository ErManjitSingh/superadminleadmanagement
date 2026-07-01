import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
curl -s -H "Host: indiaholidaydestination.com" http://127.0.0.1/api/health
echo ""
curl -s -o /dev/null -w "CRM homepage: %{http_code}\n" -H "Host: indiaholidaydestination.com" http://127.0.0.1/
curl -s -o /dev/null -w "Admin homepage: %{http_code}\n" -H "Host: admin.indiaholidaydestination.com" http://127.0.0.1/
dig +short indiaholidaydestination.com A 2>/dev/null || true
`, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.188.30',
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
