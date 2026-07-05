# Hostinger VPS — indiaholidaydestination.com

| Item | Value |
|------|--------|
| VPS IP | `187.127.188.30` |
| Domain | `indiaholidaydestination.com` |
| App root | `/var/www/leadmanagement` |
| CRM frontend | `/var/www/indiaholidaydestination.com/public_html/app/` |
| Marketing site | `/var/www/indiaholidaydestination.com/public_html/` |
| Super Admin | `/var/www/admin.indiaholidaydestination.com/public_html/` |
| Backend | `/var/www/leadmanagement/backend` (port **5000**) |
| MongoDB | `mongodb://127.0.0.1:27017/indiaholidaydestination_crm` |
| GitHub repo | `https://github.com/ErManjitSingh/superadminleadmanagement.git` |

---

## Deploy updates

From your local machine:

```powershell
$env:VPS_PASSWORD='your-vps-password'
node deploy/deploy-ihd-vps.mjs
```

Or on the VPS directly:

```bash
bash /var/www/leadmanagement/deploy/scripts/ihd-vps-deploy.sh
```

---

## PM2

```bash
pm2 status
pm2 logs ihd-crm-api
pm2 restart ihd-crm-api
```

Config: `deploy/ecosystem.ihd.config.cjs`

---

## Nginx configs

- `deploy/nginx/indiaholidaydestination.com.conf`
- `deploy/nginx/indiaholidaydestination.com.http-only.conf`

---

## Routing summary

| URL | Target |
|-----|--------|
| `https://indiaholidaydestination.com` | Marketing site |
| `https://indiaholidaydestination.com/app/` | React CRM |
| `https://indiaholidaydestination.com/api/*` | `http://127.0.0.1:5000/api/*` |
| `https://admin.indiaholidaydestination.com` | Super Admin panel |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED` MongoDB | `sudo systemctl start mongod` |
| 502 on `/api` | `pm2 logs ihd-crm-api` |
| Blank frontend | Re-run `node deploy/deploy-ihd-vps.mjs` |
| CORS errors | Set `CORS_ORIGINS=https://indiaholidaydestination.com` in `backend/.env` |
