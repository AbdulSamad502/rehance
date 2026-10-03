// Shared domain types. Everything is simulated data held in the browser.

export type PhysioRole = 'owner' | 'receptionist' | 'physio'

export interface Staff {
  id: string
  name: string
  role: 'Physiotherapist' | 'Senior Physiotherapist' | 'Receptionist' | 'Clinic Admin' | 'Orthopaedic Doctor'
  speciality: string
  verified: boolean
  active: boolean
  phone: string
  hours: string
  workDays: number[] // 0 = Sunday ... 6 = Saturday
  start: string // HH:mm
  end: string // HH:mm
}

export interface Leave { id: string; staffId: string; date: string; reason: string }
export interface Charge { id: string; patientId: string; date: string; desc: string; amount: number }
export interface FeeSchedule { consultation: number; session: number }

export interface MedicalHistory {
  diabetes: { has: boolean; type?: string; duration?: string; meds?: string; precautions?: string }
  cardiac: { has: boolean; condition?: string; treatment?: string; precautions?: string }
  stroke: { has: boolean; date?: string; side?: string; residual?: string; precautions?: string }
  hypertension: boolean
  surgeries: string
  injuries: string
  neuro: string
  msk: string
  medications: string
  allergies: string
  imaging: string
  previousPhysio: string
  redFlags: string
  contraindications: string
  notes: string
  source: string
  updatedAt: string
}

export type PatientStatus = 'active' | 'inactive' | 'discharged'

export interface Patient {
  id: string
  code: string // e.g. GP-1001
  name: string
  age: number
  dob?: string
  sex: 'Female' | 'Male' | 'Other'
  phone: string
  email: string
  address: string
  emergency: string
  referral: string
  registeredAt: string
  therapistId: string
  location: string
  status: PatientStatus
  condition: string
  region: string
  side: 'Left' | 'Right' | 'Both' | 'NA'
  episodeTitle: string
  episodeStart: string
  adminRemarks: string
  invite: { code: string; status: 'none' | 'sent' | 'accepted' }
  history: MedicalHistory
  tint: string
}

export type ApptStatus =
  | 'Scheduled' | 'Confirmed' | 'Checked in' | 'In progress'
  | 'Completed' | 'Cancelled' | 'Rescheduled' | 'No-show'
export type ApptType =
  | 'Initial consultation' | 'Follow-up session' | 'Reassessment'
  | 'Rehabilitation session' | 'Discharge appointment'

export interface Appointment {
  id: string
  patientId: string
  therapistId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  duration: number
  type: ApptType
  status: ApptStatus
  mode: 'In-clinic' | 'Online'
  attendance?: 'present' | 'absent'
  absenceRemark?: string
  walkIn?: boolean
}

export interface WaitingEntry { id: string; name: string; phone: string; reason: string; since: string }

export interface Package {
  patientId: string
  name: string
  totalFees: number
  discount: number
  sessionsTotal: number
}

export type PayMethod = 'Cash' | 'UPI' | 'Card' | 'Bank transfer' | 'Other'
export interface Payment {
  id: string
  patientId: string
  date: string
  amount: number
  method: PayMethod
  receiptNo: string
  kind: 'Payment' | 'Refund' | 'Adjustment'
  note?: string
}

export type AssessmentKind = 'general' | 'clinical' | 'ortho' | 'neuro'
export interface Assessment {
  id: string
  patientId: string
  kind: AssessmentKind
  region?: string
  date: string
  therapistId: string
  data: Record<string, string>
  status: 'draft' | 'final'
}

export interface Goal {
  id: string
  patientId: string
  kind: 'Short-term' | 'Long-term' | 'Functional' | 'Pain' | 'ROM' | 'Strength' | 'Mobility'
  text: string
  target: string
  progress: number // 0-100
  status: 'Active' | 'Achieved' | 'Modified'
}

export interface TreatmentPlan {
  patientId: string
  summary: string
  frequency: string
  sessionDuration: string
  modes: string[]
  precautions: string
  education: string
  reviewDate: string
  reassessEvery: string
  shared: boolean // visible to patient
}

