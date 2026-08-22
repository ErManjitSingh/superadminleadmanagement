/**
 * Enable crm.indiaholidaydestination.com on the VPS:
 * git pull, CORS, nginx, SSL expand, company subdomain, API restart.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/enable-crm-workspace.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/leadmanagement';
const ADMIN = '/var/www/admin.indiaholidaydestination.com/public_html';
const WEB = '/var/www/indiaholidaydestination.com/public_html';
const DOMAIN = 'indiaholidaydestination.com';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

const remoteCmd = `
set -euo pipefail
APP=${APP}
cd "$APP"

echo "==> Git pull..."
git fetch origin main
git reset --hard origin/main
echo "HEAD: $(git rev-parse --short HEAD)"
git log -1 --oneline

echo "==> CORS origin for crm.${DOMAIN}..."
python3 - <<'PY'
from pathlib import Path
import re
p = Path('/var/www/leadmanagement/backend/.env')
t = p.read_text()
needle = 'https://crm.indiaholidaydestination.com'
if needle in t:
    print('CORS already includes crm origin')
elif 'CORS_ORIGINS=' in t:
    t = re.sub(r'(CORS_ORIGINS=[^\\n]*)', r'\\1,' + needle, t, count=1)
    p.write_text(t)
    print('CORS updated')
else:
    t += '\\nCORS_ORIGINS=https://indiaholidaydestination.com,https://www.indiaholidaydestination.com,https://admin.indiaholidaydestination.com,' + needle + '\\n'
    p.write_text(t)
    print('CORS line added')
PY

echo "==> Apply nginx..."
cp "$APP/deploy/nginx/indiaholidaydestination.com.conf" /etc/nginx/sites-available/indiaholidaydestination.com
ln -sf /etc/nginx/sites-available/indiaholidaydestination.com /etc/nginx/sites-enabled/indiaholidaydestination.com
nginx -t
systemctl reload nginx

echo "==> DNS..."
getent hosts crm.${DOMAIN} || true
dig +short crm.${DOMAIN} A || true

echo "==> SSL expand (fails until DNS A record exists)..."
certbot certonly --nginx \\
  -d ${DOMAIN} \\
  -d www.${DOMAIN} \\
  -d admin.${DOMAIN} \\
  -d crm.${DOMAIN} \\
  --non-interactive --agree-tos -m admin@${DOMAIN} --expand 2>&1 || echo "CERTBOT_SKIPPED"

nginx -t && systemctl reload nginx

echo "==> Assign workspace subdomain crm if available..."
mongosh indiaholidaydestination_crm --quiet --eval '
const taken = db.companies.findOne({ subdomain: "crm" });
print("existing_crm=" + (taken ? (taken.name + "|" + taken._id) : "none"));
printjson(db.companies.find({ deletedAt: null }, { name: 1, subdomain: 1, ownerEmail: 1, slug: 1 }).toArray());
if (!taken) {
  const target = db.companies.findOne({
    deletedAt: null,
    $or: [
      { name: /india holiday/i },
      { slug: /india-holiday/i },
      { ownerEmail: /indiaholidaydestination/i },
      { subdomain: "uno-trips" }
    ]
  }) || db.companies.findOne({ deletedAt: null, isLegacy: true }) || db.companies.findOne({ deletedAt: null });
  if (target) {
    db.companies.updateOne({ _id: target._id }, { $set: { subdomain: "crm", updatedAt: new Date() } });
    print("SET subdomain=crm for " + target.name + " " + target._id);
  } else {
    print("NO_COMPANY_TO_ASSIGN");
  }
} else {
  print("crm already assigned");
}
'

echo "==> Restart API..."
pm2 restart ihd-crm-api
sleep 2
curl -sf http://127.0.0.1:5000/api/health || true
echo

echo "==> Superadmin build..."
cat > ${APP}/superadmin/.env <<EOF
VITE_API_URL=/api/superadmin
VITE_CRM_URL=https://${DOMAIN}
VITE_PLATFORM_DOMAIN=${DOMAIN}
EOF
cd ${APP}/superadmin
npm install --silent
npm run build
rsync -a --delete ${APP}/superadmin/dist/ ${ADMIN}/

echo "==> Frontend build..."
echo 'VITE_API_URL=/api' > ${APP}/frontend/.env
echo 'VITE_BASE=/app/' >> ${APP}/frontend/.env
echo 'VITE_PLATFORM_DOMAIN=${DOMAIN}' >> ${APP}/frontend/.env
cd ${APP}/frontend
npm install --silent
VITE_BASE=/app/ npm run build
rsync -a --delete ${APP}/frontend/dist/ ${WEB}/app/

echo "==> Host header checks..."
curl -sk -o /dev/null -w "apex:%{http_code}\\n" -H "Host: ${DOMAIN}" https://127.0.0.1/api/health || true
curl -sk -o /dev/null -w "crm_http:%{http_code}\\n" -H "Host: crm.${DOMAIN}" http://127.0.0.1/app/ || true
curl -sk -o /dev/null -w "crm_https:%{http_code}\\n" -H "Host: crm.${DOMAIN}" https://127.0.0.1/app/ || true

echo ENABLE_CRM_OK
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
