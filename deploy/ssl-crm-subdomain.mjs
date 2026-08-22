/**
 * Expand Let's Encrypt cert to include crm.indiaholidaydestination.com.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/ssl-crm-subdomain.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/leadmanagement';
const DOMAIN = 'indiaholidaydestination.com';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

const remoteCmd = `
set -euo pipefail
APP=${APP}
DOMAIN=${DOMAIN}

echo "==> DNS from VPS..."
getent hosts crm.\${DOMAIN} || true
dig +short crm.\${DOMAIN} A || true

echo "==> Ensure nginx crm vhost is live..."
cp "\$APP/deploy/nginx/indiaholidaydestination.com.conf" /etc/nginx/sites-available/indiaholidaydestination.com
ln -sf /etc/nginx/sites-available/indiaholidaydestination.com /etc/nginx/sites-enabled/indiaholidaydestination.com
nginx -t
systemctl reload nginx

echo "==> HTTP ACME path check..."
mkdir -p /var/www/certbot
curl -sI -H "Host: crm.\${DOMAIN}" http://127.0.0.1/.well-known/acme-challenge/ping | head -n 8 || true

echo "==> Cert SANs before..."
openssl x509 -in /etc/letsencrypt/live/\${DOMAIN}/fullchain.pem -noout -ext subjectAltName

echo "==> Expand cert with crm.\${DOMAIN}..."
certbot certonly --nginx \\
  --cert-name \${DOMAIN} \\
  -d \${DOMAIN} \\
  -d www.\${DOMAIN} \\
  -d admin.\${DOMAIN} \\
  -d crm.\${DOMAIN} \\
  --non-interactive --agree-tos -m admin@\${DOMAIN} --expand --keep-until-expiring
echo CERTBOT_EXIT:$?

nginx -t
systemctl reload nginx

echo "==> Cert SANs after..."
openssl x509 -in /etc/letsencrypt/live/\${DOMAIN}/fullchain.pem -noout -ext subjectAltName

echo "==> Public HTTPS checks..."
echo | openssl s_client -servername crm.\${DOMAIN} -connect 127.0.0.1:443 2>/dev/null | openssl x509 -noout -ext subjectAltName || true
curl -sI -o /dev/null -w "crm_https_verify:%{http_code} ssl:%{ssl_verify_result}\\n" --resolve crm.\${DOMAIN}:443:127.0.0.1 https://crm.\${DOMAIN}/app/ || true
curl -sk -o /dev/null -w "crm_https_insecure:%{http_code}\\n" --resolve crm.\${DOMAIN}:443:127.0.0.1 https://crm.\${DOMAIN}/app/ || true
curl -sI -o /dev/null -w "crm_api_verify:%{http_code} ssl:%{ssl_verify_result}\\n" --resolve crm.\${DOMAIN}:443:127.0.0.1 https://crm.\${DOMAIN}/api/health || true

echo SSL_CRM_OK
`;

const conn = new Client();
conn
  .on('ready', () => {
    console.log('SSH connected.\n');
    conn.exec(remoteCmd, (err, stream) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        conn.end();
        process.exit(code || 0);
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 180000 });
