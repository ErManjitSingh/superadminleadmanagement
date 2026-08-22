/**
 * Diagnose crm.indiaholidaydestination.com on the VPS (nginx, cert, tenant).
 * Usage: $env:VPS_PASSWORD='...'; node deploy/diagnose-crm-subdomain.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/leadmanagement';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

const remoteCmd = `
set -euo pipefail
echo "=== DNS on VPS ==="
getent hosts crm.indiaholidaydestination.com || echo "crm: no hosts entry"
dig +short crm.indiaholidaydestination.com A || true
dig +short admin.indiaholidaydestination.com A || true

echo "=== Nginx crm server_name ==="
grep -n "server_name crm" /etc/nginx/sites-enabled/indiaholidaydestination.com || echo "NO crm server_name in enabled vhost"

echo "=== Cert SANs ==="
openssl x509 -in /etc/letsencrypt/live/indiaholidaydestination.com/fullchain.pem -noout -ext subjectAltName 2>/dev/null || true

echo "=== Host-header checks ==="
curl -s -o /dev/null -w "crm_http:%{http_code}\\n" -H "Host: crm.indiaholidaydestination.com" http://127.0.0.1/ || true
curl -sk -o /dev/null -w "crm_https_app:%{http_code}\\n" -H "Host: crm.indiaholidaydestination.com" https://127.0.0.1/app/ || true
curl -sk -o /dev/null -w "crm_https_api:%{http_code}\\n" -H "Host: crm.indiaholidaydestination.com" https://127.0.0.1/api/health || true
curl -sk -o /dev/null -w "apex_https_api:%{http_code}\\n" -H "Host: indiaholidaydestination.com" https://127.0.0.1/api/health || true

echo "=== CORS ==="
grep '^CORS_ORIGINS=' ${APP}/backend/.env || true

echo "=== Company subdomain crm ==="
URI=$(grep '^MONGO_URI=' ${APP}/backend/.env | cut -d= -f2- | tr -d '\\r')
mongosh "$URI" --quiet --eval '
const c = db.companies.findOne({ subdomain: "crm" }, { name:1, subdomain:1, ownerEmail:1, status:1, deletedAt:1 });
print("crm_company=" + (c ? [c.name, c.subdomain, c.ownerEmail, c.status, c.deletedAt || "active"].join(" | ") : "NONE"));
const ihd = db.companies.findOne({ deletedAt: null, $or: [{ name: /india holiday/i }, { ownerEmail: /indiaholidaydestination/i }] }, { name:1, subdomain:1, ownerEmail:1, status:1 });
print("ihd=" + (ihd ? [ihd.name, ihd.subdomain, ihd.ownerEmail, ihd.status].join(" | ") : "NONE"));
'

echo "=== nginx error tail ==="
tail -n 15 /var/log/nginx/error.log 2>/dev/null || true

echo DIAGNOSE_CRM_OK
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
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 60000 });
