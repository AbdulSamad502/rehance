/*
 * GearPhys feature-coverage checker.
 * Walks the running app and tests that each feature from rehance-feature-plan.md is present and working.
 *
 * Run it from the browser console on the app (dev server or deployed site):
 *   const { run } = await import(location.pathname.replace(/\/[^/]*$/, '/') + 'qa/feature-check.js'); await run()
 * It resets the demo data first and again at the end.
 */
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const store = () => window.__gearphys.store
const body = () => ((document.body.textContent || '') + ' ' + [...document.querySelectorAll('[placeholder]')].map((e) => e.getAttribute('placeholder')).join(' ')).toLowerCase().replace(/\s+/g, ' ')

async function go(route) {
  // leave the current page first so React remounts it (otherwise tab state from the previous check leaks in)
  location.hash = '#/__reset'
  await wait(150)
  location.hash = '#' + route
  await wait(650)
  for (let i = 0; i < 20 && document.querySelector('.animate-spin'); i++) await wait(200) // lazy chunk still loading
  await wait(100)
}
function clickText(t) {
  const want = t.toLowerCase()
  const els = [...document.querySelectorAll('button, a, [role=button], [role=tab], label')]
  const el = els.find((x) => x.textContent.trim().toLowerCase().startsWith(want)) || els.find((x) => x.textContent.trim().toLowerCase().includes(want))
  if (!el) return false
  el.click()
  return true
}
function setSelect(label, value) {
  const sel = document.querySelector(`select[aria-label="${label}"]`)
  if (!sel) return false
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, value)
  sel.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}
const setRole = (r) => setSelect('View as role', r)

const checks = []
/** C(section, feature, route, needles, opts) */
const C = (s, f, route, needles, opts = {}) => checks.push({ s, f, route, needles: [].concat(needles), ...opts })

/* ---------------- 1. CLINIC (merged into the Physio workspace) ---------------- */
C('Clinic A', 'Clinic login', '/physio/welcome', ['sign in', 'password', 'forgot password'])
C('Clinic A', 'Clinic registration', '/physio/welcome', ['clinic name', 'owner name', 'register clinic'], { steps: ['Register clinic'] })
C('Clinic A', 'Staff accounts + roles', '/physio/admin', ['add staff', 'receptionist', 'senior physiotherapist', 'clinic admin', 'orthopaedic doctor'], { role: 'owner' })
C('Clinic A', 'Clinic profile (name, address, hours)', '/physio/admin', ['clinic name', 'address', 'operating hours', 'locations'], { role: 'owner', steps: ['Clinic settings'] })
C('Clinic A', 'Staff profile edit', '/physio/admin', ['edit profile', 'full name', 'phone', 'clinical signature shown on finalised records'], { role: 'owner', steps: ['Edit profile'] })
C('Clinic A', 'Password recovery', '/physio/admin', ['reset password'], { role: 'owner' })
C('Clinic A', 'Activate/deactivate access', '/physio/admin', ['access active'], { role: 'owner' })
C('Clinic A', 'Multi-clinic support', '/physio', ['gearphys thane', 'gearphys pune (main)'])

C('Clinic B', 'Dashboard KPIs', '/physio', ['active patients', 'registered', "today's appointments", 'attended', 'upcoming', 'collected today', 'pending payments', 'no-shows today', 'cancelled / moved', 'new registrations', 'sessions delivered'])
C('Clinic B', 'Therapist availability + schedule + alerts', '/physio', ["today's schedule", 'therapist availability today', 'needs your attention', 'outstanding balance', 'recent activity'])

C('Clinic C', 'Patient registration form', '/physio/patients?new=1', ['full name', 'date of birth', 'age', 'sex', 'mobile', 'email', 'address', 'emergency contact', 'referring doctor', 'treating physiotherapist', 'clinic location', 'treatment package', 'send the gearphys app invite'])
C('Clinic C', 'Unique patient ID', '/physio/patients/p1', ['gp-1001', 'patient id'])
C('Clinic C', 'Admin profile (status, episode, remarks, referral)', '/physio/patients/p1', ['referral', 'registered', 'treating therapist', 'rehabilitation episode', 'admin remarks', 'active'])

