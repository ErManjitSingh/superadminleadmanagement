# Travel Lead Management CRM

A full-stack Travel Lead Management CRM built for local development. Manage travel leads, schedule follow-ups, and view dashboard analytics.

## Tech Stack

| Layer    | Technologies                                      |
|----------|---------------------------------------------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios   |
| Backend  | Node.js, Express.js, MongoDB, Mongoose, JWT      |

## Project Structure

```
travel-crm/
├── backend/          # Express API (port 5000)
├── frontend/         # React app (port 5173)
└── README.md
```

## Prerequisites

Before you start, install:

1. **Node.js** (v18 or higher) — [https://nodejs.org](https://nodejs.org)
2. **MongoDB** — local installation or MongoDB Atlas

### MongoDB Local Setup (Windows)

1. Download MongoDB Community Server from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install and start the MongoDB service
3. Default connection: `mongodb://127.0.0.1:27017/travel-crm`

Or use **MongoDB Atlas** (cloud) and paste your connection string into `backend/.env`.

---

## Installation & Setup

### Step 1: Configure Backend Environment

Copy or edit `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/travel-crm
JWT_SECRET=your_super_secret_jwt_key_change_in_production
PORT=5000
```

### Step 2: Install & Run Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

Backend runs at: **http://localhost:5000**

### Step 3: Install & Run Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Quick Start Commands

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Seed Data & Login Credentials

After running `npm run seed` in the backend folder:

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@travelcrm.com   | admin123  |
| Agent | agent@travelcrm.com   | agent123  |

Seed creates **6 sample leads** and **5 follow-ups**.

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| POST   | /auth/register     | Register user      |
| POST   | /auth/login        | Login user         |
| GET    | /auth/me           | Get current user   |

### Leads (Protected)
| Method | Endpoint     | Description   |
|--------|--------------|---------------|
| GET    | /leads       | List all leads|
| GET    | /leads/:id   | Get one lead  |
| POST   | /leads       | Create lead   |
| PUT    | /leads/:id   | Update lead   |
| DELETE | /leads/:id   | Delete lead   |

### Follow-ups (Protected)
| Method | Endpoint          | Description      |
|--------|-------------------|------------------|
| GET    | /followups        | List follow-ups  |
| GET    | /followups/:id    | Get one          |
| POST   | /followups        | Create           |
| PUT    | /followups/:id    | Update           |
| DELETE | /followups/:id    | Delete           |

### Dashboard (Protected)
| Method | Endpoint           | Description     |
|--------|--------------------|-----------------|
| GET    | /dashboard/stats   | Dashboard stats |

---

## Frontend Pages

- **Login / Register** — Authentication
- **Dashboard** — Stats, recent leads, upcoming follow-ups
- **Leads** — CRUD with search and status filter
- **Follow-ups** — Schedule, complete, delete follow-ups

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Ensure MongoDB is running. Check `MONGO_URI` in `.env` |
| CORS errors | Backend allows `http://localhost:5173` |
| 401 Unauthorized | Log in again; token may have expired |
| Port already in use | Change `PORT` in `.env` or stop the conflicting process |

---

## License

MIT
