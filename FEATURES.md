# Feature coverage map

Maps every section of `rehance-feature-plan.md` to where it lives in the prototype.
The original plan had three interfaces; this prototype merges **Clinic + Clinical into one "Physio workspace"** (`/physio`) and keeps the **Patient app** (`/patient`).

**Status key**
- ✅ **Working**: interactive, state saved in the browser demo store and visible across portals
- 🟡 **Simulated**: the screen and flow work, but the underlying service is faked and labelled "Simulated" in the UI (SMS, OTP, Google sign-in, online payment, credential verification, video)
- 👁 **View**: shown with realistic data; limited or no editing

Real vs fake: the **AI Motion Analysis** pose tracking, joint angles, rep counting, symmetry and quality scoring run for real in the browser (MediaPipe). Everything else (patients, schedule, billing, outcomes) is seeded demo data.

---

## 1. Clinic (merged into Physio workspace)

| Plan item | Where | Status |
|---|---|---|
| A. Clinic login, registration | `/physio/welcome` (Sign in / Register clinic) | 🟡 |
| A. Staff accounts, roles, access activate/deactivate | Admin → Staff & roles | ✅ |
| A. Clinic profile, staff profile | Admin → Clinic settings, staff cards | ✅ |
| A. Password recovery | Sign-in screen, Admin → Reset password | 🟡 |
| A. Multi-clinic support | Clinic switcher in top bar (Pune / Thane) | 🟡 (switches the displayed location; data is not partitioned per location) |
| B. Dashboard KPIs (patients, appointments, attendance, absent, pending payments, collections, sessions, therapist availability, registrations, cancellations, alerts) | Today | ✅ |
| C. Patient registration (ID, demographics, contact, emergency, referral, therapist, location) | Patients → Register | ✅ |
| C. Admin profile (status, episode, remarks, referral) | Patient → Overview | ✅ |
| C. Access limited by role (no clinical data for front desk) | Role lens (top bar); Patient tabs lock | ✅ |
| D. Calendar, book, reschedule, cancel, assign, duration, type, conflicts | Schedule → Calendar (Day/Week) | ✅ |
| D. Walk-ins, waiting list | Book sheet (walk-in), Waiting list tab | ✅ |
| D. 8 statuses, 5 appointment types | Appointment sheet, Book sheet | ✅ |
| D. Manage time slots / availability | Schedule → Therapists (working days and hours), Book sheet "free slots", patient self-booking | ✅ (30-minute grid inside working hours; excludes leave and clashes) |
| E. Mark attendance/absence, remarks, session number, packages, remaining, regularity, history | Schedule → Attendance & packages | ✅ |
| F. Fee schedule (consultation / session charges), billing entries, packages, discounts, refunds, adjustments, payment methods, receipts, history, overdue, summary | Billing page (fee schedule), Patient → Billing (Add charge, Record payment) | ✅ |
| G. Register therapists, profiles, specialisation, hours, availability, workload, weekly schedule, leave, reassign, permissions | Admin → Staff, Schedule → Therapists, Today | ✅ (leave blocks bookings and reassigns appointments) |
| H. 11 administrative reports + export | Reports → Administrative (print/PDF, CSV) | ✅ |
| H. Announcements, staff notifications, reminders (appointment, payment), audit log, settings, backup/restore | Admin tabs, bell menu | ✅ (SMS/push 🟡) |

## 2. Clinical (merged into Physio workspace)

