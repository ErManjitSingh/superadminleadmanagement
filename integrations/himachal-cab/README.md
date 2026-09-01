# Himachal Cab website → CRM leads

Connects [himachalcabservice.in/cab/](https://himachalcabservice.in/cab/) quote forms to [crm.exploremybharat.info](https://crm.exploremybharat.info/).

## Flow

1. Visitor fills **Get Your Quote** (name, phone, destination)
2. Form posts to `form.php` on the cab site
3. `form.php` calls `POST https://crm.exploremybharat.info/api/public/leads`
4. Lead appears in CRM under **Leads** with source **Himachal Cab Website**

## Setup (CRM server)

```bash
cd /var/www/leadmanagement/backend   # or your backend path
node src/scripts/enableWebsiteLeadIngest.js --domain=crm.exploremybharat.info
```

Copy the printed `X-Lead-Key`.

Optional `.env` (instead of / in addition to company DB key):

```env
WEBSITE_LEAD_API_KEY=<same-key>
WEBSITE_LEAD_COMPANY_SLUG=<company-slug>
WEBSITE_LEAD_SOURCE_LABEL=Himachal Cab Website
WEBSITE_LEAD_ALLOWED_ORIGINS=https://himachalcabservice.in,https://www.himachalcabservice.in
CORS_ORIGINS=...,https://himachalcabservice.in,https://www.himachalcabservice.in
```

Restart the API after env changes.

## Setup (cab website)

1. Open `form.php` and set `CRM_LEAD_API_KEY` to the key from the script
2. Upload `form.php` to `https://himachalcabservice.in/cab/form.php` (overwrite existing)
3. Submit a test quote — check CRM → Leads

## API (reference)

```http
POST /api/public/leads
Content-Type: application/json
X-Lead-Key: <key>

{
  "name": "Rahul",
  "phone": "9876543210",
  "destination": "Shimla Manali",
  "sourcePage": "https://himachalcabservice.in/cab/",
  "sourceLabel": "Himachal Cab Website"
}
```

Cab form field mapping: `no` → phone, `name` → name, `destination` → destination.
