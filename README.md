# GearPhys prototype

An interactive, clickable prototype of **GearPhys: Recovery & Motion**, a physiotherapy platform with two portals:

- **Physio workspace** (`#/physio`): front-desk operations and clinical care in one place, led by **AI Motion Analysis** (live webcam pose tracking).
- **Patient app** (`#/patient`): mobile-first, with appointments, camera-guided home exercises and plain-language progress.

It is a **front-end only demo**. No server, no database, no language model. Patients, staff, appointments, billing and results are fictional, seeded into the browser's `localStorage`. The one real piece of AI is the pose tracking, which runs on-device with MediaPipe and never uploads video.

> Prototype for feedback. Estimates from 2D camera input are not a diagnosis, and this is not a medical device.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the motion engine
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build locally
```

Camera access needs **HTTPS or localhost**. GitHub Pages is HTTPS, so it works when deployed.

## Deploy to GitHub Pages

1. Create a GitHub repo and push this folder as its root (the `app` folder contains `.github/workflows/deploy.yml`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The workflow runs the tests, builds with `VITE_BASE=/<repo-name>/`, and publishes.
4. Share `https://<your-user>.github.io/<repo-name>/`.

The app uses hash routing (`#/physio`), so deep links work on Pages without server rules. Pose-model and WASM files are bundled in `public/`, so there is no runtime dependency on a CDN. The first motion-analysis visit downloads up to roughly 25 MB of model and runtime files (only when you open a camera or video capture), then the browser caches them. There is no service worker, so the first visit needs a network connection.

## What you see when you open the link

The first screen offers two choices: **Doctor / Physiotherapist** (opens the clinic workspace dashboard) and **Patient** (opens the patient app as the demo patient, Abdul). There is no login gate. Smaller links under the choices cover clinic sign-in/registration and "join with an invite code".

The patient app is built for phones: full screen with a bottom tab bar. On tablets and desktops it switches to a side navigation rail with a centred content column. There is no device frame.

## Presenting it

- **Guided tour**: the landing page's "Take the guided tour" walks the recovery loop in 10 steps (clinic day, registration and invite, patient joins with code `GP-4821` and OTP `1234`, camera exercise, physio review, approval, patient sees approved feedback).
- **Role lens**: the top bar switches between Owner, Receptionist and Physiotherapist to show role-based access.
- **No camera?** In New motion analysis choose **Upload video** or **Simulated demo**. Simulated results are always labelled.
- **Reset**: Admin → Data & backup → Reset demo data (or the footer of the landing page). Data also refreshes itself once a day so "today" looks current.
- **Two screens**: open `#/physio` in one tab and `#/patient` in another. They share data and update each other.

## Structure

```
src/
  features/motion/engine/   pose tracking, smoothing, angles, rep counter, analysis session, simulator
  features/motion/ui/       camera/video/simulation stage with skeleton overlay
  features/physio/          dashboard, patients (11 tabs), schedule, billing, reports, admin, motion UI
  features/patient/         onboarding, home, exercises (camera), visits, progress, more
  features/demo/            landing page and guided tour
  data/                     seed data, exercise library, assessment templates, outcome measures
  store/                    the simulated backend (Zustand + localStorage)
  lib/                      derived data, rule-based copilot and companion, access rules
```

**Feature check**: `public/qa/feature-check.js` walks the running app and tests every feature from the feature plan (124 checks). See [docs/FEATURE-VERIFICATION.md](docs/FEATURE-VERIFICATION.md) for the result and how to re-run it.

See [FEATURES.md](FEATURES.md) for a section-by-section coverage map, [docs/MOTION-VALIDATION.md](docs/MOTION-VALIDATION.md) for how to check motion accuracy on your own laptop, [docs/PRODUCTION-GAPS.md](docs/PRODUCTION-GAPS.md) for what a real product still needs, and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for licences.

## Browser support

Tested in Chromium (the in-app preview). **Not yet verified on** real webcams, Firefox, Safari or iOS. The pose model tries the GPU first and falls back to CPU. On a modern laptop expect roughly 25 to 30 fps; the capture screen shows live `delegate · fps · ms` so you can see what your device does.
