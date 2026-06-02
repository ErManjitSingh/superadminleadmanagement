# Hostinger VPS — Production Deploy Guide

| Item | Value |
|------|--------|
| VPS IP | `69.62.76.249` |
| Hostname | `srv1710539.hstgr.cloud` |
| OS | Ubuntu 24.04 LTS |
| Domain | `testing.unotrips.com` |
| App root | `/var/www/testing-unotrips-crm` |
| Frontend | `/var/www/testing-unotrips-crm/frontend/dist` |
| Backend | `/var/www/testing-unotrips-crm/backend` (port **5000**) |
| MongoDB | `mongodb://127.0.0.1:27017/testing_unotrips_crm` |

---

## 1. DNS (Hostinger / domain panel)

Create an **A record**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `testing` | `69.62.76.249` | 300 |

Result: `testing.unotrips.com` → your VPS.

---

## 2. Upload project to VPS

From your **local machine** (replace `user` with your SSH user, e.g. `root` or `ubuntu`):

```bash
# Option A: rsync (recommended)
rsync -avz --exclude node_modules --exclude frontend/dist \
  ./ user@69.62.76.249:/var/www/testing-unotrips-crm/

# Option B: git clone on VPS
ssh user@69.62.76.249
sudo mkdir -p /var/www/testing-unotrips-crm
sudo chown -R $USER:$USER /var/www/testing-unotrips-crm
cd /var/www/testing-unotrips-crm
git clone <your-repo-url> .
```

Expected layout on VPS:

```
/var/www/testing-unotrips-crm/
├── backend/
│   ├── src/server.js
│   ├── .env                 ← create from deploy/env/backend.env.production
│   └── package.json
├── frontend/
│   ├── .env                 ← create from deploy/env/frontend.env.production
│   └── dist/                ← created by npm run build
├── deploy/
│   ├── ecosystem.config.cjs
│   ├── nginx/
│   └── scripts/
└── logs/
```

---

## 3. One-time VPS setup (SSH into server)

```bash
ssh user@69.62.76.249
cd /var/www/testing-unotrips-crm
chmod +x deploy/scripts/*.sh
bash deploy/scripts/vps-install.sh
```

This installs: **Node 20**, **MongoDB 7**, **Nginx**, **PM2**, **Certbot**, and configures **UFW** (ports **22**, **80**, **443**).

---

## 4. Backend `.env` (exact file)

```bash
cp deploy/env/backend.env.production backend/.env
nano backend/.env
```

**`backend/.env`** must contain:

```env
PORT=5000
NODE_ENV=production

MONGO_URI=mongodb://127.0.0.1:27017/testing_unotrips_crm

JWT_SECRET=your-long-random-secret-at-least-32-characters
JWT_EXPIRES_IN=30d

CORS_ORIGINS=https://testing.unotrips.com

SEED_PASSWORD=123456
```

Generate a secret:

```bash
openssl rand -base64 48
```

---

## 5. Deploy app (build + PM2 + Nginx)

```bash
cd /var/www/testing-unotrips-crm
bash deploy/scripts/vps-deploy.sh
```

Or manually:

```bash
# Backend
cd /var/www/testing-unotrips-crm/backend
npm install --omit=dev
npm run seed          # first time only
pm2 start /var/www/testing-unotrips-crm/deploy/ecosystem.config.cjs
pm2 save
pm2 startup           # run the command it prints

# Frontend
cd /var/www/testing-unotrips-crm/frontend
cp ../deploy/env/frontend.env.production .env
npm install
npm run build

# Nginx (HTTP first)
sudo cp deploy/nginx/testing.unotrips.com.http-only.conf \
  /etc/nginx/sites-available/testing.unotrips.com
sudo ln -sf /etc/nginx/sites-available/testing.unotrips.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Verify before SSL

```bash
# API direct (on VPS)
curl http://127.0.0.1:5000/api/health

# API via Nginx (after DNS propagates)
curl http://testing.unotrips.com/api/health

# PM2
pm2 status
pm2 logs testing-unotrips-api
```

Expected health response:

```json
{
  "status": "ok",
  "service": "unotravel-crm-api",
  "database": { "connected": true, "state": "connected", "name": "testing_unotrips_crm" },
  "time": "..."
}
```

---

## 7. SSL (Let's Encrypt)

After DNS resolves to `69.62.76.249`:

```bash
sudo certbot --nginx -d testing.unotrips.com
```

Then enable the full HTTPS config:

```bash
sudo cp /var/www/testing-unotrips-crm/deploy/nginx/testing.unotrips.com.conf \
  /etc/nginx/sites-available/testing.unotrips.com
sudo nginx -t && sudo systemctl reload nginx
```

Renewal is automatic via certbot timer.

---

## 8. UFW firewall (manual, if needed)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

**Do not** open port 5000 publicly — Nginx proxies `/api` internally.

---

## 9. PM2 commands

```bash
pm2 status
pm2 logs testing-unotrips-api
pm2 restart testing-unotrips-api
pm2 stop testing-unotrips-api
```

Config file: `deploy/ecosystem.config.cjs`

---

## 10. Seed logins (after `npm run seed`)

Password default: `123456` (or `SEED_PASSWORD` in `.env`)

| Email | Role |
|-------|------|
| admin@crm.com | Admin only |

All other users — create in **Team Management → Add User**.

To reset users on server (keep only admin):

```bash
cd /var/www/testing-unotrips-crm/backend
npm run keep-admin-only
```

---

## 11. Routing summary

| URL | Target |
|-----|--------|
| `https://unotrips.com` | Static site → `/var/www/unotrips.com/public_html` |
| `https://unotrips.com/meta/*` | Meta landers → `/var/www/unotrips-meta/` |
| `https://testing.unotrips.com` | React CRM → `testing-unotrips-crm/frontend/dist` |
| `https://testing.unotrips.com/api/*` | `http://127.0.0.1:5000/api/*` |
| `https://testing.unotrips.com/socket.io/*` | WebSocket → `http://127.0.0.1:5000` (real-time notifications) |
| `https://testing.unotrips.com/api/health` | Backend health check |

---

## 12. Updates (redeploy)

```bash
cd /var/www/testing-unotrips-crm
git pull   # or rsync again

cd backend && npm install --omit=dev
cd ../frontend && npm install && npm run build

pm2 restart testing-unotrips-api
sudo systemctl reload nginx
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED` MongoDB | `sudo systemctl start mongod` |
| 502 on `/api` | `pm2 logs testing-unotrips-api` |
| Blank frontend | Rebuild: `cd frontend && npm run build` |
| CORS errors | `CORS_ORIGINS=https://testing.unotrips.com` in `backend/.env` |
| JWT errors | Set `JWT_SECRET` in `backend/.env`, re-seed or re-login |