C('Clinic D', 'Calendar day/week + therapist filter', '/physio/schedule', ['day', 'week', 'all therapists', 'book'])
C('Clinic D', 'Booking: type, duration, mode, walk-in, free slots', '/physio/schedule', ['appointment type', 'duration (min)', 'mode', 'walk-in', 'free slots that day', 'initial consultation', 'follow-up session', 'reassessment', 'rehabilitation session', 'discharge appointment'], { steps: ['Book'] })
C('Clinic D', 'Appointment actions + 8 statuses', '/physio/schedule', ['scheduled', 'confirmed', 'checked in', 'in progress', 'completed', 'cancelled', 'rescheduled', 'no-show', 'reschedule', 'cancel appointment', 'assigned therapist'], { steps: ['Rehabilitation session'] })
C('Clinic D', 'Waiting list', '/physio/schedule', ['add to waiting list', 'offer slot', 'kabir singh'], { steps: ['Waiting list'] })
C('Clinic D', 'Appointment history per patient', '/physio/patients/p1', ['appointments', 'no-show', 'completed'])

C('Clinic E', 'Attendance + packages + regularity', '/physio/schedule', ['present', 'absent', 'session packages and attendance regularity', 'regularity', 'attended', 'left', 'session '], { steps: ['Attendance & packages'] })
C('Clinic E', 'Absence remarks', '/physio/schedule', ['absence remark'], { steps: ['Rehabilitation session'] })

C('Clinic F', 'Fee schedule (consultation / session charges)', '/physio/billing', ['fee schedule', 'consultation charge', 'per-session charge'], { role: 'owner' })
C('Clinic F', 'Billing overview, balances, overdue', '/physio/billing', ['collected today', 'last 30 days', 'outstanding balances', 'collections by method', 'recent payments', 'overdue'], { role: 'owner' })
C('Clinic F', 'Patient payment summary', '/physio/patients/p1?tab=billing', ['total fees', 'fees paid', 'outstanding', 'last payment', 'treatment package', 'sessions remaining', 'discount', 'payment history'], { role: 'owner' })
C('Clinic F', 'Record payment: methods, refund, adjustment', '/physio/patients/p1?tab=billing', ['payment', 'refund', 'adjustment', 'pay full balance', 'cash', 'upi', 'card', 'bank transfer', 'other'], { role: 'owner', steps: ['Record payment'] })
C('Clinic F', 'Billing entries (add charge)', '/physio/patients/p1?tab=billing', ['extra session', 'consultation', 'add to bill'], { role: 'owner', steps: ['Add charge'] })
C('Clinic F', 'Receipts', '/physio/patients/p1?tab=billing', ['receipt no.', 'print / save pdf'], { role: 'owner', steps: ['Payment'] })

C('Clinic G', 'Therapist working hours + leave', '/physio/schedule', ['working hours', 'mark unavailable', 'dr. ananya rao', 'dr. karan mehta'], { steps: ['Therapists'] })
C('Clinic G', 'Weekly schedule view', '/physio/schedule', ['mon', 'tue', 'wed'], { steps: ['Week'] })
C('Clinic G', 'Daily workload per therapist', '/physio', ['booked'])

C('Clinic H', '11 administrative reports', '/physio/reports', ['daily appointment report', 'weekly appointment report', 'monthly appointment report', 'attendance report', 'patient registration report', 'outstanding payment report', 'revenue and collections report', 'therapist workload report', 'session package report', 'cancellation and no-show report', 'clinic utilization report'])
C('Clinic H', 'Report export (print / CSV)', '/physio/reports', ['print / pdf', 'csv'], { steps: ['Daily appointment report'] })
C('Clinic H', 'Announcements + notifications', '/physio/admin', ['publish announcement', 'title', 'message'], { role: 'owner', steps: ['Announcements'] })
C('Clinic H', 'Reminders (appointment / payment)', '/physio/admin', ['appointment reminders', 'payment reminders', 'send appointment reminders now', 'send payment reminders now'], { role: 'owner', steps: ['Clinic settings'] })
C('Clinic H', 'Audit log', '/physio/admin', ['marked', 'registered'], { role: 'owner', steps: ['Audit log'] })
C('Clinic H', 'Backup and recovery', '/physio/admin', ['export backup', 'restore backup', 'reset demo data'], { role: 'owner', steps: ['Data & backup'] })
C('Clinic H', 'Chart templates (configurable)', '/physio/admin', ['configurable protocols', 'general physiotherapy assessment', 'orthopaedic charts'], { role: 'owner', steps: ['Chart templates'] })
C('Clinic H', 'Permissions matrix (section 5)', '/physio/admin', ['proprietary ai logic', 'billing records', 'clinical assessment', 'ai motion analysis', 'exercise assignments'], { role: 'owner', steps: ['Permissions'] })

