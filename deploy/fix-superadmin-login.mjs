import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
cd /var/www/leadmanagement/backend

# Ensure CORS includes admin subdomain
if ! grep -q 'admin.indiaholidaydestination.com' .env 2>/dev/null; then
  sed -i 's|^CORS_ORIGINS=.*|&https://admin.indiaholidaydestination.com|' .env || \
  echo 'CORS_ORIGINS=https://indiaholidaydestination.com,https://www.indiaholidaydestination.com,https://admin.indiaholidaydestination.com' >> .env
fi

# Reset super admin password
node <<'NODE'
require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('./src/superadmin/models/SuperAdmin');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@indiaholidaydestination.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@IHD2026';
  let admin = await SuperAdmin.findOne({ email }).select('+password');
  if (!admin) {
    await SuperAdmin.create({
      name: 'Platform Super Admin',
      email,
      password,
      role: 'super_admin',
    });
    console.log('Super admin CREATED:', email);
  } else {
    admin.password = password;
    admin.status = 'active';
    await admin.save();
    console.log('Super admin PASSWORD RESET:', email);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
NODE

pm2 restart ihd-crm-api
sleep 3

echo "=== Login test ==="
curl -sk -X POST https://admin.indiaholidaydestination.com/api/superadmin/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://admin.indiaholidaydestination.com" \
  -d '{"email":"superadmin@indiaholidaydestination.com","password":"SuperAdmin@IHD2026"}'
echo ""
`, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.188.30',
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
