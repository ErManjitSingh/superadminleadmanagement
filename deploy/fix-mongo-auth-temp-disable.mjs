/**
 * Fix Mongo auth on the VPS by temporarily disabling authorization,
 * creating an application Mongo user, and then re-enabling authorization.
 *
 * Why: the existing fix requires admin credentials; in some deployments we only
 * have unauthenticated connection, so we temporarily disable authorization to bootstrap.
 *
 * Usage:
 *   $env:VPS_PASSWORD='...'
 *   node deploy/fix-mongo-auth-temp-disable.mjs
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
const mongoURI = `mongodb://${APP_USER}:${mongoPassword}@127.0.0.1:27017/${DB_NAME}?authSource=admin`;

const remoteScript = `
set -e
cd ${APP_ROOT}/backend

echo "=== MongoDB config detection ==="
CONF_FILE=""
if [ -f /etc/mongod.conf ]; then CONF_FILE=/etc/mongod.conf; fi
if [ -z "$CONF_FILE" ] && [ -f /etc/mongodb.conf ]; then CONF_FILE=/etc/mongodb.conf; fi
if [ -z "$CONF_FILE" ]; then
  echo "Could not find mongod config file at /etc/mongod.conf or /etc/mongodb.conf"
  exit 1
fi
echo "Using config: $CONF_FILE"

echo "=== Backup config ==="
cp "$CONF_FILE" "$CONF_FILE.bak.\$(date +%s)"

echo "=== Temporarily disable Mongo authorization ==="
# Works for common YAML forms: security.authorization: enabled OR authorization: enabled
sed -i 's/authorization: enabled/authorization: disabled/g' "$CONF_FILE" || true

systemctl restart mongod
sleep 3

echo "=== Create/update application Mongo user ==="
mongosh admin --quiet <<'MONGO'
const user = '${APP_USER}';
const pwd = '${mongoPassword}';
const dbName = '${DB_NAME}';

const db = db.getSiblingDB('admin');
const existing = db.getUser(user);
if (existing) {
  db.updateUser(user, { pwd });
  print('USER_UPDATED');
} else {
  db.createUser({
    user,
    pwd,
    roles: [{ role: 'readWrite', db: dbName }]
  });
  print('USER_CREATED');
}
MONGO

echo "=== Update backend .env MONGO_URI ==="
if [ -f .env ]; then
  sed -i "s|^MONGO_URI=.*|MONGO_URI=${mongoURI}|g" .env
else
  echo "ERROR: backend/.env not found"
  exit 1
fi

echo "=== Re-enable Mongo authorization ==="
sed -i 's/authorization: disabled/authorization: enabled/g' "$CONF_FILE" || true

systemctl restart mongod
sleep 3

echo "=== Restart API ==="
pm2 restart ihd-crm-api
sleep 4

echo "=== API health ==="
curl -sf http://127.0.0.1:5000/api/health || true
echo ""
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
        process.exit(code || 0);
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, username: 'root', password: PASSWORD, readyTimeout: 120000 });