/* ---------------- 2. CLINICAL ---------------- */
C('Clinical A', 'Professional registration', '/physio/welcome', ['qualifications', 'registration / licence number', 'clinic association', 'professional role', 'submit for verification'], { steps: ['Professional account'] })
C('Clinical A', 'Clinical signature on finalised records', '/physio/patients/p1?tab=assess', ['signed by'])
C('Clinical A', 'Role-based access to clinical records', '/physio/patients/p1?tab=history', ['clinical records are restricted for this role'], { role: 'receptionist' })

C('Clinical B', 'Clinical dashboard', '/physio', ['ai review queue', 'symptom check-in', 'low exercise adherence', 'reassessment due', 'treatment plan review due', 'progress:', 'pending clinical note'])

C('Clinical C', 'Clinical patient workspace tabs', '/physio/patients/p1', ['medical history', 'assessment', 'plan & goals', 'sessions', 'exercises', 'progress', 'motion', 'ai copilot', 'reassess & discharge', 'billing', 'clinical timeline'])
C('Clinical C', 'Review patient-reported symptoms', '/physio/inbox', ['symptom check-ins', 'review and reply', 'mark reviewed', 'update plan'])

C('Clinical D', 'Medical history: diabetes / cardiac / stroke + more', '/physio/patients/p1?tab=history', ['diabetes', 'cardiac', 'stroke', 'additional medical history', 'hypertension', 'previous surgeries', 'previous injuries', 'neurological conditions', 'musculoskeletal conditions', 'current medication', 'allergies', 'investigations and imaging', 'previous physiotherapy', 'additional notes', 'source:', 'red flags and contraindications'])
C('Clinical D', 'Update history form', '/physio/patients/p1?tab=history', ['update medical history', 'red flags', 'contraindications', 'current medication', 'precautions', 'duration'], { steps: ['Update history'] })
C('Clinical D', 'Stroke history fields', '/physio/patients/p3?tab=history', ['date of stroke', 'affected side', 'residual symptoms'], { steps: ['Update history'] })
C('Clinical D', 'Cardiac history fields', '/physio/patients/p6?tab=history', ['condition', 'treatment', 'precautions'], { steps: ['Update history'] })
C('Clinical D', 'Patient-submitted history updates', '/physio/patients/p1?tab=history', ['patient-submitted update awaiting review', 'incorporate into record'])

C('Clinical E', 'General physiotherapy assessment chart', '/physio/patients/p1?tab=assess', ['patient information', 'primary complaint', 'treating therapist', 'chief complaint', 'history of present condition', 'onset and duration', 'pain location', 'pain severity', 'aggravating factors', 'relieving factors', 'functional limitations', 'previous treatment', 'patient goals', 'posture', 'observation', 'swelling', 'tenderness', 'range of motion', 'muscle strength', 'muscle tone', 'sensation', 'reflexes', 'balance', 'gait', 'functional mobility', 'special tests', 'clinical findings', 'problem list', 'clinical impression', 'rehabilitation goals', 'treatment recommendations', 'follow-up plan'], { steps: ['General', 'Open chart'] })
C('Clinical F', 'Clinical assessment chart', '/physio/patients/p1?tab=assess', ['chief complaint', 'history of present condition', 'pain assessment', 'previous treatment', 'medical history', 'functional limitations', 'posture and observation', 'palpation', 'rom (active)', 'rom (passive)', 'muscle strength', 'muscle length', 'neurological screening', 'functional tests', 'special tests', 'outcome measures', 'clinical problem list', "therapist's impression", 'rehabilitation goals', 'treatment plan'], { steps: ['Clinical chart', 'Open chart'] })
C('Clinical G', 'Orthopaedic chart: 11 regions', '/physio/patients/p1?tab=assess', ['shoulder', 'elbow', 'wrist', 'hand', 'cervical spine', 'thoracic spine', 'lumbar spine', 'hip', 'knee', 'ankle', 'foot'], { steps: ['Orthopaedic'] })
C('Clinical G', 'Orthopaedic chart content', '/physio/patients/p1?tab=assess', ['pain location', 'pain severity', 'swelling', 'tenderness', 'weight-bearing status', 'post-operative', 'active', 'passive', 'left', 'right', 'muscle strength', 'joint mobility', 'muscle length', 'functional movement', 'gait assessment', 'special tests', 'outcome measures', 'progress comparison', 'clinical notes'], { steps: ['Orthopaedic', 'Open chart'] })
C('Clinical G', 'Baseline vs follow-up comparison', '/physio/patients/p1?tab=assess', ['baseline', 'latest'])
C('Clinical H', 'Neurological chart', '/physio/patients/p3?tab=assess', ['motor function', 'sensory function', 'muscle tone', 'reflexes', 'coordination', 'balance', 'proprioception', 'postural control', 'gait', 'transfers', 'functional mobility', 'activities of daily living', 'functional independence', 'endurance', 'neurological symptoms', 'stroke rehabilitation tracking'], { steps: ['Neurological', 'Open chart'] })

