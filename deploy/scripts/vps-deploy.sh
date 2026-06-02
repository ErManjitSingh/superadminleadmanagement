#!/usr/bin/env bash
# Run on VPS after code is in /var/www/testing-unotrips-crm
set -euo pipefail

APP_ROOT="/var/www/testing-unotrips-crm"
cd "$APP_ROOT"

echo "==> Backend dependencies..."
cd "$APP_ROOT/backend"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

if [ ! -f .env ]; then
  cp "$APP_ROOT/deploy/env/backend.env.production" .env
  echo "WARNING: Edit backend/.env and set JWT_SECRET before production use."
fi

echo "==> Seed database (first time only — safe to skip if already seeded)..."
read -r -p "Run npm run seed? [y/N] " SEED
if [[ "${SEED,,}" == "y" ]]; then
  npm run seed
fi

echo "==> Frontend build..."
cd "$APP_ROOT/frontend"
cp "$APP_ROOT/deploy/env/frontend.env.production" .env
npm ci 2>/dev/null || npm install
npm run build

echo "==> PM2..."
mkdir -p "$APP_ROOT/logs"
cd "$APP_ROOT"
pm2 delete testing-unotrips-api 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | bash || true

echo "==> Nginx (HTTP-only first — switch to SSL config after certbot)..."
sudo cp "$APP_ROOT/deploy/nginx/testing.unotrips.com.http-only.conf" \
  /etc/nginx/sites-available/testing.unotrips.com
sudo ln -sf /etc/nginx/sites-available/testing.unotrips.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "==> Health check (local)..."
sleep 2
curl -sf http://127.0.0.1:5000/api/health | head -c 500
echo ""
echo "Deploy complete. Point DNS testing.unotrips.com -> 69.62.76.249"
echo "Then: sudo certbot --nginx -d testing.unotrips.com"
echo "Then: sudo cp deploy/nginx/testing.unotrips.com.conf /etc/nginx/sites-available/testing.unotrips.com && sudo nginx -t && sudo systemctl reload nginx"
