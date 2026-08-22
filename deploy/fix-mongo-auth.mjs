/**
 * Fix MongoDB auth mismatch on VPS (causes login + tenant resolve to fail).
 *
 * Usage:
 *   $env:VPS_PASSWORD='your-vps-password'
 *   node deploy/fix-mongo-auth.mjs
 */
import { Client } from 'ssh2';
import crypto from 'crypto';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const PASSWORD = process.env.VPS_PASSWORD;
const APP_ROOT = '/var/www/leadmanagement';
const DB_NAME = 'indiaholidaydestination_crm';
const APP_USER = 'crmapp';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable first.');
  process.exit(1);
}

const mongoPassword = crypto.randomBytes(18).toString('base64url');

const remoteScript = `
set -e
cd ${APP_ROOT}/backend

echo "=== MongoDB status ==="
systemctl is-active mongod || systemctl start mongod
sleep 2

echo "=== Check if queries work without auth ==="
if mongosh ${DB_NAME} --quiet --eval 'db.companies.countDocuments({})' 2>/dev/null | grep -qE '^[0-9]+$'; then
  echo "MongoDB allows unauthenticated reads — no credential fix needed."
  NEED_AUTH_FIX=0
else
  echo "MongoDB requires authentication."
  NEED_AUTH_FIX=1
fi

if [ "$NEED_AUTH_FIX" = "1" ]; then
  echo "=== Ensure app MongoDB user exists ==="
  mongosh admin --quiet <<'MONGO'
try {
  db.getUser('${APP_USER}');
  print('USER_EXISTS');
} catch (e) {
  print('USER_MISSING');
}
MONGO

  mongosh admin --quiet <<MONGO
const pwd = '${mongoPassword}';
try {
  db.updateUser('${APP_USER}', { pwd });
  print('USER_UPDATED');
} catch (e) {
  db.createUser({
    user: '${APP_USER}',
    pwd,
    roles: [{ role: 'readWrite', db: '${DB_NAME}' }],
  });
  print('USER_CREATED');
}
MONGO

  NEW_URI="mongodb://${APP_USER}:${mongoPassword}@127.0.0.1:27017/${DB_NAME}?authSource=admin"
  if grep -q '^MONGO_URI=' .env; then
    sed -i "s|^MONGO_URI=.*|MONGO_URI=\${NEW_URI}|" .env
  else
    echo "MONGO_URI=\${NEW_URI}" >> .env
  fi
  echo "Updated MONGO_URI with authenticated connection string."
fi

echo "=== Restart API ==="
pm2 restart ihd-crm-api
sleep 4

echo "=== Health ==="
curl -sf http://127.0.0.1:5000/api/health
echo ""

echo "=== Tenant resolve (custom domain) ==="
curl -s -w "\\nHTTP:%{http_code}\\n" http://127.0.0.1:5000/api/tenant/resolve \\
  -H "Host: crm.exploremybharat.info" | tail -5

echo "=== Superadmin login ==="
curl -s -w "\\nHTTP:%{http_code}\\n" -X POST http://127.0.0.1:5000/api/superadmin/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"superadmin@indiaholidaydestination.com","password":"SuperAdmin@IHD2026"}' | tail -5
`;

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(remoteScript, (err, stream) => {
      if (err) {
        console.error(err.message);
        conn.end();
        process.exit(1);
      }
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        conn.end();
        if (code === 0) {
          console.log('\nDone. If superadmin login still fails, run: node deploy/fix-superadmin-login.mjs');
        }
        process.exit(code || 0);
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, username: 'root', password: PASSWORD, readyTimeout: 120000 });
