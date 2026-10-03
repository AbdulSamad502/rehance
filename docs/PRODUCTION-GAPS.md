# Prototype vs production

The prototype is deliberately a front-end demo. This lists what it does **not** do, so nobody mistakes it for a product.

## How the "backend" works today

All data lives in `src/store/index.ts` (a Zustand store persisted to the browser's `localStorage`). Components call store actions such as `bookAppointment`, `addPayment` or `reviewMotion`. In production those become API calls; the screens would not need to change much, but the store would become a client cache of server data.

Consequences of this design:

- **Data is per browser.** A physio on a laptop and a patient on a phone do **not** share data. Two tabs in the *same* browser do, via the `storage` event. For a two-device demo, show the patient app inside the phone frame on the laptop, or use two tabs.
- **~5 MB limit.** Motion results store a downsampled signal (about 10 samples per second), not video. Skeleton replay frames are kept in memory only and vanish on reload.
- **No schema migrations.** When seed data changes the storage key is bumped and old demo data is discarded.
- **Daily refresh.** Sample dates are regenerated once per day.

## What a real product still needs

| Area | Needed |
|---|---|
| Identity | Real authentication, MFA, session management, clinic and patient account lifecycle, password recovery |
| Data | Server database, encryption at rest and in transit, backups, per-clinic tenancy, audit trails that cannot be edited |
| Privacy and compliance | Consent records, data-subject rights, retention, applicable health-data law (for example India's DPDP Act), clinical-governance review |
| Clinical safety | Validation of every measurement against reference methods, defined intended use, risk assessment, possible medical-device classification |
| Messaging | Real SMS, push, email and WhatsApp integrations with delivery tracking |
| Payments | A payment gateway, reconciliation, GST invoices |
| Video | Real exercise videos and content moderation |
| Mobile | A Play Store build (for example a Capacitor wrapper of the patient app or a native rewrite), push notifications, camera permission flows on Android |
| AI | If an LLM is ever used for drafting: data-processing agreements, no-training guarantees, human review, logging |
| Operations | Monitoring, error reporting, CI, staging, support tooling |

## Clearly labelled simulations in the prototype

SMS and OTP, Google sign-in, online payment, credential verification, push notifications, calling the clinic, the documentation copilot (template engine), the recovery companion (scripted), staff leave, template editing, and the simulated skeleton. Each carries a visible "Simulated" or "Demo" label where it appears.
