#!/usr/bin/env bash
# Git-based deploy for indiaholidaydestination.com VPS
set -euo pipefail

APP_ROOT="/var/www/leadmanagement"
WEB_ROOT="/var/www/indiaholidaydestination.com/public_html"
ADMIN_WEB_ROOT="/var/www/admin.indiaholidaydestination.com/public_html"
DOMAIN="indiaholidaydestination.com"
REPO="https://github.com/ErManjitSingh/superadminleadmanagement.git"

echo "==> Ensure directories..."
mkdir -p "$APP_ROOT/logs" "$WEB_ROOT" "$ADMIN_WEB_ROOT" /var/www/certbot

echo "==> Pull latest code from GitHub..."
if [ ! -d "$APP_ROOT/.git" ]; then
  git clone "$REPO" "$APP_ROOT"
fi
cd "$APP_ROOT"
git fetch origin main
git reset --hard origin/main

echo "==> Backend .env (create only if missing)..."
if [ ! -f "$APP_ROOT/backend/.env" ]; then
  JWT_SECRET=$(openssl rand -base64 48)
  SA_JWT=$(openssl rand -base64 48)
  cat > "$APP_ROOT/backend/.env" <<EOF
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://127.0.0.1:27017/indiaholidaydestination_crm
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=30d
SUPERADMIN_JWT_SECRET=${SA_JWT}
SUPERADMIN_JWT_EXPIRES_IN=8h
SUPERADMIN_EMAIL=superadmin@${DOMAIN}
SUPERADMIN_PASSWORD=SuperAdmin@IHD2026
CRM_FRONTEND_URL=https://${DOMAIN}
PLATFORM_DOMAIN=${DOMAIN}
CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},https://admin.${DOMAIN}
SEED_PASSWORD=123456
REDIS_URL=redis://127.0.0.1:6379
EOF
  chmod 600 "$APP_ROOT/backend/.env"
fi

echo 'VITE_API_URL=/api' > "$APP_ROOT/frontend/.env"
echo 'VITE_BASE=/app/' >> "$APP_ROOT/frontend/.env"
cat > "$APP_ROOT/marketing/.env.local" <<EOF
NEXT_PUBLIC_CRM_URL=/app
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SUPERADMIN_URL=https://admin.${DOMAIN}/admin/login
EOF
cat > "$APP_ROOT/superadmin/.env" <<EOF
VITE_API_URL=/api/superadmin
VITE_CRM_URL=https://${DOMAIN}
VITE_PLATFORM_DOMAIN=${DOMAIN}
EOF

systemctl start mongod 2>/dev/null || true
systemctl start redis-server 2>/dev/null || true

# Chromium libs for Puppeteer voucher PDF rendering (always ensure — idempotent)
echo "==> Ensure Puppeteer/Chromium system dependencies..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  ca-certificates fonts-liberation fonts-noto-color-emoji \
  libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 \
  libcairo2 libcups2t64 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0t64 libgtk-3-0t64 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxkbcommon0 libxrandr2 libxrender1 libxss1 libxtst6 \
  wget xdg-utils \
  2>/dev/null || DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libatspi2.0-0 libcairo2 libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxkbcommon0 \
  libxrandr2 libxrender1 libxss1 libxtst6 wget xdg-utils \
  || true
ldconfig 2>/dev/null || true

echo "==> Backend..."
cd "$APP_ROOT/backend"
npm install --omit=dev
node -e "require('./src/config/env');const m=require('mongoose');const U=require('./src/models/User');m.connect(require('./src/config/env').mongoUri).then(async()=>{process.exit((await U.countDocuments())>0?0:1)}).catch(()=>process.exit(1))" \
  && echo "CRM DB already seeded" || npm run seed
npm run seed:platform 2>/dev/null || true
node src/scripts/migratePlanIdField.js 2>/dev/null || true

echo "==> CRM frontend build (base /app/)..."
cd "$APP_ROOT/frontend"
npm install
VITE_BASE=/app/ npm run build

echo "==> Marketing site build..."
cd "$APP_ROOT/marketing"
npm install
npm run build

echo "==> Publish marketing site to public_html root..."
rsync -a --delete "$APP_ROOT/marketing/out/" "$WEB_ROOT/"

echo "==> Publish CRM to public_html/app/..."
mkdir -p "$WEB_ROOT/app"
rsync -a --delete "$APP_ROOT/frontend/dist/" "$WEB_ROOT/app/"

echo "==> Super Admin build..."
cd "$APP_ROOT/superadmin"
npm install
npm run build
rsync -a --delete "$APP_ROOT/superadmin/dist/" "$ADMIN_WEB_ROOT/"

echo "==> PM2..."
cd "$APP_ROOT"
pm2 delete ihd-crm-api 2>/dev/null || true
pm2 start deploy/ecosystem.ihd.config.cjs
pm2 save

echo "==> Nginx..."
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  cp "$APP_ROOT/deploy/nginx/indiaholidaydestination.com.conf" "/etc/nginx/sites-available/${DOMAIN}"
else
  cp "$APP_ROOT/deploy/nginx/indiaholidaydestination.com.http-only.conf" "/etc/nginx/sites-available/${DOMAIN}"
fi
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

sleep 2
curl -sf http://127.0.0.1:5000/api/health
echo ""
test -f "$WEB_ROOT/index.html" && echo "public_html index.html OK"
echo "DEPLOY_OK"
