/**
 * Finish crm workspace enable: mongo subdomain, API restart, frontend builds.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/enable-crm-workspace-finish.mjs
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

echo "==> Assign workspace subdomain crm..."
URI=$(grep '^MONGO_URI=' "$APP/backend/.env" | cut -d= -f2- | tr -d '\\r')
mongosh "$URI" --quiet --eval '
const taken = db.companies.findOne({ subdomain: "crm" });
print("existing_crm=" + (taken ? (taken.name + "|" + taken._id) : "none"));
const list = db.companies.find({ deletedAt: null }, { name: 1, subdomain: 1, ownerEmail: 1, slug: 1 }).toArray();
list.forEach((c) => print("company " + c.name + " | " + c.subdomain + " | " + c.ownerEmail));
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
    print("SET subdomain=crm for " + target.name);
  } else {
    print("NO_COMPANY_TO_ASSIGN");
  }
} else {
  print("crm already assigned");
}
'

echo "==> Restart API..."
pm2 restart ihd-crm-api
sleep 3
curl -sf http://127.0.0.1:5000/api/health
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
printf 'VITE_API_URL=/api\\nVITE_BASE=/app/\\nVITE_PLATFORM_DOMAIN=${DOMAIN}\\n' > ${APP}/frontend/.env
cd ${APP}/frontend
npm install --silent
VITE_BASE=/app/ npm run build
rsync -a --delete ${APP}/frontend/dist/ ${WEB}/app/

echo "==> Host header checks..."
curl -sk -o /dev/null -w "apex_api:%{http_code}\\n" -H "Host: ${DOMAIN}" https://127.0.0.1/api/health || true
curl -sk -o /dev/null -w "crm_http:%{http_code}\\n" -H "Host: crm.${DOMAIN}" http://127.0.0.1/app/ || true
curl -sk -o /dev/null -w "crm_https:%{http_code}\\n" -H "Host: crm.${DOMAIN}" https://127.0.0.1/app/ || true

echo ENABLE_CRM_FINISH_OK
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