C('Clinical I', 'Problem list (7 impairment types)', '/physio/patients/p1?tab=plan', ['clinical problem list', 'pain-related limitation', 'restricted range of motion', 'muscle weakness', 'balance deficit', 'gait abnormality', 'functional limitation', 'reduced endurance', 'coordination problem'])
C('Clinical I', 'Goals: 7 types, review, modify', '/physio/patients/p1?tab=plan', ['rehabilitation goals', 'short-term', 'long-term', 'functional', 'pain', 'rom', 'strength', 'mobility', 'modify'], { steps: ['Add goal'] })

C('Clinical J', 'Motion hub', '/physio/motion', ['ai motion analysis', 'start new analysis', 'range of motion', 'posture', 'gait', 'functional', 'awaiting your review', 'all analyses'])
C('Clinical J', 'Setup: patient, episode, type, region, movement', '/physio/motion/new', ['patient', 'episode', 'what are you assessing', 'which movement', 'knee flexion', 'shoulder flexion', 'shoulder abduction', 'elbow flexion', 'hip flexion', 'trunk (lumbar) flexion', 'side to measure', 'instructions for the patient'])
C('Clinical J', 'Posture analysis movements', '/physio/motion/new', ['standing posture (front)', 'standing posture (side)'], { steps: ['Posture'] })
C('Clinical J', 'Gait analysis', '/physio/motion/new', ['walking (gait)'], { steps: ['Gait'] })
C('Clinical J', 'Functional movement analysis', '/physio/motion/new', ['bodyweight squat', 'sit-to-stand', 'single-leg balance'], { steps: ['Functional'] })
C('Clinical J', 'Camera selection + positioning + start', '/physio/motion/new', ['camera', 'upload video', 'simulated demo', 'positioning check', 'start', 'mirror', 'fast model'], { steps: ['Continue to camera'] })
C('Clinical J', 'Review: AI vs manual, annotate, accept/reject/repeat', '/physio/motion/review/m5', ['review motion analysis', 'your manual measurement', 'clinical observations', 'approve and save to record', 'repeat capture', 'reject', 'share approved feedback with the patient', 'repetitions', 'auto-observations', 'linked records', 'tracking', 'progress to goal'])
C('Clinical J', 'History: baseline, trend, comparison, review status', '/physio/motion/review/m3', ['progress across approved analyses', 'review decision', 'reviewed by', 'vs baseline', 'vs previous', 'symmetry', 'left / right peak'])
C('Clinical J', 'Patient motion history + comparison', '/physio/patients/p1?tab=motion', ['new analysis', 'baseline to latest', 'comparison', 'baseline', 'latest', 'approved', 'awaiting review'])
C('Clinical J', 'Motion report (printable)', '/physio/reports', ['ai motion analysis report'], {})

C('Clinical K', 'Treatment plan view', '/physio/patients/p1?tab=plan', ['treatment plan', 'frequency', 'session duration', 'reassess every', 'precautions', 'patient education'])
C('Clinical K', 'Plan editor: 11 treatment modes', '/physio/patients/p1?tab=plan', ['therapeutic exercise', 'manual therapy', 'electrotherapy', 'physical modalities', 'neuromuscular training', 'gait training', 'balance training', 'functional training', 'mobility training', 'patient education', 'home exercise programme', 'share this plan with the patient'], { steps: ['Edit plan'] })
C('Clinical K', 'Session documentation view', '/physio/patients/p1?tab=sessions', ['session #', 'pain before', 'subjective', 'objective findings', 'treatment provided', 'exercise dosage', 'tolerance', 'next-session plan', 'signed by'])
C('Clinical K', 'Session documentation form', '/physio/patients/p1?tab=sessions', ['pain before treatment', 'pain after treatment', 'subjective response', 'patient tolerance', 'adverse response', 'session notes', 'next-session plan', 'finalise session note'], { steps: ['Document session'] })

