# Travel CRM — Production Deployment (indiaholidaydestination.com)

**CRM:** https://indiaholidaydestination.com/app  
**API:** https://indiaholidaydestination.com/api  
**Super Admin:** https://admin.indiaholidaydestination.com  

## Stack

- React (Vite) + Tailwind + Axios
- Node.js + Express + MongoDB + JWT
- PM2 + Nginx

## Deploy (from your machine)

```powershell
$env:VPS_PASSWORD='your-vps-password'
node deploy/deploy-ihd-vps.mjs
```

This pulls `main` from `superadminleadmanagement`, builds frontend + marketing + superadmin, and restarts PM2 on the IHD VPS.

## VPS layout

| Item | Value |
|------|--------|
| VPS IP | `187.127.188.30` |
| App root | `/var/www/leadmanagement` |
| CRM static | `/var/www/indiaholidaydestination.com/public_html/app/` |
| Marketing | `/var/www/indiaholidaydestination.com/public_html/` |
| Backend | `/var/www/leadmanagement/backend` (port **5000**) |
| MongoDB | `mongodb://127.0.0.1:27017/indiaholidaydestination_crm` |

## Health check

`GET https://indiaholidaydestination.com/api/health`

## Environment summary

| Variable | Location | Example |
|----------|----------|---------|
| `VITE_API_URL` | frontend `.env` | `/api` |
| `MONGO_URI` | backend `.env` | `mongodb://127.0.0.1:27017/indiaholidaydestination_crm` |
| `JWT_SECRET` | backend `.env` | long random string |
| `CORS_ORIGINS` | backend `.env` | `https://indiaholidaydestination.com` |
| `PLATFORM_DOMAIN` | backend `.env` | `indiaholidaydestination.com` |

See `deploy/env/backend.env.production` for a production template.
