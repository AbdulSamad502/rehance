import type {
  Announcement, Appointment, ApptStatus, ApptType, Assessment, Assignment, AuditEntry, Charge, CheckIn, DraftNote, ExerciseLog,
  FeeSchedule, Goal, Leave, MedicalHistory, Message, MotionResult, Notice, OutcomeScore, Package, Patient, PatientRequest, Payment,
  SessionNote, Staff, TreatmentPlan, WaitingEntry,
} from '../types'
import { getMovement } from '../features/motion/engine/movements'
import { daysFromToday, round, todayISO } from '../lib/utils'

export interface DB {
  seededOn: string
  staff: Staff[]
  patients: Patient[]
  appointments: Appointment[]
  waiting: WaitingEntry[]
  packages: Package[]
  payments: Payment[]
  assessments: Assessment[]
  goals: Goal[]
  plans: TreatmentPlan[]
  sessions: SessionNote[]
  assignments: Assignment[]
  logs: ExerciseLog[]
  checkins: CheckIn[]
  outcomes: OutcomeScore[]
  motions: MotionResult[]
  messages: Message[]
  notices: Notice[]
  requests: PatientRequest[]
  audit: AuditEntry[]
  drafts: DraftNote[]
  announcements: Announcement[]
  leaves: Leave[]
  charges: Charge[]
  fees: FeeSchedule
  problems: Record<string, string[]>
}

// deterministic pseudo-random so the demo looks the same every time
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const d = daysFromToday
const at = (n: number, hhmm = '11:05') => `${d(n)}T${hhmm}:00`

const mh = (o: Partial<MedicalHistory> = {}): MedicalHistory => ({
  diabetes: { has: false }, cardiac: { has: false }, stroke: { has: false }, hypertension: false,
  surgeries: 'None', injuries: 'None', neuro: 'None', msk: 'None', medications: 'None',
  allergies: 'No known allergies', imaging: 'None', previousPhysio: 'None', redFlags: 'None identified',
  contraindications: 'None', notes: '', source: 'Patient interview', updatedAt: d(-30), ...o,
})

const staff: Staff[] = [
  { id: 's1', name: 'Dr. Mohammed Abdul Rasheed', role: 'Senior Physiotherapist', speciality: 'Orthopaedic & Sports', verified: true, active: true, phone: '+91 98200 11001', hours: 'Mon-Sat 9:00-17:00', workDays: [1,2,3,4,5,6], start: '09:00', end: '17:00' },
  { id: 's2', name: 'Dr. Karan Mehta', role: 'Physiotherapist', speciality: 'Neurological Rehabilitation', verified: true, active: true, phone: '+91 98200 11002', hours: 'Mon-Fri 10:00-18:00', workDays: [1,2,3,4,5], start: '10:00', end: '18:00' },
  { id: 's3', name: 'Dr. Sneha Iyer', role: 'Physiotherapist', speciality: 'Geriatric & Spine', verified: true, active: true, phone: '+91 98200 11003', hours: 'Mon-Sat 9:00-15:00', workDays: [1,2,3,4,5,6], start: '09:00', end: '15:00' },
  { id: 's4', name: 'Dr. Vikram Shah', role: 'Orthopaedic Doctor', speciality: 'Joint replacement', verified: true, active: true, phone: '+91 98200 11004', hours: 'Tue/Thu 14:00-17:00', workDays: [2,4], start: '14:00', end: '17:00' },
  { id: 's5', name: 'Meera Nair', role: 'Receptionist', speciality: 'Front desk', verified: false, active: true, phone: '+91 98200 11005', hours: 'Mon-Sat 8:30-17:30', workDays: [1,2,3,4,5,6], start: '08:30', end: '17:30' },
  { id: 's6', name: 'Rohit Kulkarni', role: 'Clinic Admin', speciality: 'Operations & billing', verified: false, active: true, phone: '+91 98200 11006', hours: 'Mon-Fri 9:00-17:00', workDays: [1,2,3,4,5], start: '09:00', end: '17:00' },
]

const tints = ['#2a80d2', '#14a3a8', '#7c5cd6', '#e07a3f', '#d6568a', '#3a9d6b', '#c79a1f', '#4a6fa5']

