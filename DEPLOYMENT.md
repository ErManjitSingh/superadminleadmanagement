# Uno Travel CRM — Production Deployment

**Frontend:** https://testing.unotrips.com  
**API:** https://testing.unotrips.com/api  

## Stack

- React (Vite) + Tailwind + Axios
- Node.js + Express + MongoDB + JWT
- PM2 + Nginx

## 1. MongoDB

Create database and user on your server:

```bash
mongosh
use unotravel_crm
```

Set `MONGO_URI` in `backend/.env` (local MongoDB on the VPS):

```
MONGO_URI=mongodb://127.0.0.1:27017/testing_unotrips_crm
```

## 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: MONGO_URI, JWT_SECRET, CORS_ORIGINS

npm install
npm run seed    # initial users + sample data
npm start       # or: pm2 start ecosystem.config.cjs
```

Health check: `GET https://testing.unotrips.com/api/health`

### Seed logins (default password `123456`)

| Email | Role |
|-------|------|
| admin@crm.com | Admin |
| manager@crm.com | Sales Manager |
| leader@crm.com | Team Leader |
| executive@crm.com | Sales Executive |
| operations@crm.com | Operations Manager |
| accountant@crm.com | Accountant |

## 3. Frontend

```bash
cd frontend
cp .env.production .env
npm install
npm run build
```

Serve `frontend/dist` as static files from Nginx (see below).

## 4. PM2

From project root:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 5. Nginx

See `deploy/nginx-unotrips.conf`. Key points:

- `/` → static `frontend/dist`
- `/api` → proxy to `http://127.0.0.1:5000/api`
- SSL via Certbot for `testing.unotrips.com`

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Environment summary

| Variable | Location | Example |
|----------|----------|---------|
| `VITE_API_URL` | frontend `.env` | `https://testing.unotrips.com/api` |
| `MONGO_URI` | backend `.env` | `mongodb://127.0.0.1:27017/testing_unotrips_crm` |
| `JWT_SECRET` | backend `.env` | long random string |
| `PORT` | backend `.env` | `5000` |
| `CORS_ORIGINS` | backend `.env` | `https://testing.unotrips.com` |

## 7. No mock data

Mock API and `mockData.js` are removed. The frontend always calls the real API. Ensure the backend is running before using the app.
