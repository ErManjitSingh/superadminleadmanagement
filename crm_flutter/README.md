# LeadMang CRM — Flutter

Flutter port of `crm-mobile` (Expo) for Android & iOS.

## Features

- Login (multi-tenant subdomain + custom API URL)
- Dashboard KPIs + recent leads
- Leads list/search/filters + detail (call, WhatsApp, status, notes)
- Follow-ups (today / upcoming / overdue / done)
- Quotations list + create via CRM WebView
- Notifications
- Full CRM WebView (same as Capacitor `mobile` wrapper)

## Default server

- API: `https://indiaholidaydestination.com/api`
- Web: `https://indiaholidaydestination.com/app`

Change on login via **Show server settings**.

For Explore My Bharat Capacitor app equivalent, set:

- API: `https://crm.exploremybharat.info/api` (or your EMB API)
- Or open **Profile → Open full CRM (Web)** with  
  `https://crm.exploremybharat.info/app`

## Run

```bash
export PATH="$HOME/flutter/bin:$PATH"
cd crm_flutter
flutter pub get
flutter run
```

## Build APK

```bash
flutter build apk --release
```

APK: `crm_flutter/build/app/outputs/flutter-apk/app-release.apk`
