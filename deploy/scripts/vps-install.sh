#!/usr/bin/env bash
# Run once on Ubuntu 24.04 VPS as a user with sudo.
# Usage: bash deploy/scripts/vps-install.sh
set -euo pipefail

APP_ROOT="/var/www/testing-unotrips-crm"

echo "==> Installing system packages..."
sudo apt update
sudo apt install -y curl git nginx ufw certbot python3-certbot-nginx

echo "==> Installing Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
node -v
npm -v

echo "==> Installing MongoDB 7..."
if ! command -v mongod &>/dev/null; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  UBUNTU_CODENAME="$(. /etc/os-release && echo "${VERSION_CODENAME:-jammy}")"
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo apt update
  sudo apt install -y mongodb-org
  sudo systemctl enable mongod
  sudo systemctl start mongod
fi

echo "==> Installing PM2..."
sudo npm install -g pm2

echo "==> Creating app directories..."
sudo mkdir -p "$APP_ROOT"/{frontend,backend,logs,certbot}
sudo mkdir -p /var/www/certbot
sudo chown -R "$USER:$USER" "$APP_ROOT"

echo "==> UFW firewall (22, 80, 443)..."
bash "$(dirname "$0")/ufw-setup.sh"

echo "==> Done. Upload your project to $APP_ROOT then run deploy/scripts/vps-deploy.sh"
