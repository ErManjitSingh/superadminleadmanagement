# Attendance System Requirements

> **Scope:** Office and Work From Home (WFH) only. Field Work, GPS tracking, and all field-work reporting are **out of scope** and must not appear in UI, API, database, or analytics.

---

## Work Modes

The system supports exactly two work modes:

| Label (UI)        | Stored value (`workMode`) |
|-------------------|---------------------------|
| Office            | `office`                  |
| Work From Home    | `wfh`                     |

No other work modes are permitted.

---

## Check-In Flow

```
User Login
    ↓
Dashboard
    ↓
Check In
    ↓
Select Work Mode (Office | Work From Home)
    ↓
Attendance record created
```

### Rules

- A user may **check in only once per calendar day** (per `userId` + `date`).
- Work mode is chosen at check-in and stored on the attendance record.
- If the user has already checked in today, the Check In action must be disabled or rejected with a clear message.

### Check-Out

- Users who have checked in and not yet checked out may check out manually.
- On check-out, set `checkOut`, compute `totalHours`, and clear “currently online” presence for that user.
- **Auto checkout:** End-of-day (or configured) job may set `checkOut`, `totalHours`, and `isAutoCheckout: true` for users still checked in.

---

## Data Model: `attendance`

MongoDB collection: `attendance`

| Field            | Type      | Description |
|------------------|-----------|-------------|
| `userId`         | ObjectId  | Reference to user |
| `date`           | Date      | Calendar date (normalized to start of day in org timezone) |
| `checkIn`        | Date      | Check-in timestamp |
| `checkOut`       | Date      | Check-out timestamp (null until checkout) |
| `totalHours`     | Number    | Hours between check-in and check-out |
| `workMode`       | String    | `office` \| `wfh` |
| `status`         | String    | e.g. `present`, `absent`, `late` (see Status) |
| `isAutoCheckout` | Boolean   | `true` if checkout was performed by system job |
| `createdAt`      | Date      | Record creation time |

### Indexes (recommended)

- Unique compound: `{ userId: 1, date: 1 }` — enforces one check-in per user per day.
- `{ date: 1, workMode: 1 }` — dashboard filters.
- `{ date: 1, status: 1 }` — present / absent / late counts.

### `workMode` values

- `office`
- `wfh`

---

## Status

| Status    | Meaning |
|-----------|---------|
| `present` | Checked in (on time per org policy) |
| `late`    | Checked in after configured late threshold |
| `absent`  | No check-in for the day (by cutoff / end of day) |

Late threshold and absent cutoff are configurable (e.g. office start time + grace minutes).

---

## Role Dashboards

### Admin Dashboard

Display for **today** (org timezone):

- Present Today
- Absent Today
- Late Today
- Office Users (count or list checked in with `workMode: office`)
- WFH Users (count or list checked in with `workMode: wfh`)
- Currently Online Users (checked in, not checked out)

### Team Leader Dashboard

Scoped to **direct team members**:

- Team Attendance (today / selectable date)
- Team Office Users
- Team WFH Users

### Sales Manager Dashboard

Scoped to **all teams under the sales manager** (or org-wide sales scope per existing team hierarchy):

- All Team Attendance
- Office Users
- WFH Users
- Late Users

---

## User Roles & Actions

| Role              | Check in/out | View own attendance | Team / org attendance views |
|-------------------|--------------|---------------------|-----------------------------|
| Sales Executive   | Yes          | Yes                 | No                          |
| Team Leader       | Yes          | Yes                 | Team only                   |
| Sales Manager     | Yes          | Yes                 | All managed teams           |
| Admin             | Yes          | Yes                 | Organization-wide           |

Other roles (e.g. accountant, operations_manager) follow product decision: either no attendance module or check-in only if they are in scope for HR tracking.

---

## Explicitly Removed (Do Not Implement)

The following must **not** exist anywhere in the product:

- Field Work work mode
- Field Work reports
- Field Work filters on lists or dashboards
- Field Work statistics or KPIs
- GPS / geolocation capture on check-in or check-out
- Location history, maps, or geo-fencing for attendance
- Any API field such as `fieldWork`, `location`, `latitude`, `longitude` on attendance

---

## API Surface (Implementation Guide)

Suggested REST endpoints (prefix `/api/attendance`):

| Method | Path              | Description |
|--------|-------------------|-------------|
| POST   | `/check-in`       | Body: `{ workMode: 'office' \| 'wfh' }` — one per user per day |
| POST   | `/check-out`      | Current user’s open attendance for today |
| GET    | `/me`             | Current user’s attendance history |
| GET    | `/today`          | Role-scoped today summary (dashboard metrics) |
| GET    | `/team`           | Team Leader — team records for date |
| GET    | `/organization`   | Admin / Sales Manager — scoped records for date |

All endpoints require authentication. Enforce RBAC on list/summary routes.

---

## Real-Time: Currently Online

“Currently Online Users” = users with an attendance row for **today** where `checkIn` is set and `checkOut` is null.

Optional: integrate with existing Socket.IO presence if the app already tracks connection state; attendance check-in/out remains the source of truth for work mode (office vs WFH).

---

## Non-Functional Notes

- Dates and “today” use a single configured organization timezone.
- Idempotent check-in: duplicate requests for the same `userId` + `date` return `409` or existing record, not a second row.
- Audit: `createdAt` on attendance; optional activity log entry on check-in/check-out for admin visibility.

---

## Revision History

| Date       | Change |
|------------|--------|
| 2026-06-02 | Initial requirements: Office + WFH only; Field Work and GPS removed from scope |
