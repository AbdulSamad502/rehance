# Feature verification against `rehance-feature-plan.md`

## Result

An automated checker walked the **production build** of the app and tested every section of the feature plan:

| | Count |
|---|---|
| Checks run | **124** |
| Passed | **124** |
| Individual assertions (labels, fields, tabs, statuses, buttons) | 696 |
| Of which functional business-rule checks | 15 |

By section of your document: Clinic (A to H) 45, Clinical (A to Q) 48, Patient (A to P) 27, cross-portal rules 4. Every check passed on the final run.

### How it works

`public/qa/feature-check.js` drives the real UI: it opens each screen, clicks into the tabs and sheets, and asserts that each item from your document is actually rendered (for example the 11 orthopaedic regions, the 12 outcome measures, the 8 appointment statuses, the 14 clinical and 11 administrative reports). It also runs 15 business-rule checks against the live store:

- double-booking is refused, bookings outside working hours or on a leave day are refused
- a walk-in can be booked and checked in
- attendance marking changes the appointment status
- extra charges raise total fees; payments and refunds generate receipt numbers
- staff can be added, edited and verified
- invite → patient accepts → physio is notified
- physio assigns an exercise → patient is notified
- patient check-in → physio alert → reply reaches the patient
- a motion result stays hidden from the patient until the physio approves it
- AI-assisted drafts remain drafts until approved and signed
- discharge closes the episode; the problem list persists

Re-run it any time, on the dev server or the deployed site, from the browser console:

```js
const { run } = await import(location.pathname.replace(/\/[^/]*$/, '/') + 'qa/feature-check.js')
await run()        // resets demo data first and last
```

## What this does and does not prove

- **Proves:** each feature from your document exists as a working screen or flow, is reachable, and the listed business rules behave.
- **Does not prove:** visual quality, or that a clinician finds the layout intuitive. That needs people.
- **Motion engine maths** is verified separately by 13 unit tests on a synthetic skeleton (`npm test`).
- **Real-camera behaviour** (live webcam capture of a real person, accuracy of MediaPipe landmarks) has **not** been verified, because the test browser blocks camera access. See `docs/MOTION-VALIDATION.md` for the procedure to do this on your laptop.

## Gaps found during this audit and fixed

| Gap in the earlier build | Fix |
|---|---|
| Working hours, slots and leave were display-only | Real working days/hours per therapist; bookings and patient self-booking only use free slots; leave blocks bookings and reassigns appointments |
| No consultation or session charges, no billing entries | Fee schedule on the Billing page; "Add charge" billing entries counted in total fees |
| Problem list was not saved | Saved per patient |
| No spinal movement in Motion Analysis | Added trunk (lumbar) flexion |
| Staff could not be edited or credential-verified | Edit profile and owner-only "Verify credentials" |
| No date of birth on registration | Added |
| Assessment charts lacked the patient-information header and signature | Header added; "Signed by" on assessments and session notes |
| Copilot lacked medical-history, treatment-history, comparison, timeline and motion-result summaries | Added "Record assistant" summaries; approve → sign → optionally share with patient |
| Motion analyses were not linked to assessments and sessions | "Linked records" panel on the review screen |
| Exercise assignments could not be edited; no start/review dates | Edit dosage sheet and date fields |
| Patient side lacked therapist-shared summaries, baseline table, treatment history, completion time | Added to Progress, Reports, Medical and the exercise log |

## Items that are intentionally simulated or partial

These exist as screens and flows but the service behind them is faked and labelled "Simulated" in the UI, or the scope is narrower than the plan implies:

- Clinic and patient **sign-in**, **Google sign-in**, **OTP**, **password recovery**, **credential verification**
- **SMS, push and reminders** (they appear as in-app notifications only)
- **Online payment** (test mode)
- The **documentation copilot** (template engine) and **recovery companion** (scripted)
- **Demonstration videos** are placeholders
- **Multi-clinic**: the location switcher changes the displayed location; data is not partitioned per location
- **Rehabilitation episode selection** in Motion Analysis shows the patient's current episode only (no multiple concurrent episodes)
- **Spinal movement** covers trunk/lumbar flexion only (no cervical)
- **Patient sign-up** is via clinic invite code (there is no open self-registration)
- **Assessment template editing** (Admin → Chart templates) toggles sections visually but does not rewrite the charts
