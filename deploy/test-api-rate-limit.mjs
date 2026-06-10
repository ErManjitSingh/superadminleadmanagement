import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const conn = new Client();

const script = `set -e
echo "=== nav-counts without XFF ==="
curl -s -o /tmp/r1.txt -w "HTTP:%{http_code}" http://127.0.0.1:5000/api/nav-counts
echo ""
head -c 120 /tmp/r1.txt; echo ""

echo "=== nav-counts with XFF (like nginx) ==="
curl -s -o /tmp/r2.txt -w "HTTP:%{http_code}" -H "X-Forwarded-For: 203.0.113.1" http://127.0.0.1:5000/api/nav-counts
echo ""
head -c 120 /tmp/r2.txt; echo ""
`;

conn
  .on('ready', () => {
    conn.exec(script, { pty: true }, (err, stream) => {
      stream.on('data', (d) => process.stdout.write(d));
      stream.on('close', () => conn.end());
    });
  })
  .connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD, readyTimeout: 30000 });
