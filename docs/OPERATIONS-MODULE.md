# Operations Management Module — Architecture

## Workflow

```
Lead → Quotation → Payment → Booking Confirmed → Operations Team → Trip Execution
```

Sales converts and collects payment; Operations Manager receives the booking record and fulfills hotel, transport, activities, vouchers, and support until trip completion.

## System Layers

| Layer | Responsibility |
|-------|----------------|
| `operationsService` | Dashboard KPIs, booking CRUD, automation, reports |
| `operationsAutomationService` | Auto-create tasks & notifications on booking confirm |
| `operationsVoucherService` | Voucher numbering & PDF payload (URL storage) |
| `operationsController` | HTTP handlers, RBAC, pagination |
| Operations UI (`/operations-manager/*`) | Dashboard, Kanban, calendar, vouchers |

## Database Collections

### `bookings` (extended)
Core trip record after sales conversion.

| Field | Type | Notes |
|-------|------|-------|
| bookingNumber | String | Unique `BK-YYYY-####` |
| branchId | ObjectId | Branch scope |
| lead, quotation | ObjectId | Sales lineage |
| customerName, customerPhone, customerEmail | String | |
| destination | String | |
| travelDate, returnDate | Date | |
| adults, children | Number | Pax |
| status | Enum | See booking statuses |
| paymentStatus | Enum | pending, partial, paid, refund_pending, refund_completed |
| executiveName, salesManagerName | String | Denormalized for ops view |
| quotationReference | String | Quote number |
| hotels[] | Subdoc | Hotel assignments + workflow status |
| transport[] | Subdoc | Cab/vehicle assignments |
| activities[] | Subdoc | Activity bookings |
| itinerary[] | Subdoc | Day-wise plan (editable) |
| hotelConfirmation, cabConfirmation, voucherStatus | String | Aggregate pending flags |
| advanceReceived, pendingAmount | Number | Payment tracking |
| assignedTo | ObjectId | Operations owner |
| archivedAt | Date | Archive old trips |

**Booking statuses:** `booking_received`, `pending_verification`, `confirmed`, `in_progress`, `completed`, `cancelled`, `refund_pending`, `refund_completed`

### `hotels` (inventory DB)
Hotel master — not the same as booking hotel assignment.

Fields: name, destination, category, roomTypes[], contactPerson, phone, email, address, contractRates[], specialNotes, availability[]

### `vendors`
Types: `hotel`, `transport`, `activity`, `local_guide`, `other`  
Fields: commission, outstandingBalance, destination

### `vouchers`
Types: `hotel`, `transport`, `activity`, `master`  
Statuses: `draft`, `issued`, `sent`, `redeemed`  
`pdfUrl` stores generated PDF location (URL only)

### `trip_tasks`
Operations task queue — hotel confirm, cab confirm, voucher, payment verify.

### `trip_documents`
Uploaded document URLs — ID, hotel confirmation, tickets, insurance.

### `activities` / `cabs` / `flights`
Package inventory + ops assignment references.

### `customer_issues` (`supporttickets`)
Support center with category: hotel_issue, cab_delay, refund_request, activity_issue

## API Surface (`/api/operations-manager`)

| Area | Endpoints |
|------|-----------|
| Dashboard | `GET /dashboard` |
| Bookings | `GET/POST /bookings`, `GET/PUT /bookings/:id`, `GET /bookings/board` |
| Hotels | Full CRUD + search |
| Transport | List + assign on booking |
| Activities | CRUD |
| Vendors | CRUD |
| Vouchers | CRUD + `POST /vouchers/:id/pdf` |
| Tasks | `GET/POST /tasks`, `PATCH /tasks/:id` |
| Documents | `GET/POST /bookings/:id/documents` |
| Support | `GET/POST /tickets`, `PUT /tickets/:id` |
| Reports | `GET /reports` |
| Calendar | `GET /calendar` |

## RBAC

Module: `operations` with actions: `view`, `create`, `edit`, `delete`, `manage_hotels`, `manage_vendors`, `manage_transport`, `generate_voucher`, `manage_payments`, `view_reports`

Role `operations_manager` receives full operations permissions. `admin` has full access.

## Automation Triggers

On `status → confirmed`:
1. Create operations record if from payment webhook
2. Create TripTasks: hotel, cab, voucher, verification
3. Notify assigned operations staff

## Performance

- Pagination on all list endpoints (default 20, max 100)
- Compound indexes on `bookings.status`, `bookings.travelDate`, `bookings.branchId`
- Dashboard KPI cache (30s TTL)
- Archive trips where `completed` and `returnDate < now - 1 year`

## UI Routes

| Path | View |
|------|------|
| `/operations-manager/dashboard` | KPI command center |
| `/operations-manager/bookings/board` | Kanban booking board |
| `/operations-manager/bookings/:status` | Filtered list |
| `/operations-manager/booking/:id` | Full booking detail + itinerary |