C('Clinical L', 'Exercise library', '/physio/exercises', ['exercise library', 'search by name or region', 'camera'], { })
C('Clinical L', 'Exercise detail + assignment', '/physio/exercises', ['precautions', 'equipment', 'sets × reps', 'hold', 'level', 'assign to patient', 'demonstration video'], { steps: ['Heel slides'] })
C('Clinical L', 'Assigned programme + monitoring', '/physio/patients/p1?tab=exercises', ['assigned programme', 'assign exercise', 'edit dosage', 'discontinue', 'patient feedback (latest)', 'adherence (7 days)', 'average pain after exercise', 'trackable'])
C('Clinical L', 'Assign sheet with dates', '/physio/patients/p1?tab=exercises', ['exercise library', 'sets', 'repetitions', 'frequency', 'start date', 'review date', 'precautions'], { steps: ['Assign exercise', 'Heel slides'] })
C('Clinical L', 'Edit assignment (dosage, dates)', '/physio/patients/p1?tab=exercises', ['start date', 'review date', 'instructions for this patient'], { steps: ['Edit dosage'] })

C('Clinical M', 'Progress + recovery intelligence', '/physio/patients/p1?tab=progress', ['recovery intelligence', 'rule-based summary', 'pain across sessions', 'measured', 'outcome measures', 'exercise adherence trend', 'goal achievement', 'record score', 'baseline'])
C('Clinical N', 'All 12 outcome measures', '/physio/patients/p1?tab=progress', ['koos', 'womac', 'lefs', 'odi', 'ndi', 'dash / quickdash', 'spadi', 'berg balance scale', 'timed up and go', '10-meter walk test', '6-minute walk test', 'modified ashworth scale'], { steps: ['Record score'] })
C('Clinical O', 'Copilot: drafts', '/physio/patients/p1?tab=copilot', ['documentation copilot', 'soap note', 'assessment summary', 'treatment session summary', 'reassessment summary', 'progress report', 'discharge summary', 'drafts until', 'template engine'])
C('Clinical O', 'Copilot: record assistant + missing docs', '/physio/patients/p1?tab=copilot', ['missing documentation', 'record assistant', 'summarise medical history', 'summarise treatment history', 'compare measurements', 'summarise clinical timeline', 'previous motion results', "search this patient's record", 'saved drafts and notes'])
C('Clinical P', 'Reassessment + discharge', '/physio/patients/p1?tab=reassess', ['reassessment schedule', 'record reassessment', 'pain now', 'clinical conclusion', 'discharge', 'final assessment completed', 'goals reviewed', 'final outcome measure recorded', 'discharge summary generated', 'home exercise recommendations prepared', 'follow-up recommendations'])
const CLIN_REPORTS = ['initial assessment report', 'general physiotherapy assessment', 'orthopaedic assessment report', 'neurological assessment report', 'medical history summary', 'treatment plan', 'treatment session report', 'ai motion analysis report', 'progress report', 'reassessment report', 'outcome measure report', 'clinical timeline', 'discharge summary', 'patient clinical summary']
C('Clinical Q', '14 clinical reports', '/physio/reports', CLIN_REPORTS)
C('Clinical Q', 'Report with review status', '/physio/reports', ['reviewed and signed by', 'print / pdf'], { steps: ['Treatment plan'] })

