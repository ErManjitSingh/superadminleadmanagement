import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
set -e
mkdir -p /var/www/indiaholidaydestination.com/public_html /var/www/admin.indiaholidaydestination.com/public_html
cp -a /var/www/leadmanagement/backend/.env /tmp/ihd-backend.env.bak 2>/dev/null || true
rm -rf /var/www/leadmanagement
git clone https://github.com/ErManjitSingh/superadminleadmanagement.git /var/www/leadmanagement
cp -a /tmp/ihd-backend.env.bak /var/www/leadmanagement/backend/.env 2>/dev/null || true
chmod +x /var/www/leadmanagement/deploy/scripts/ihd-vps-deploy.sh
bash /var/www/leadmanagement/deploy/scripts/ihd-vps-deploy.sh
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
