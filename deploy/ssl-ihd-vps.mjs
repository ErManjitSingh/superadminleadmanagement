import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
certbot --nginx -d indiaholidaydestination.com -d www.indiaholidaydestination.com --non-interactive --agree-tos -m admin@indiaholidaydestination.com --redirect 2>&1
echo CERTBOT_EXIT:$?
nginx -t && systemctl reload nginx
curl -sk https://indiaholidaydestination.com/api/health
echo ""
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