interface PSpec {
  id: string; name: string; age: number; sex: Patient['sex']; cond: string; region: string; side: Patient['side']
  th: string; status?: Patient['status']; regDays: number; ref: string; ep: string; hist?: Partial<MedicalHistory>
  invite?: Patient['invite']
}
const specs: PSpec[] = [
  { id: 'p1', name: 'Mohammed Abdul Samad', age: 54, sex: 'Male', cond: 'Right total knee replacement (post-op)', region: 'Knee', side: 'Right', th: 's1', regDays: -38, ref: 'Dr. Vikram Shah (Orthopaedics)', ep: 'Post-op right TKR rehabilitation',
    hist: { diabetes: { has: true, type: 'Type 2', duration: '6 years', meds: 'Metformin 500 mg', precautions: 'Check blood sugar before exercise; carry glucose.' }, hypertension: true, surgeries: 'Right TKR (38 days ago); Hysterectomy (2014)', medications: 'Metformin, Amlodipine 5 mg, Aspirin 75 mg', allergies: 'Penicillin (rash)', imaging: 'Post-op knee X-ray: implant well positioned', redFlags: 'Monitor calf swelling/tenderness (DVT risk)', contraindications: 'No passive forced flexion beyond 120° until week 12', notes: 'Motivated; lives with daughter; 2 flights of stairs at home.' },
    invite: { code: 'GP-1001', status: 'accepted' } },
  { id: 'p2', name: 'Arjun Malhotra', age: 28, sex: 'Male', cond: 'ACL reconstruction (left knee)', region: 'Knee', side: 'Left', th: 's1', regDays: -52, ref: 'Dr. Vikram Shah (Orthopaedics)', ep: 'ACL reconstruction rehab, phase 2',
    hist: { surgeries: 'Left ACL reconstruction (hamstring graft), 9 weeks ago', injuries: 'ACL rupture playing football', imaging: 'MRI: complete ACL tear (pre-op)', notes: 'Wants to return to football in 4 months.' }, invite: { code: 'GP-1002', status: 'accepted' } },
  { id: 'p3', name: 'Sunita Patil', age: 63, sex: 'Female', cond: 'Ischaemic stroke, left hemiparesis', region: 'Neuro', side: 'Left', th: 's2', regDays: -70, ref: 'Dr. R. Menon (Neurology)', ep: 'Stroke rehabilitation (sub-acute)',
    hist: { hypertension: true, stroke: { has: true, date: '3 months ago', side: 'Left', residual: 'Left arm weakness, reduced balance', precautions: 'Falls risk; supervision for gait.' }, medications: 'Clopidogrel, Atorvastatin, Telmisartan', neuro: 'Left hemiparesis (MRC 3/5 arm, 4/5 leg)', redFlags: 'New headache, slurred speech: seek urgent care', notes: 'Husband attends sessions.' }, invite: { code: 'GP-1003', status: 'accepted' } },
  { id: 'p4', name: 'Rahul Verma', age: 41, sex: 'Male', cond: 'Chronic low back pain (L4-L5)', region: 'Lumbar', side: 'NA', th: 's3', regDays: -44, ref: 'Self-referred', ep: 'Low back pain management',
    hist: { msk: 'L4-L5 disc bulge (MRI)', imaging: 'MRI lumbar spine: L4-L5 disc bulge, no cord compression', previousPhysio: 'Six sessions elsewhere in 2024', notes: 'Desk job, 9 h sitting daily.' }, invite: { code: 'GP-1004', status: 'accepted' } },
  { id: 'p5', name: 'Fatima Sheikh', age: 35, sex: 'Female', cond: 'Rotator cuff tendinopathy (right shoulder)', region: 'Shoulder', side: 'Right', th: 's1', regDays: -33, ref: 'Dr. S. Gupta (GP)', ep: 'Right shoulder rehabilitation',
    hist: { injuries: 'Overuse, painters job', imaging: 'Ultrasound: supraspinatus tendinopathy', medications: 'Ibuprofen as needed' }, invite: { code: 'GP-1005', status: 'accepted' } },
  { id: 'p6', name: 'Mohan Das', age: 70, sex: 'Male', cond: 'Balance impairment and falls risk', region: 'Balance', side: 'NA', th: 's3', regDays: -61, ref: 'Dr. P. Joshi (Geriatrics)', ep: 'Falls prevention programme',
    hist: { hypertension: true, cardiac: { has: true, condition: 'Stable angina', treatment: 'Isosorbide, Aspirin', precautions: 'Stop if chest pain or breathlessness; keep HR < 110.' }, neuro: 'Mild peripheral neuropathy', medications: 'Aspirin, Isosorbide, Amlodipine', redFlags: 'Chest pain, dizziness on standing', notes: 'Two falls in last 6 months.' }, invite: { code: 'GP-1006', status: 'accepted' } },
  { id: 'p7', name: 'Ishita Banerjee', age: 22, sex: 'Female', cond: 'Right ankle sprain (grade II)', region: 'Ankle', side: 'Right', th: 's1', status: 'discharged', regDays: -48, ref: 'Walk-in', ep: 'Ankle sprain rehabilitation (completed)',
    hist: { injuries: 'Inversion injury during basketball', notes: 'Returned to sport.' }, invite: { code: 'GP-1007', status: 'accepted' } },
  { id: 'p8', name: 'Deepak Joshi', age: 48, sex: 'Male', cond: 'Cervical spondylosis with neck pain', region: 'Cervical', side: 'NA', th: 's2', regDays: -1, ref: 'Dr. S. Gupta (GP)', ep: 'Neck pain assessment (new)',
    hist: { msk: 'Cervical spondylosis (X-ray)', imaging: 'X-ray C-spine: C5-C6 osteophytes', notes: 'Registered yesterday. Awaiting first assessment.' }, invite: { code: 'GP-4821', status: 'sent' } },
]