/* ---------------- 3. PATIENT ---------------- */
const PT = 'p1'
C('Patient A', 'Onboarding entry', '/patient/welcome', ['join with invite code', 'i already have an account'], { patient: null })
C('Patient A', 'Invite code step', '/patient/welcome', ['enter your invite code', 'invite code'], { patient: null, steps: ['Join with invite code'] })
C('Patient A', 'Login + Google + recovery', '/patient/welcome', ['sign in', 'continue with google', 'forgot password?'], { patient: null, steps: ['I already have an account'] })
C('Patient B', 'Home dashboard', '/patient/home', ['current rehabilitation', 'sessions completed', 'next appointment', "today's exercises", 'my goals', 'how are you feeling?', 'notifications', 'check-in', 'book', 'pay'], { patient: PT })
C('Patient B', 'Latest approved update + streak', '/patient/home', ['latest approved update', 'exercise streak'], { patient: PT })
C('Patient C', 'Profile, clinic, therapist, consent, emergency', '/patient/profile', ['patient id', 'clinic', 'treating therapist', 'consent', 'contact details', 'emergency contact', 'privacy', 'log out'], { patient: PT })
C('Patient C', 'Notification preferences', '/patient/notifications', ['notification preferences', 'appointment reminders', 'exercise reminders', 'payment reminders'], { patient: PT })
C('Patient D', 'Appointments list + request + slots', '/patient/appointments', ['upcoming', 'history', 'request', 'book an available slot'], { patient: PT })
C('Patient D', 'Appointment details + actions', '/patient/appointments', ['therapist', 'where', 'status', 'before your visit', 'confirm i will attend', 'request reschedule', 'request cancellation'], { patient: PT, steps: ['Rehabilitation session'] })
C('Patient D', 'Request an appointment', '/patient/appointments', ['preferred date', 'preferred time', 'reason', 'send request'], { patient: PT, steps: ['Request'] })
C('Patient E', 'Medical information + submission', '/patient/medical', ['current condition', 'from my record', 'assessment summary', 'previous treatment', 'something changed?', 'submit an update'], { patient: PT })
C('Patient E', 'Submit medication / allergy / symptom', '/patient/medical', ['new medication', 'allergy', 'new symptom', 'medical history change', 'correct my details'], { patient: PT, steps: ['Submit an update'] })
C('Patient F', 'Treatment plan', '/patient/plan', ['how often', 'what your treatment includes', 'precautions', 'advice from your therapist', 'my goals', 'exercise schedule', 'follow-up schedule'], { patient: PT })
C('Patient G', 'My exercises', '/patient/exercises', ['this week', 'weekly completion', 'today', 'full programme', 'history', 'heel slides'], { patient: PT })
C('Patient G', 'Exercise detail', '/patient/exercise/as_p1_1', ['how to do it', 'precautions', 'sec hold', 'start with camera tracking', 'follow along and count myself', 'from your therapist', 'demonstration video'], { patient: PT })
C('Patient H', 'Camera tracking + restrictions', '/patient/exercise/as_p1_1', ['camera tracking counts reps', 'cannot diagnose'], { patient: PT })
C('Patient H', 'Camera session screen', '/patient/exercise/as_p1_1', ['guidance only', 'not a diagnosis', 'tracked set'], { patient: PT, steps: ['Try with demo skeleton', 'Start'] })
C('Patient I', 'Sessions', '/patient/sessions', ['coming up', 'completed', 'session #', "today's treatment", 'next time'], { patient: PT })
C('Patient J', 'Progress dashboard', '/patient/progress', ['my progress', 'summary from your therapist', 'baseline vs latest', 'goal progress', 'recovery timeline', 'pain over your sessions', 'what does this mean?', 'attendance', 'my scores', 'exercise completion this week', 'your goal'], { patient: PT })
C('Patient K', 'Symptom check-in', '/patient/checkin', ['pain level right now', 'where is it?', 'swelling', 'exercise difficulty', 'new or unusual symptoms', 'i completed my exercises', 'send to my therapist', 'previous check-ins'], { patient: PT })
C('Patient L', 'Payments', '/patient/payments', ['outstanding balance', 'total fees', 'paid', 'payment history', 'pay online', 'sessions used', 'sessions remaining'], { patient: PT })
C('Patient M', 'Reports and documents', '/patient/reports', ['reports & documents', 'approved', 'download'], { patient: PT, steps: ['Movement analysis report'] })
C('Patient N', 'Notifications', '/patient/notifications', ['appointment', 'exercise', 'mark all read'], { patient: PT })
C('Patient O', 'Messages + companion', '/patient/messages', ['clinic', 'companion', 'message your clinic'], { patient: PT })
C('Patient O', 'Recovery companion', '/patient/messages', ['recovery companion', 'explain my exercises', 'when is my next appointment', 'what do my results mean', 'i have pain or a new symptom', 'help me use the app'], { patient: PT, steps: ['Companion'] })
C('Patient P', 'Feedback and support', '/patient/support', ['contact your clinic', 'send us a note', 'treatment feedback', 'exercise feedback', 'technical problem', 'common questions'], { patient: PT })
C('Patient P', 'More menu + log out', '/patient/more', ['symptom check-in', 'my treatment plan', 'my medical information', 'treatment sessions', 'payments', 'reports & documents', 'messages & companion', 'notifications', 'feedback & support', 'log out'], { patient: PT })

/* ---------------- Functional (business rules) ---------------- */
const F = []
const T = (s, f, fn) => F.push({ s, f, fn })
const st = () => store().getState()
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const nextWeekday = (dow) => { for (let i = 1; i < 14; i++) { const d = new Date(iso(i) + 'T12:00:00'); if (d.getDay() === dow) return iso(i) } }