export interface SessionNote {
  id: string
  patientId: string
  no: number
  date: string
  therapistId: string
  painBefore: number
  painAfter: number
  subjective: string
  objective: string
  treatment: string[]
  dosage: string
  tolerance: string
  adverse: string
  notes: string
  nextPlan: string
  shared: boolean
}

export interface ExerciseDef {
  id: string
  name: string
  category: string
  region: string
  difficulty: 'Easy' | 'Moderate' | 'Hard'
  equipment: string
  instructions: string
  precautions: string
  sets: number
  reps: number
  holdSec: number
  movementId?: string // camera trackable?
  emoji: string
}

export interface Assignment {
  id: string
  patientId: string
  exerciseId: string
  sets: number
  reps: number
  frequency: string
  notes: string
  start: string
  review: string
  status: 'Active' | 'Discontinued'
}

export interface ExerciseLog {
  id: string
  patientId: string
  assignmentId: string
  date: string // YYYY-MM-DD
  time?: string // HH:mm completion time
  repsDone: number
  pain: number
  difficulty: 'Easy' | 'Just right' | 'Hard'
  camera: boolean
  formScore?: number
  bestAngle?: number
}

export interface CheckIn {
  id: string
  patientId: string
  at: string
  pain: number
  location: string
  swelling: 'None' | 'Mild' | 'Moderate' | 'Severe'
  difficulty: 'Easy' | 'Moderate' | 'Hard'
  exercisesDone: boolean
  newSymptoms: string
  remarks: string
  reviewed: boolean
  reply?: string
}

export interface OutcomeScore { id: string; patientId: string; measure: string; date: string; score: number }

export type MotionCategory = 'rom' | 'posture' | 'gait' | 'functional'
export interface RepResult { n: number; peak: number; min: number; durationMs: number; upMs: number; downMs: number; startMs?: number }
export interface MotionResult {
  id: string
  patientId: string
  at: string
  category: MotionCategory
  movementId: string
  movementLabel: string
  region: string
  side: 'Left' | 'Right' | 'Both' | 'NA'
  source: 'Webcam' | 'Video upload' | 'Simulated demo' | 'Patient home session'
  durationSec: number
  metricLabel: string // the headline measurement label
  headline: number // headline value (deg / sec / etc.)
  unit: string
  target?: number
  reps: RepResult[]
  peakLeft?: number
  peakRight?: number
  symmetry?: number // 0-100 (100 = perfectly symmetric)
  tempoSec?: number
  consistency?: number // 0-100
  quality: number // 0-100
  extra: { label: string; value: string; flag?: 'ok' | 'watch' | 'alert' }[]
  observations: string[]
  warnings: string[]
  series: number[] // downsampled primary signal (~10 Hz)
  seriesLabel: string
  status: 'pending' | 'approved' | 'rejected' | 'repeat'
  manualValue?: number
  annotation?: string
  reviewedBy?: string
  visibleToPatient: boolean
  isBaseline?: boolean
}

export interface Message { id: string; patientId: string; from: 'patient' | 'clinic' | 'companion'; text: string; at: string }

export interface Notice {
  id: string
  audience: 'physio' | 'patient' | 'all'
  patientId?: string
  kind: 'appointment' | 'exercise' | 'recovery' | 'payment' | 'alert' | 'announcement' | 'ai'
  title: string
  body: string
  at: string
  read: boolean
}

export interface PatientRequest {
  id: string
  patientId: string
  kind: 'History update' | 'Profile correction' | 'Reschedule' | 'Cancellation' | 'Appointment request' | 'Question' | 'Support'
  text: string
  at: string
  status: 'open' | 'done'
}

export interface AuditEntry { id: string; at: string; who: string; action: string }

export interface DraftNote { id: string; patientId: string; kind: string; at: string; text: string; status: 'draft' | 'approved'; shared?: boolean; signedBy?: string }

export interface Announcement { id: string; title: string; body: string; at: string }
