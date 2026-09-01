# LeadMang CRM Mobile

React Native + Expo + TypeScript mobile app for the LeadMang CRM platform.

## Features

- Login with email/password (multi-tenant subdomain support)
- Dashboard with KPIs, today's tasks, recent leads
- Leads list with search and filters
- Lead detail: call, WhatsApp, status update, notes
- Follow-ups: today, upcoming, overdue, completed
- **Offline mode** — cached leads/dashboard when no internet
- **Push notifications** — Expo push token registered on login
- **Notifications inbox** — read/mark all from backend
- Profile and sign out

## Supported roles

Sales Executive, Sales Manager, Team Leader, Admin

## Setup

```bash
cd crm-mobile
npm install
copy .env.example .env
```

Set backend URL in `.env`:

```
EXPO_PUBLIC_API_URL=https://your-company-domain.com/api
```

## Run (development)

```bash
npm start
```

Press `a` for Android or scan QR with Expo Go.

## Offline mode

Dashboard, leads, follow-ups, and notifications are cached locally for 24 hours. When offline, a yellow banner appears and the app shows the last synced data. Mutations (status update, notes) require internet.

## Push notifications

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Link project: `eas init` (updates `app.json` with real `projectId`)
4. Build a development/preview APK (push does not work in Expo Go)

Push tokens are saved to the backend via `POST /api/auth/push-token`.

## Build APK (EAS)

```bash
npm install -g eas-cli
eas login
eas init
npm run build:apk
```

Or directly:

```bash
npm run build:preview
```

Download the APK from the Expo dashboard when the cloud build finishes.

Edit `eas.json` → `preview.env.EXPO_PUBLIC_API_URL` before building for production.

## Server settings in app

On login, tap **Show server settings** for company subdomain and custom API URL.

## Backend

Connects to existing LeadMang API:

- `POST /api/auth/login`
- `POST /api/auth/push-token`
- Role routes: `/api/sales-executive/*`, etc.
- `GET /api/notifications`