T('Clinic D', 'Double-booking is prevented', () => {
  const day = nextWeekday(2)
  const a = st().bookAppointment({ patientId: 'p2', therapistId: 's1', date: day, time: '12:00', duration: 45, type: 'Follow-up session', status: 'Scheduled', mode: 'In-clinic' })
  const b = st().bookAppointment({ patientId: 'p4', therapistId: 's1', date: day, time: '12:15', duration: 45, type: 'Follow-up session', status: 'Scheduled', mode: 'In-clinic' })
  return a.ok && !b.ok && /conflict/i.test(b.error || '')
})
T('Clinic G', 'Booking outside working hours is blocked', () => {
  const r = st().bookAppointment({ patientId: 'p2', therapistId: 's1', date: nextWeekday(3), time: '05:00', duration: 45, type: 'Follow-up session', status: 'Scheduled', mode: 'In-clinic' })
  return !r.ok && /outside/i.test(r.error || '')
})
T('Clinic G', 'Booking on a leave day is blocked', () => {
  const leave = st().leaves[0]
  const r = st().bookAppointment({ patientId: 'p3', therapistId: leave.staffId, date: leave.date, time: '11:00', duration: 45, type: 'Follow-up session', status: 'Scheduled', mode: 'In-clinic' })
  return !r.ok && /leave|work/i.test(r.error || '')
})
T('Clinic D', 'Walk-in can be booked and checked in', () => {
  const r = st().bookAppointment({ patientId: 'p2', therapistId: 's3', date: iso(0), time: '13:00', duration: 30, type: 'Initial consultation', status: 'Checked in', mode: 'In-clinic', walkIn: true })
  return r.ok
})
T('Clinic E', 'Attendance marking changes status', () => {
  const a = st().appointments.find((x) => x.status === 'Scheduled')
  st().markAttendance(a.id, 'absent', 'test')
  const after = st().appointments.find((x) => x.id === a.id)
  return after.attendance === 'absent' && after.status === 'No-show'
})
T('Clinic F', 'Extra charge increases total fees', () => {
  const before = st().packages.find((p) => p.patientId === 'p2').totalFees
  st().addCharge({ patientId: 'p2', date: iso(0), desc: 'QA charge', amount: 500 })
  return st().charges.some((c) => c.desc === 'QA charge') && before > 0
})
T('Clinic F', 'Payment and refund are recorded with receipts', () => {
  const pay = st().addPayment({ patientId: 'p2', date: iso(0), amount: 100, method: 'Cash', kind: 'Payment' })
  const ref = st().addPayment({ patientId: 'p2', date: iso(0), amount: -50, method: 'UPI', kind: 'Refund' })
  return /^RC-/.test(pay.receiptNo) && ref.amount === -50
})
T('Clinic A', 'Staff can be added, edited and verified', () => {
  st().addStaff({ name: 'QA Physio', role: 'Physiotherapist', speciality: 'Test', phone: '0', hours: 'x' })
  const s = st().staff.find((x) => x.name === 'QA Physio')
  st().updateStaff(s.id, { speciality: 'Edited' })
  st().verifyStaff(s.id)
  const a = st().staff.find((x) => x.id === s.id)
  return a.speciality === 'Edited' && a.verified === true
})
T('Cross-portal', 'Invite → patient accepts → physio notified', () => {
  const code = st().sendInvite('p8')
  const p = st().acceptInvite(code)
  return p && p.invite.status === 'accepted' && st().notices.some((n) => n.audience === 'physio' && /joined/i.test(n.title))
})
T('Cross-portal', 'Physio assigns exercise → patient notified', () => {
  st().assignExercise({ patientId: 'p2', exerciseId: 'ex-calf', sets: 3, reps: 12, frequency: 'Daily', notes: '', start: iso(0), review: iso(14) })
  return st().notices.some((n) => n.audience === 'patient' && n.patientId === 'p2' && n.kind === 'exercise')
})
T('Cross-portal', 'Patient check-in → physio alert → reply reaches patient', () => {
  st().submitCheckIn({ patientId: 'p2', pain: 8, location: 'Knee', swelling: 'Mild', difficulty: 'Hard', exercisesDone: false, newSymptoms: 'QA symptom', remarks: '' })
  const alerted = st().notices.some((n) => n.audience === 'physio' && /pain 8/i.test(n.title))
  const ci = st().checkins.find((c) => c.newSymptoms === 'QA symptom')
  st().reviewCheckIn(ci.id, 'QA reply')
  return alerted && st().notices.some((n) => n.audience === 'patient' && n.body === 'QA reply')
})
T('Cross-portal', 'Motion result stays hidden until approved, then reaches patient', () => {
  const id = st().addMotion({ patientId: 'p2', at: new Date().toISOString(), category: 'rom', movementId: 'knee-flex', movementLabel: 'Knee flexion / extension', region: 'Knee', side: 'Left', source: 'Webcam', durationSec: 10, metricLabel: 'x', headline: 120, unit: '°', reps: [], quality: 90, extra: [], observations: [], warnings: [], series: [], seriesLabel: '', status: 'pending', visibleToPatient: false })
  const hidden = !st().motions.find((m) => m.id === id).visibleToPatient
  st().reviewMotion(id, { status: 'approved', visibleToPatient: true })
  const m = st().motions.find((x) => x.id === id)
  return hidden && m.status === 'approved' && m.visibleToPatient && st().notices.some((n) => n.audience === 'patient' && n.patientId === 'p2' && /approved movement feedback/i.test(n.title))
})
T('Clinical O', 'Drafts stay drafts until approved and signed', () => {
  const id = st().addDraft({ patientId: 'p2', kind: 'SOAP note', text: 'x' })
  const d0 = st().drafts.find((d) => d.id === id)
  st().updateDraft(id, { status: 'approved', signedBy: 'QA', shared: true })
  const d1 = st().drafts.find((d) => d.id === id)
  return d0.status === 'draft' && d1.status === 'approved' && d1.signedBy === 'QA' && d1.shared === true
})
T('Clinical P', 'Discharge closes the episode', () => {
  st().dischargePatient('p7')
  return st().patients.find((p) => p.id === 'p7').status === 'discharged'
})
T('Clinical I', 'Problem list persists', () => {
  st().setProblems('p2', ['Muscle weakness', 'Balance deficit', 'Reduced endurance'])
  return st().problems.p2.includes('Reduced endurance')
})

