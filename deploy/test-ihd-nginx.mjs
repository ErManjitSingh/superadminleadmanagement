import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
curl -s -H "Host: indiaholidaydestination.com" http://127.0.0.1/api/health
echo ""
curl -s -o /dev/null -w "Marketing homepage: %{http_code}\n" -H "Host: indiaholidaydestination.com" http://127.0.0.1/
curl -s -o /dev/null -w "CRM app: %{http_code}\n" -H "Host: indiaholidaydestination.com" http://127.0.0.1/app/
curl -s -o /dev/null -w "WorkFlow Hub redirect: %{http_code}\n" -H "Host: indiaholidaydestination.com" http://127.0.0.1/task
curl -s -H "Host: indiaholidaydestination.com" http://127.0.0.1/task/ | grep -q "WorkFlow Hub" && echo "WorkFlow Hub homepage: OK"
curl -s -H "Host: indiaholidaydestination.com" http://127.0.0.1/task/projects/deep-link-check | grep -q "WorkFlow Hub" && echo "WorkFlow Hub deep route: OK"
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