| Plan item | Where | Status |
|---|---|---|
| A. Login, professional registration, profile, clinic association | `/physio/welcome` → Professional account; Admin → Edit profile | 🟡 (no real authentication) |
| A. Credential verification, clinical signature | Admin → Verify credentials (owner); "Signed by" on assessments, session notes and approved drafts | ✅ (the credential check itself is simulated) |
| B. Clinical dashboard (today's patients, new assessments, pending notes, reassessment reminders, plan reviews, progress alerts, adherence alerts, feedback alerts, AI review queue, follow-ups, recent activity) | Today → "Needs your attention" | ✅ |
| C. Clinical patient profile, timeline, create/update records, drafts, finalise | Patient workspace (tabs) | ✅ |
| D. Medical history (diabetes, cardiac, stroke, hypertension, surgeries, injuries, neuro, MSK, medication, allergies, imaging, previous physio, red flags, contraindications) with source and date | Patient → Medical history | ✅ |
| D. Patient-submitted history updates reviewed by therapist | Patient → Medical history banner, Inbox | ✅ |
| E. General physiotherapy assessment chart | Patient → Assessment | ✅ |
| F. Clinical assessment chart | Patient → Assessment | ✅ |
| G. Orthopaedic chart: 11 regions, L/R, active/passive ROM, special tests, baseline vs follow-up | Patient → Assessment | ✅ |
| H. Neurological chart incl. stroke tracking | Patient → Assessment | ✅ |
| I. Problem list, 7 goal types, review/modify | Patient → Plan & goals | ✅ |
| J. **AI Motion Analysis**: setup, categories (posture, ROM incl. trunk/lumbar flexion, gait, functional), pose tracking, joint angles, ROM, reps, tempo, consistency, symmetry, quality + warnings, review, manual comparison, annotate, accept/reject/repeat, history, baseline compare, report | Motion Analysis | ✅ **real** (webcam, video upload) / 🟡 simulated-skeleton fallback |
| K. Treatment plan, 11 modes, session documentation | Patient → Plan & goals, Sessions | ✅ |
| L. Exercise library, assignment, dosage, start/review dates, edit, discontinue, adherence/pain/difficulty feedback | Exercise Library, Patient → Exercises | ✅ (videos 👁 placeholders) |
| M. Progress tracking and comparison, recovery intelligence | Patient → Progress | ✅ (rule-based summary) |
| N. Outcome measures: WOMAC, KOOS, LEFS, ODI, NDI, DASH, SPADI, Berg, TUG, 10MWT, 6MWT, MAS | Patient → Progress → Record score | ✅ |
| O. Copilot: SOAP, assessment, session, reassessment, progress, discharge drafts; record search; record assistant (medical history, treatment history, compare measurements, timeline, motion results); missing-documentation detector; draft → approve → sign → optionally share with patient | Patient → AI Copilot | 🟡 (template engine, no LLM) |
| P. Reassessment scheduling, record, compare; discharge checklist and close episode | Patient → Reassess & discharge | ✅ |
| Q. 14 clinical reports with review status and print | Reports → Clinical | ✅ |

## 3. Patient app

| Plan item | Where | Status |
|---|---|---|
| A. Sign-up (invite code), login, Google sign-in, OTP, clinic invitation, profile setup, consent, password recovery | `/patient` welcome flow | ✅ / 🟡 (Google, OTP) |
| B. Home dashboard (episode, therapist, next appointment, sessions, today's exercises, latest approved update, goals, check-in, notifications) | Home | ✅ |
| C. Profile, linked clinic/therapist, emergency contact, notification and privacy preferences, consent status | More → Profile, Notifications | ✅ |
| D. Upcoming/history, request, book slots, confirm, reschedule/cancel requests, therapist, location, type, online details | Visits | ✅ |
| E. Therapist-approved medical info; submit history, medication, allergies, symptoms, corrections | More → Medical information | ✅ |
| F. Treatment plan, goals, frequency, schedule, instructions, precautions, follow-ups | More → Treatment plan | ✅ |
| G. Assigned exercises, instructions, video, dosage, session player, difficulty and pain feedback, adherence, history | Exercises | ✅ (video 👁) |
| H. Camera-based exercise tracking with rep counting and form cues; approved feedback; no diagnosis | Exercises → exercise → camera | ✅ real / 🟡 demo skeleton |
| I. Sessions (completed, upcoming, approved summaries) | More → Sessions | ✅ |
| J. Progress charts in plain language, baseline vs latest table, therapist-shared summaries, goal progress, timeline, outcome scores | Progress | ✅ |
| K. Symptom check-in with urgent-symptom guidance; reaches the physio | More → Symptom check-in | ✅ |
| L. Fees, balance, history, receipts, package sessions, online payment | More → Payments | ✅ / 🟡 (payment) |
| M. Approved reports and documents, download | More → Reports | ✅ |
| N. Notifications and reminders (appointment, exercise, recovery) with preferences | Notifications | ✅ |
| O. Contact clinic, messages, announcements, recovery companion (scripted, never diagnoses) | More → Messages | ✅ / 🟡 (companion) |
| P. Feedback, report a problem, support, privacy, log out | More → Support, Profile | ✅ |

## 4. Shared features and access control

| Plan item | Where | Status |
|---|---|---|
| Cross-portal data (identity, appointments, attendance, history, plan, exercises, progress, feedback, payments, reports, notifications, communication) | One shared store; two browser tabs stay in sync | ✅ |
| Role-based access matrix (section 5) | Admin → Permissions; role lens in the top bar (Owner / Receptionist / Physiotherapist) | ✅ |
| Patients only see approved items | `visibleToPatient`, `shared` flags on motion results, notes, plan | ✅ |

## How this map was verified

See [docs/FEATURE-VERIFICATION.md](docs/FEATURE-VERIFICATION.md). In short: an automated checker (`public/qa/feature-check.js`) walks the running app and asserts that each feature from your document is on screen, plus functional checks of the business rules.

## Not in scope for a prototype

Real authentication, real SMS/push/email, real payments, server storage, multi-device sync, regulatory compliance. See [docs/PRODUCTION-GAPS.md](docs/PRODUCTION-GAPS.md).