/* ---------------- runner ---------------- */
export async function run({ verbose = false, only = null } = {}) {
  st().reset()
  st().setPatientId(null)
  setRole('physio')
  await wait(300)
  const results = []
  const errors = []
  const onErr = (e) => errors.push(e.message || String(e.reason))
  window.addEventListener('error', onErr)
  window.addEventListener('unhandledrejection', onErr)
  for (const c of checks.filter((x) => !only || only.test(x.s + ' ' + x.f))) {
    errors.length = 0
    const wantRole = c.role || 'physio'
    st().setPhysioRole(wantRole)
    if ('patient' in c) st().setPatientId(c.patient)
    else if (c.route.startsWith('/physio')) st().setPatientId(null)
    await go(c.route)
    const failedSteps = []
    for (const s of c.steps || []) {
      if (!clickText(s)) failedSteps.push(s)
      await wait(400)
    }
    const blank = (document.getElementById('root')?.innerText || '').length < 50
    const text = body()
    const missing = c.needles.filter((n) => !text.includes(n.toLowerCase()))
    results.push({ section: c.s, feature: c.f, ok: missing.length === 0 && failedSteps.length === 0 && !blank, missing: blank ? ['PAGE IS BLANK', ...errors.slice(0, 2)] : missing, failedSteps, route: c.route })
  }
  st().setPhysioRole('physio')
  for (const t of F.filter((x) => !only || only.test(x.s + ' ' + x.f))) {
    let ok = false, err = ''
    try { ok = !!t.fn() } catch (e) { err = String(e) }
    results.push({ section: t.s, feature: t.f + ' (functional)', ok, missing: err ? [err] : [], failedSteps: [], route: 'store' })
  }
  window.removeEventListener('error', onErr)
  window.removeEventListener('unhandledrejection', onErr)
  st().reset()
  st().setPatientId(null)
  await go('/')
  const pass = results.filter((r) => r.ok).length
  const fails = results.filter((r) => !r.ok)
  const needles = checks.reduce((n, c) => n + c.needles.length, 0)
  const summary = { total: results.length, pass, fail: fails.length, needlesChecked: needles + F.length, failures: fails.map((f) => ({ section: f.section, feature: f.feature, route: f.route, missing: f.missing, failedSteps: f.failedSteps })) }
  if (verbose) summary.all = results
  return summary
}