const patients: Patient[] = specs.map((s, i) => ({
  id: s.id, code: `GP-${1001 + i}`, name: s.name, age: s.age, sex: s.sex,
  phone: `+91 9${8000 + i * 137}${10000 + i * 913}`.slice(0, 15), email: `${s.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  address: ['12 Lake View Road, Pune', '4B Sunrise Apts, Mumbai', '88 Gandhi Nagar, Pune', '21 Park Street, Thane', '7 Green Park, Pune', '54 Residency Rd, Pune', '9 Hill Crest, Mumbai', '30 MG Road, Pune'][i],
  emergency: ['Meena Sharma (daughter) +91 98111 22001', 'Raj Malhotra (father) +91 98111 22002', 'Prakash Patil (husband) +91 98111 22003', 'Anita Verma (wife) +91 98111 22004', 'Yusuf Sheikh (husband) +91 98111 22005', 'Geeta Das (wife) +91 98111 22006', 'Sudeep Banerjee (father) +91 98111 22007', 'Kavita Joshi (wife) +91 98111 22008'][i],
  referral: s.ref, registeredAt: d(s.regDays), therapistId: s.th, location: i % 3 === 2 ? 'GearPhys Thane' : 'GearPhys Pune (Main)',
  status: s.status ?? 'active', condition: s.cond, region: s.region, side: s.side, episodeTitle: s.ep, episodeStart: d(s.regDays),
  adminRemarks: i === 0 ? 'Prefers UPI. Daughter accompanies on Tuesdays.' : i === 7 ? 'Invite sent. Awaiting patient to join.' : '',
  invite: s.invite ?? { code: '', status: 'none' }, history: mh(s.hist), tint: tints[i],
}))

// ---------- appointments ----------
let apptN = 0
const ap = (patientId: string, therapistId: string, day: number, time: string, type: ApptType, status: ApptStatus, extra: Partial<Appointment> = {}): Appointment => ({
  id: `ap${++apptN}`, patientId, therapistId, date: d(day), time, duration: type === 'Initial consultation' || type === 'Reassessment' ? 60 : 45,
  type, status, mode: 'In-clinic', ...extra,
})
const done = { attendance: 'present' as const }

const heroDays = [-36, -33, -30, -26, -22, -17, -12, -8, -4]
const appointments: Appointment[] = [
  ...heroDays.map((n, i) => ap('p1', 's1', n, '10:30', i === 0 ? 'Initial consultation' : i === 6 ? 'Reassessment' : 'Rehabilitation session', 'Completed', done)),
  ap('p1', 's1', -19, '10:30', 'Follow-up session', 'No-show', { attendance: 'absent', absenceRemark: 'Fever, informed clinic by call' }),
  ap('p1', 's1', 0, '10:30', 'Follow-up session', 'Confirmed'),
  ap('p1', 's1', 2, '10:30', 'Rehabilitation session', 'Scheduled'),
  ap('p1', 's1', 5, '10:30', 'Rehabilitation session', 'Scheduled'),
  // today
  ap('p5', 's1', 0, '08:30', 'Rehabilitation session', 'No-show', { attendance: 'absent', absenceRemark: 'Called: stuck in traffic, rebooked 16:00' }),
  ap('p2', 's1', 0, '09:00', 'Rehabilitation session', 'Completed', done),
  ap('p4', 's3', 0, '09:30', 'Follow-up session', 'Completed', done),
  ap('p3', 's2', 0, '10:00', 'Rehabilitation session', 'Checked in'),
  ap('p6', 's3', 0, '11:30', 'Rehabilitation session', 'In progress'),
  ap('p8', 's2', 0, '12:00', 'Initial consultation', 'Scheduled'),
  ap('p5', 's1', 0, '16:00', 'Rehabilitation session', 'Scheduled'),
  ap('p2', 's1', 0, '14:30', 'Reassessment', 'Confirmed'),
  // recent past for others
  ...[-3, -6, -9, -13].map((n) => ap('p2', 's1', n, '09:00', 'Rehabilitation session', 'Completed', done)),
  ...[-2, -5, -8, -12, -16].map((n) => ap('p3', 's2', n, '10:00', 'Rehabilitation session', 'Completed', done)),
  ...[-3, -7, -10].map((n) => ap('p4', 's3', n, '09:30', 'Follow-up session', 'Completed', done)),
  ap('p4', 's3', -14, '09:30', 'Follow-up session', 'No-show', { attendance: 'absent', absenceRemark: 'Work meeting' }),
  ...[-4, -8, -11].map((n) => ap('p5', 's1', n, '16:00', 'Rehabilitation session', 'Completed', done)),
  ...[-2, -6, -9, -13].map((n) => ap('p6', 's3', n, '11:30', 'Rehabilitation session', 'Completed', done)),
  ...[-12, -15, -18].map((n) => ap('p7', 's1', n, '15:00', 'Rehabilitation session', 'Completed', done)),
  ap('p7', 's1', -10, '15:00', 'Discharge appointment', 'Completed', done),
  // upcoming
  ap('p2', 's1', 2, '09:00', 'Rehabilitation session', 'Scheduled'),
  ap('p3', 's2', 1, '10:00', 'Rehabilitation session', 'Confirmed', { mode: 'Online' }),
  ap('p4', 's3', 3, '09:30', 'Follow-up session', 'Scheduled'),
  ap('p5', 's1', 3, '16:00', 'Rehabilitation session', 'Scheduled'),
  ap('p6', 's3', 1, '11:30', 'Rehabilitation session', 'Confirmed'),
  ap('p8', 's2', 4, '12:00', 'Follow-up session', 'Scheduled'),
  ap('p3', 's2', 0, '15:30', 'Reassessment', 'Cancelled'),
]

const waiting: WaitingEntry[] = [
  { id: 'w1', name: 'Kabir Singh', phone: '+91 98765 43210', reason: 'Knee pain, wants earliest slot', since: at(0, '08:40') },
  { id: 'w2', name: 'Ritu Agarwal', phone: '+91 99877 12345', reason: 'Post-fracture wrist stiffness', since: at(-1, '17:10') },
]

// ---------- billing ----------
const pk = (patientId: string, name: string, totalFees: number, discount: number, sessionsTotal: number): Package => ({ patientId, name, totalFees, discount, sessionsTotal })
const packages: Package[] = [
  pk('p1', 'TKR Rehab: 12 sessions', 18000, 1000, 12), pk('p2', 'ACL Phase 2: 16 sessions', 24000, 0, 16),
  pk('p3', 'Neuro Rehab: 20 sessions', 30000, 2000, 20), pk('p4', 'Spine Care: 10 sessions', 12000, 0, 10),
  pk('p5', 'Shoulder Rehab: 10 sessions', 12000, 500, 10), pk('p6', 'Falls Prevention: 12 sessions', 14400, 0, 12),
  pk('p7', 'Ankle Rehab: 6 sessions', 7200, 0, 6), pk('p8', 'Consult only', 800, 0, 1),
]
let payN = 0
const pay = (patientId: string, day: number, amount: number, method: Payment['method'], kind: Payment['kind'] = 'Payment', note?: string): Payment => ({
  id: `pay${++payN}`, patientId, date: d(day), amount, method, kind, receiptNo: `RC-${2400 + payN}`, note,
})
const payments: Payment[] = [
  pay('p1', -36, 6000, 'UPI'), pay('p1', -17, 6000, 'Cash'),
  pay('p2', -52, 12000, 'Card'), pay('p2', -13, 8000, 'UPI'),
  pay('p3', -70, 15000, 'Bank transfer'), pay('p3', -30, 10000, 'Bank transfer'),
  pay('p4', -44, 6000, 'UPI'), pay('p5', -33, 6000, 'Cash'), pay('p5', -8, 3000, 'UPI'),
  pay('p6', -61, 14400, 'Card'), pay('p7', -48, 7200, 'UPI'), pay('p7', -10, 300, 'Cash', 'Refund', 'Cancelled add-on session'),
  pay('p2', 0, 2000, 'UPI'), pay('p4', 0, 1500, 'Cash'),
]
payments.filter((x) => x.kind === 'Refund').forEach((x) => { x.amount = -Math.abs(x.amount) })

// ---------- clinical ----------
const assessments: Assessment[] = [
  { id: 'as1', patientId: 'p1', kind: 'ortho', region: 'Knee', date: d(-36), therapistId: 's1', status: 'final',
    data: { painLoc: 'Right knee, anterior and medial', pain: '8', swelling: 'Moderate', tender: 'Medial joint line, incision site', wb: 'Partial', postop: 'Yes, < 6 weeks', 'a_Flexion_R': '60', 'a_Flexion_L': '135', 'p_Flexion_R': '68', 'p_Flexion_L': '138', 'a_Extension_R': '-8', 'a_Extension_L': '0', mmt_R: '3', mmt_L: '5', func: 'Needs walker; unable to climb stairs', gait: 'Antalgic gait with walker' } },
  { id: 'as2', patientId: 'p1', kind: 'ortho', region: 'Knee', date: d(-12), therapistId: 's1', status: 'final',
    data: { painLoc: 'Right knee, anterior', pain: '5', swelling: 'Mild', tender: 'Mild, incision site', wb: 'Full', postop: 'Yes, 6-12 weeks', 'a_Flexion_R': '92', 'a_Flexion_L': '135', 'p_Flexion_R': '98', 'p_Flexion_L': '138', 'a_Extension_R': '-3', 'a_Extension_L': '0', mmt_R: '4', mmt_L: '5', func: 'Walks with stick; climbs stairs with rail', gait: 'Mild antalgic' } },
  { id: 'as3', patientId: 'p3', kind: 'neuro', date: d(-60), therapistId: 's2', status: 'final',
    data: { motor: 'Left UL MRC 3/5, LL 4/5', tone: '1+', balance: 'Poor sitting-to-standing balance', gait: 'Hemiplegic gait, needs supervision', independence: 'Min assist', strokeDate: '3 months ago', side: 'Left', measure: 'Berg', score: '28' } },
  { id: 'as4', patientId: 'p4', kind: 'general', date: d(-44), therapistId: 's3', status: 'final',
    data: { chief: 'Low back pain radiating to left buttock', painLoc: 'Lumbar L4-L5, left gluteal', pain: '7', aggr: 'Prolonged sitting, bending', relief: 'Walking, lying flat', func: 'Cannot sit more than 30 minutes', impression: 'Mechanical low back pain with mild left radicular signs' } },
  { id: 'as5', patientId: 'p5', kind: 'ortho', region: 'Shoulder', date: d(-33), therapistId: 's1', status: 'draft',
    data: { painLoc: 'Right anterolateral shoulder', pain: '6', 'a_Flexion_R': '120', 'a_Flexion_L': '170', 'a_Abduction_R': '95', 'a_Abduction_L': '170' } },
]

let gN = 0
const goal = (patientId: string, kind: Goal['kind'], text: string, target: string, progress: number, status: Goal['status'] = 'Active'): Goal => ({ id: `g${++gN}`, patientId, kind, text, target, progress, status })
const goals: Goal[] = [
  goal('p1', 'ROM', 'Achieve 110° of right knee flexion', '110°', 85), goal('p1', 'Functional', 'Climb 2 flights of stairs without rail', 'Independent', 55),
  goal('p1', 'Pain', 'Keep pain at or below 2/10 during walking', '≤ 2/10', 70), goal('p1', 'Long-term', 'Return to morning walks (30 min) and temple visits', '30 min', 40),
  goal('p2', 'Strength', 'Quadriceps strength 90% of right side (LSI)', '90%', 62), goal('p2', 'Long-term', 'Return to football', '4 months', 30),
  goal('p3', 'Mobility', 'Walk 10 m with a quad stick, supervision only', '10 m', 60), goal('p3', 'Functional', 'Dress independently (upper body)', 'Independent', 45),
  goal('p4', 'Pain', 'Reduce pain to 3/10 while sitting 1 hour', '≤ 3/10', 65), goal('p4', 'Functional', 'Sit through a full work meeting', '60 min', 50),
  goal('p5', 'ROM', 'Active shoulder abduction to 150°', '150°', 55), goal('p5', 'Short-term', 'Sleep through the night without shoulder pain', 'Pain-free sleep', 40),
  goal('p6', 'Mobility', 'Berg Balance Scale ≥ 45', '45/56', 55), goal('p6', 'Functional', 'No falls in 3 months', '0 falls', 65),
  goal('p7', 'Functional', 'Return to basketball', 'Achieved', 100, 'Achieved'),
]

const plan = (patientId: string, summary: string, frequency: string, modes: string[], precautions: string, shared = true): TreatmentPlan => ({
  patientId, summary, frequency, sessionDuration: '45 minutes', modes, precautions,
  education: 'Home exercise programme explained. Ice after exercise, elevate when resting, avoid prolonged sitting.',
  reviewDate: d(7), reassessEvery: '2 weeks', shared,
})
const plans: TreatmentPlan[] = [
  plan('p1', 'Restore knee flexion to 110°+ and normal gait; build quadriceps strength; return to stairs.', '3 sessions per week for 4 weeks', ['Therapeutic exercise', 'Manual therapy', 'Electrotherapy', 'Gait training', 'Home exercise programme', 'Patient education'], 'No forced flexion beyond 120°. Monitor calf pain/swelling. Check blood sugar before exercise.'),
  plan('p2', 'Progressive quadriceps/hamstring strengthening, neuromuscular control, return-to-run criteria.', '2 sessions per week', ['Therapeutic exercise', 'Neuromuscular training', 'Balance training', 'Functional training'], 'No pivoting or cutting until cleared.'),
  plan('p3', 'Improve left arm function, balance, and independent gait.', '3 sessions per week', ['Neuromuscular training', 'Gait training', 'Balance training', 'Mobility training', 'Patient education'], 'Falls risk: supervision for all walking.'),
  plan('p4', 'Reduce pain, improve lumbar mobility and core control, posture education.', '2 sessions per week', ['Manual therapy', 'Therapeutic exercise', 'Physical modalities', 'Patient education'], 'Avoid heavy lifting and forward bending under load.'),
  plan('p5', 'Rotator cuff loading programme and scapular control.', '2 sessions per week', ['Therapeutic exercise', 'Manual therapy', 'Electrotherapy'], 'Avoid overhead painting for 2 weeks.'),
  plan('p6', 'Static/dynamic balance, lower-limb strength, falls-prevention education.', '2 sessions per week', ['Balance training', 'Therapeutic exercise', 'Functional training', 'Patient education'], 'Keep heart rate under 110; supervise all balance work.'),
]

let sN = 0
const sessionNotes: SessionNote[] = [
  ...[8, 7, 7, 6, 6, 5, 5, 4, 4].map((pb, i): SessionNote => ({
    id: `sn${++sN}`, patientId: 'p1', no: i + 1, date: d(heroDays[i]), therapistId: 's1', painBefore: pb, painAfter: Math.max(1, pb - 2),
    subjective: ['Pain and stiffness, difficulty sleeping.', 'Slightly better, still swollen.', 'Walking with walker, swelling reducing.', 'Less swelling, more confident.', 'Can bend knee more.', 'Walking with stick indoors.', 'Reassessment: flexion 92°.', 'Climbing stairs with rail.', 'Pain only after long walks.'][i],
    objective: [`Flexion 60°, extension lag 8°.`, 'Flexion 68°. Moderate effusion.', 'Flexion 74°.', 'Flexion 80°. Effusion mild.', 'Flexion 86°.', 'Flexion 90°. Quad lag 5°.', 'Flexion 92°, extension -3°.', 'Flexion 98°.', 'Flexion 101°. Gait near normal.'][i],
    treatment: ['Therapeutic exercise', i % 2 === 0 ? 'Manual therapy' : 'Electrotherapy', i > 3 ? 'Gait training' : 'Patient education'],
    dosage: 'Heel slides 3x10, quad sets 3x10, SLR 3x10', tolerance: 'Good', adverse: 'None', notes: i === 8 ? 'On track for 110° goal by week 6.' : 'Progressing as expected.',
    nextPlan: i === 8 ? 'Add mini squats and stationary cycling; reassess next week.' : 'Continue plan.', shared: true,
  })),
  { id: `sn${++sN}`, patientId: 'p2', no: 6, date: d(-3), therapistId: 's1', painBefore: 2, painAfter: 1, subjective: 'Knee feels strong, no swelling.', objective: 'Flexion 128°, full extension, mild quad lag.', treatment: ['Therapeutic exercise', 'Neuromuscular training'], dosage: 'Leg press 3x12, single-leg balance 3x30 s', tolerance: 'Good', adverse: 'None', notes: '', nextPlan: 'Start jogging prep.', shared: true },
  { id: `sn${++sN}`, patientId: 'p3', no: 12, date: d(-2), therapistId: 's2', painBefore: 3, painAfter: 2, subjective: 'Feels steadier when walking.', objective: 'Berg 33/56. TUG 21 s with quad stick.', treatment: ['Gait training', 'Balance training'], dosage: 'Parallel bars walking 5 x 4 m', tolerance: 'Fair, fatigue at end', adverse: 'None', notes: 'Husband trained in safe guarding.', nextPlan: 'Increase gait distance.', shared: true },
  { id: `sn${++sN}`, patientId: 'p4', no: 4, date: d(-3), therapistId: 's3', painBefore: 6, painAfter: 4, subjective: 'Pain worse after long meetings.', objective: 'Lumbar flexion 60%, SLR 65° left.', treatment: ['Manual therapy', 'Therapeutic exercise'], dosage: 'Core activation 3x10', tolerance: 'Good', adverse: 'None', notes: 'Adherence to home programme low.', nextPlan: 'Posture education, reinforce HEP.', shared: false },
]

// ---------- exercises ----------
const asg = (id: string, patientId: string, exerciseId: string, sets: number, reps: number, freq = 'Daily', notes = ''): Assignment => ({
  id, patientId, exerciseId, sets, reps, frequency: freq, notes, start: d(-30), review: d(7), status: 'Active',
})
const assignments: Assignment[] = [
  asg('as_p1_1', 'p1', 'ex-heel-slide', 3, 10, 'Twice daily', 'Slow, hold 3 s at the end'),
  asg('as_p1_2', 'p1', 'ex-quad-set', 3, 10, 'Daily'),
  asg('as_p1_3', 'p1', 'ex-mini-squat', 3, 10, 'Daily', 'Hold a support, pain-free range'),
  asg('as_p1_4', 'p1', 'ex-sts', 3, 8, 'Daily', 'From a firm chair'),
  asg('as_p2_1', 'p2', 'ex-mini-squat', 3, 12), asg('as_p2_2', 'p2', 'ex-slls', 3, 1, 'Daily', 'Hold 20 s'), asg('as_p2_3', 'p2', 'ex-slr', 3, 12),
  asg('as_p3_1', 'p3', 'ex-sts', 3, 8), asg('as_p3_2', 'p3', 'ex-gait', 4, 1), asg('as_p3_3', 'p3', 'ex-sho-flex', 3, 10, 'Daily', 'Use right hand to assist left arm'),
  asg('as_p4_1', 'p4', 'ex-cat-camel', 2, 10), asg('as_p4_2', 'p4', 'ex-bridge', 3, 12), asg('as_p4_3', 'p4', 'ex-hip-march', 3, 10),
  asg('as_p5_1', 'p5', 'ex-sho-flex', 3, 10), asg('as_p5_2', 'p5', 'ex-sho-abd', 3, 10), asg('as_p5_3', 'p5', 'ex-pendulum', 2, 20),
  asg('as_p6_1', 'p6', 'ex-slls', 3, 1, 'Daily', 'Hold 15 s with support'), asg('as_p6_2', 'p6', 'ex-sts', 3, 8), asg('as_p6_3', 'p6', 'ex-hip-march', 3, 10),
]

const rnd = rng(42)
const logs: ExerciseLog[] = []
let lN = 0
const logsFor = (patientId: string, days: number, adherence: number, skipLast = 0) => {
  for (const a of assignments.filter((x) => x.patientId === patientId)) {
    for (let n = days; n >= skipLast; n--) {
      if (n === 0 && patientId !== 'p1') continue
      if (rnd() > adherence) continue
      const camera = ['ex-heel-slide', 'ex-mini-squat', 'ex-sts'].includes(a.exerciseId) && rnd() > 0.5
      logs.push({
        id: `lg${++lN}`, patientId, assignmentId: a.id, date: d(-n), time: `${String(7 + Math.floor(rnd() * 13)).padStart(2, '0')}:${rnd() > 0.5 ? '30' : '05'}`, repsDone: a.reps * a.sets - Math.floor(rnd() * 4),
        pain: Math.max(0, Math.round((patientId === 'p1' ? 3.5 - (days - n) * 0.07 : 3) + (rnd() * 2 - 1))),
        difficulty: rnd() > 0.7 ? 'Hard' : rnd() > 0.4 ? 'Just right' : 'Easy', camera,
        formScore: camera ? Math.round(78 + rnd() * 18) : undefined, bestAngle: camera ? Math.round(75 + (days - n) * 1.2 + rnd() * 6) : undefined,
      })
    }
  }
}
logsFor('p1', 21, 0.8); logsFor('p2', 10, 0.8); logsFor('p3', 10, 0.7); logsFor('p4', 12, 0.55, 7); logsFor('p5', 10, 0.5); logsFor('p6', 10, 0.75)
// hero has done two exercises today; the rest remain (shows progress on patient Home)
const todayHero = logs.filter((l) => l.patientId === 'p1' && l.date === todayISO())
todayHero.forEach((l) => { if (l.assignmentId === 'as_p1_3' || l.assignmentId === 'as_p1_4') logs.splice(logs.indexOf(l), 1) })
if (!logs.some((l) => l.patientId === 'p1' && l.date === todayISO() && l.assignmentId === 'as_p1_1'))
  logs.push({ id: `lg${++lN}`, patientId: 'p1', assignmentId: 'as_p1_1', date: todayISO(), repsDone: 30, pain: 3, difficulty: 'Just right', camera: true, formScore: 91, bestAngle: 104 })
if (!logs.some((l) => l.patientId === 'p1' && l.date === todayISO() && l.assignmentId === 'as_p1_2'))
  logs.push({ id: `lg${++lN}`, patientId: 'p1', assignmentId: 'as_p1_2', date: todayISO(), repsDone: 30, pain: 2, difficulty: 'Easy', camera: false })

const checkins: CheckIn[] = [
  { id: 'ci1', patientId: 'p1', at: at(-1, '19:20'), pain: 4, location: 'Right knee, front', swelling: 'Mild', difficulty: 'Moderate', exercisesDone: true, newSymptoms: 'Mild ache after the stairs', remarks: 'Knee felt warm in the evening.', reviewed: false },
  { id: 'ci2', patientId: 'p5', at: at(-3, '20:05'), pain: 6, location: 'Right shoulder, front', swelling: 'None', difficulty: 'Hard', exercisesDone: false, newSymptoms: 'Night pain when lying on that side', remarks: '', reviewed: true, reply: 'Thanks Fatima. Avoid sleeping on that side and use a pillow under the arm. We will review at your next session.' },
  { id: 'ci3', patientId: 'p3', at: at(-1, '09:10'), pain: 2, location: 'Left shoulder', swelling: 'None', difficulty: 'Moderate', exercisesDone: true, newSymptoms: '', remarks: 'Felt steadier.', reviewed: true },
]

const outcomes: OutcomeScore[] = []
let oN = 0
const oc = (patientId: string, measure: string, series: [number, number][]) => series.forEach(([day, score]) => outcomes.push({ id: `oc${++oN}`, patientId, measure, date: d(day), score }))
oc('p1', 'KOOS', [[-36, 38], [-24, 46], [-12, 55], [-3, 63]]); oc('p1', 'TUG', [[-36, 18.2], [-24, 15.9], [-12, 13.4], [-3, 11.8]]); oc('p1', 'WOMAC', [[-36, 68], [-12, 49], [-3, 38]])
oc('p2', 'LEFS', [[-52, 48], [-30, 58], [-6, 66]]); oc('p3', 'Berg', [[-60, 28], [-30, 31], [-2, 33]]); oc('p3', 'TUG', [[-60, 26], [-2, 21]])
oc('p4', 'ODI', [[-44, 46], [-24, 38], [-4, 30]]); oc('p5', 'SPADI', [[-33, 62], [-8, 48]]); oc('p6', 'Berg', [[-61, 35], [-30, 38], [-2, 40]]); oc('p6', 'TUG', [[-61, 19], [-2, 16.5]])

// ---------- motion analyses ----------
function mkRom(o: {
  id: string; patientId: string; daysAgo: number; movementId: string; side: 'Left' | 'Right'; headline: number
  status: MotionResult['status']; source?: MotionResult['source']; visible?: boolean; baseline?: boolean; manual?: number
  annotation?: string; peakOther?: number; reps?: number; quality?: number; reviewer?: string; consistency?: number
}): MotionResult {
  const def = getMovement(o.movementId)!
  const r = rng(o.id.length * 97 + o.daysAgo)
  const nReps = o.reps ?? 5
  const peaks = Array.from({ length: nReps }, (_, i) => round(o.headline - (i === 0 ? 0 : 2 + r() * 5)))
  const repDur = 3300 + r() * 600
  const series: number[] = []
  const samples = Math.round((nReps * repDur) / 100)
  for (let i = 0; i < samples; i++) {
    const k = Math.min(nReps - 1, Math.floor((i * 100) / repDur))
    const ph = ((i * 100) % repDur) / repDur
    series.push(round(3 + (peaks[k] - 3) * (0.5 - 0.5 * Math.cos(2 * Math.PI * ph)) + (r() - 0.5), 1))
  }
  const q = o.quality ?? Math.round(86 + r() * 8)
  const other = o.peakOther
  const sym = other ? round(100 * (1 - Math.abs(other - o.headline) / Math.max(other, o.headline))) : undefined
  const gap = (def.target ?? 0) - o.headline
  return {
    id: o.id, patientId: o.patientId, at: at(-o.daysAgo, '11:25'), category: def.category, movementId: def.id, movementLabel: def.label,
    region: def.region, side: o.side, source: o.source ?? 'Webcam', durationSec: round((nReps * repDur) / 1000, 1), metricLabel: def.metricLabel,
    headline: o.headline, unit: def.unit, target: def.target,
    reps: peaks.map((p, i) => ({ n: i + 1, peak: p, min: 3, durationMs: Math.round(repDur), upMs: Math.round(repDur * 0.48), downMs: Math.round(repDur * 0.52), startMs: Math.round(i * repDur) })),
    peakLeft: o.side === 'Left' ? o.headline : other, peakRight: o.side === 'Right' ? o.headline : other, symmetry: sym,
    tempoSec: round(repDur / 1000, 1), consistency: o.consistency ?? Math.round(84 + r() * 10), quality: q,
    extra: [
      { label: 'Repetitions counted', value: String(nReps), flag: 'ok' },
      { label: 'Average rep time', value: `${round(repDur / 1000, 1)} s` },
      ...(other ? [{ label: 'Left / right peak', value: `${o.side === 'Left' ? o.headline : other}° / ${o.side === 'Right' ? o.headline : other}°` }, { label: 'Symmetry', value: `${sym}%`, flag: (sym! >= 90 ? 'ok' : sym! >= 80 ? 'watch' : 'alert') as 'ok' | 'watch' | 'alert' }] : []),
    ],
    observations: [gap <= 0 ? `Reached the goal of ${def.target}${def.unit}.` : `${round(gap)}${def.unit} below the ${def.target}${def.unit} goal. Continue range-focused work.`],
    warnings: q < 70 ? ['Tracking confidence was low for part of the capture.'] : [],
    series, seriesLabel: `${def.region} angle (°)`, status: o.status, manualValue: o.manual, annotation: o.annotation,
    reviewedBy: o.status === 'pending' ? undefined : (o.reviewer ?? 'Dr. Mohammed Abdul Rasheed'), visibleToPatient: o.visible ?? o.status === 'approved', isBaseline: o.baseline,
  }
}

const motions: MotionResult[] = [
  mkRom({ id: 'm1', patientId: 'p1', daysAgo: 36, movementId: 'knee-flex', side: 'Right', headline: 62, status: 'approved', baseline: true, manual: 60, peakOther: 133, annotation: 'Baseline at initial assessment; goniometer 60°.' }),
  mkRom({ id: 'm2', patientId: 'p1', daysAgo: 24, movementId: 'knee-flex', side: 'Right', headline: 78, status: 'approved', manual: 76, peakOther: 134 }),
  mkRom({ id: 'm3', patientId: 'p1', daysAgo: 12, movementId: 'knee-flex', side: 'Right', headline: 92, status: 'approved', manual: 92, peakOther: 135, annotation: 'Reassessment: consistent with manual goniometry.' }),
  mkRom({ id: 'm4', patientId: 'p1', daysAgo: 4, movementId: 'knee-flex', side: 'Right', headline: 101, status: 'approved', manual: 100, peakOther: 135 }),
  mkRom({ id: 'm5', patientId: 'p1', daysAgo: 1, movementId: 'knee-flex', side: 'Right', headline: 106, status: 'pending', source: 'Patient home session', quality: 83, reps: 8 }),
  mkRom({ id: 'm6', patientId: 'p2', daysAgo: 30, movementId: 'knee-flex', side: 'Left', headline: 105, status: 'approved', baseline: true, peakOther: 140 }),
  mkRom({ id: 'm7', patientId: 'p2', daysAgo: 3, movementId: 'knee-flex', side: 'Left', headline: 128, status: 'approved', peakOther: 140 }),
  mkRom({ id: 'm8', patientId: 'p5', daysAgo: 32, movementId: 'shoulder-flex', side: 'Right', headline: 118, status: 'approved', baseline: true, peakOther: 168 }),
  mkRom({ id: 'm9', patientId: 'p5', daysAgo: 8, movementId: 'shoulder-flex', side: 'Right', headline: 138, status: 'approved', peakOther: 169 }),
  mkRom({ id: 'm10', patientId: 'p5', daysAgo: 0, movementId: 'shoulder-abd', side: 'Right', headline: 112, status: 'pending', quality: 79 }),
]

const messages: Message[] = [
  { id: 'ms1', patientId: 'p1', from: 'clinic', text: 'Hi Abdul, great progress this week! Your knee flexion is now over 100°. Keep up the heel slides.', at: at(-4, '18:30') },
  { id: 'ms2', patientId: 'p1', from: 'patient', text: 'Thank you doctor! Is it okay to use the stairs without the rail?', at: at(-4, '19:02') },
  { id: 'ms3', patientId: 'p1', from: 'clinic', text: 'Please keep using the rail for 2 more weeks. We will test stairs together in clinic.', at: at(-3, '09:15') },
]

const notices: Notice[] = [
  { id: 'n1', audience: 'patient', patientId: 'p1', kind: 'appointment', title: 'Appointment today', body: 'Follow-up session at 10:30 AM with Dr. Mohammed Abdul Rasheed.', at: at(0, '07:00'), read: false },
  { id: 'n2', audience: 'patient', patientId: 'p1', kind: 'exercise', title: 'Exercise reminder', body: 'You still have 2 exercises to complete today.', at: at(0, '17:00'), read: false },
  { id: 'n3', audience: 'patient', patientId: 'p1', kind: 'recovery', title: 'New progress update', body: 'Your therapist approved a new motion analysis: knee flexion 101°.', at: at(-4, '12:10'), read: true },
  { id: 'n4', audience: 'patient', patientId: 'p1', kind: 'payment', title: 'Payment reminder', body: 'Outstanding balance of ₹5,000 for your TKR package.', at: at(-2, '10:00'), read: true },
  { id: 'n5', audience: 'physio', kind: 'alert', title: 'Low exercise adherence', body: 'Rahul Verma has not logged exercises for 6 days.', at: at(0, '08:00'), read: false },
  { id: 'n6', audience: 'physio', kind: 'ai', title: 'Motion analysis awaiting review', body: 'Mohammed Abdul Samad: knee flexion (home session).', at: at(-1, '20:00'), read: false },
  { id: 'n7', audience: 'physio', kind: 'appointment', title: 'Cancelled appointment', body: 'Sunita Patil cancelled the 3:30 PM reassessment.', at: at(0, '08:45'), read: false },
  { id: 'n8', audience: 'all', kind: 'announcement', title: 'Clinic closed Sunday', body: 'GearPhys Pune will be closed this Sunday for maintenance.', at: at(-2, '09:00'), read: true },
]

const requests: PatientRequest[] = [
  { id: 'rq1', patientId: 'p1', kind: 'History update', text: 'Started taking a new tablet for acidity (Pantoprazole 40 mg).', at: at(-1, '19:25'), status: 'open' },
  { id: 'rq2', patientId: 'p5', kind: 'Reschedule', text: 'Can I move Thursday session to Friday evening?', at: at(-1, '12:00'), status: 'open' },
  { id: 'rq3', patientId: 'p6', kind: 'Appointment request', text: 'Please book an extra session next week; I am travelling later.', at: at(0, '07:30'), status: 'open' },
]

const audit: AuditEntry[] = [
  { id: 'au1', at: at(0, '09:05'), who: 'Meera Nair', action: 'Marked Arjun Malhotra present (09:00)' },
  { id: 'au2', at: at(0, '08:40'), who: 'Meera Nair', action: 'Added Kabir Singh to the waiting list' },
  { id: 'au3', at: at(-1, '17:45'), who: 'Dr. Mohammed Abdul Rasheed', action: 'Approved motion analysis for Mohammed Abdul Samad (knee flexion 101°)' },
  { id: 'au4', at: at(-1, '16:20'), who: 'Rohit Kulkarni', action: 'Recorded payment ₹3,000 (UPI) for Fatima Sheikh' },
  { id: 'au5', at: at(-1, '14:00'), who: 'Meera Nair', action: 'Registered new patient Deepak Joshi and sent invite GP-4821' },
  { id: 'au6', at: at(-2, '11:10'), who: 'Dr. Karan Mehta', action: 'Finalised session note #12 for Sunita Patil' },
  { id: 'au7', at: at(-3, '10:00'), who: 'Rohit Kulkarni', action: 'Changed receptionist permissions: billing view enabled' },
]

const drafts: DraftNote[] = [
  { id: 'dr1', patientId: 'p1', kind: 'SOAP note', at: at(-4, '11:40'), status: 'approved', signedBy: 'Dr. Mohammed Abdul Rasheed', shared: false,
    text: 'S: Patient reports reduced pain (4/10 before, 2/10 after). Able to climb stairs with rail.\nO: Right knee flexion 101° (AI estimate, therapist-approved). Extension -3°. Mild effusion.\nA: Progressing as expected post right TKR; flexion goal 110° approaching.\nP: Continue strengthening, add mini squats; reassess in 1 week.' },
]

drafts.push({
  id: 'dr2', patientId: 'p1', kind: 'Progress report', at: at(-4, '12:00'), status: 'approved', signedBy: 'Dr. Mohammed Abdul Rasheed', shared: true,
  text: 'Abdul, you are progressing well after your knee replacement.\n• Your knee now bends to about 101° (it was 62° at the start). Our goal is 110°.\n• Pain before treatment has come down from 8/10 to 4/10.\n• You are doing about 8 out of 10 of your home exercises. Keep this up.\nNext: we will add mini squats and test your stairs together in clinic.',
})

const announcements: Announcement[] = [
  { id: 'an1', title: 'Clinic closed Sunday', body: 'GearPhys Pune will be closed this Sunday for maintenance.', at: at(-2, '09:00') },
  { id: 'an2', title: 'New: AI Motion Analysis', body: 'Physios can now capture knee, shoulder, hip and elbow range of motion using the webcam.', at: at(-9, '10:00') },
]

const leaves: Leave[] = [{ id: 'lv1', staffId: 's2', date: d(3), reason: 'Conference' }]
const charges: Charge[] = [
  { id: 'ch1', patientId: 'p5', date: d(-8), desc: 'Kinesiology tape supply', amount: 300 },
  { id: 'ch2', patientId: 'p4', date: d(-10), desc: 'Extra assessment session', amount: 1200 },
]
const fees: FeeSchedule = { consultation: 800, session: 1200 }
const problems: Record<string, string[]> = {
  p1: ['Restricted range of motion', 'Muscle weakness', 'Functional limitation', 'Gait abnormality'],
  p2: ['Muscle weakness', 'Balance deficit'], p3: ['Muscle weakness', 'Balance deficit', 'Gait abnormality', 'Functional limitation'],
  p4: ['Pain-related limitation', 'Functional limitation'], p5: ['Pain-related limitation', 'Restricted range of motion'], p6: ['Balance deficit', 'Reduced endurance'],
}

export function buildSeed(): DB {
  return {
    seededOn: todayISO(), staff, patients, appointments, waiting, packages, payments, assessments, goals, plans,
    sessions: sessionNotes, assignments, logs, checkins, outcomes, motions, messages, notices, requests, audit, drafts, announcements,
    leaves, charges, fees, problems,
  }
}
