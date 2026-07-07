#!/usr/bin/env bash
# Provision nginx vhost + Let's Encrypt SSL for a tenant custom domain.
# Usage: bash add-custom-domain.sh crm.exploremybharat.info
set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 <custom-domain>"
  exit 1
fi

APP_ROOT="/var/www/leadmanagement"
TEMPLATE="$APP_ROOT/deploy/nginx/custom-domain.template.conf"
VHOST_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
VHOST_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"
SSL_EMAIL="${SSL_ADMIN_EMAIL:-admin@indiaholidaydestination.com}"

echo "==> Verify DNS resolves to this server..."
SERVER_IP="$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')"
RESOLVED="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -n1 || true)"
echo "    server_ip=$SERVER_IP  resolved=$RESOLVED"
if [ -z "$RESOLVED" ]; then
  echo "!! WARNING: $DOMAIN does not resolve yet. certbot will likely fail."
fi

echo "==> Write HTTP vhost for $DOMAIN..."
mkdir -p /var/www/certbot
sed "s/__DOMAIN__/${DOMAIN}/g" "$TEMPLATE" > "$VHOST_AVAILABLE"
ln -sf "$VHOST_AVAILABLE" "$VHOST_ENABLED"

nginx -t
systemctl reload nginx

echo "==> Request Let's Encrypt certificate (certbot --nginx)..."
if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect; then
  echo "CERTBOT_OK"
else
  echo "!! certbot failed — vhost stays HTTP-only. Re-run after DNS propagates."
fi

nginx -t && systemctl reload nginx

echo "==> Health check via Host header..."
curl -sk -H "Host: ${DOMAIN}" http://127.0.0.1/api/health || true
echo ""
echo "DONE: ${DOMAIN}"
