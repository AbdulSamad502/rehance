import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildSeed, type DB } from '../data/seed'
import type {
  Appointment, ApptStatus, Assessment, Assignment, Charge, CheckIn, DraftNote, ExerciseLog, FeeSchedule, Goal, MedicalHistory, MotionResult,
  Notice, OutcomeScore, Package, Patient, PatientRequest, Payment, PhysioRole, SessionNote, Staff, TreatmentPlan,
} from '../types'
import { unavailableReason } from '../lib/derive'
import { fmtDate, fmtTime, todayISO, uid } from '../lib/utils'

// Bump when the seed data or its shape changes, so cached demo data is replaced on next visit.
export const STORE_KEY = 'gearphys-demo-v4'

export interface UI {
  physioRole: PhysioRole
  patientId: string | null
  clinic: string
  tourOpen: boolean
  tourStep: number
}

const defaultUI: UI = { physioRole: 'physio', patientId: null, clinic: 'GearPhys Pune (Main)', tourOpen: false, tourStep: 0 }

// Session state (role, logged-in patient) lives per browser tab, so a physio tab and a
// patient tab can run side by side while sharing the same clinic data.
const UI_KEY = 'gearphys-session'
function loadUI(): UI {
  try {
    const raw = sessionStorage.getItem(UI_KEY)
    if (raw) return { ...defaultUI, ...JSON.parse(raw), tourOpen: false }
  } catch { /* storage unavailable */ }
  return defaultUI
}

export const ACTORS: Record<PhysioRole, string> = {
  owner: 'Rohit Kulkarni (Owner)',
  receptionist: 'Meera Nair (Reception)',
  physio: 'Dr. Ananya Rao',
}

interface Actions {
  reset: () => void
  setPhysioRole: (r: PhysioRole) => void
  setClinic: (c: string) => void
  setPatientId: (id: string | null) => void
  setTour: (open: boolean, step?: number) => void
  addAudit: (action: string, who?: string) => void

  addPatient: (p: Omit<Patient, 'id' | 'code' | 'invite' | 'history' | 'tint' | 'registeredAt' | 'episodeStart'> & { pkg?: { name: string; fees: number; sessions: number }; sendInvite?: boolean }) => Patient
  updatePatient: (id: string, patch: Partial<Patient>) => void
  updateHistory: (id: string, patch: Partial<MedicalHistory>, source?: string) => void
  sendInvite: (id: string) => string
  acceptInvite: (code: string) => Patient | null
  dischargePatient: (id: string) => void

  bookAppointment: (a: Omit<Appointment, 'id'>) => { ok: boolean; error?: string; id?: string }
  updateAppointment: (id: string, patch: Partial<Appointment>) => { ok: boolean; error?: string }
  setApptStatus: (id: string, status: ApptStatus, remark?: string) => void
  markAttendance: (id: string, a: 'present' | 'absent', remark?: string) => void
  findConflict: (therapistId: string, date: string, time: string, duration: number, exceptId?: string) => Appointment | undefined
  addWaiting: (name: string, phone: string, reason: string) => void
  removeWaiting: (id: string) => void

  addPayment: (p: Omit<Payment, 'id' | 'receiptNo'>) => Payment
  setPackage: (p: Package) => void

  saveAssessment: (a: Omit<Assessment, 'id'> & { id?: string }) => string
  addGoal: (g: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  savePlan: (p: TreatmentPlan) => void
  addSessionNote: (n: Omit<SessionNote, 'id'>) => void
  toggleSessionShared: (id: string) => void
  addOutcome: (o: Omit<OutcomeScore, 'id'>) => void

  assignExercise: (a: Omit<Assignment, 'id' | 'status'>) => void
  setAssignmentStatus: (id: string, status: Assignment['status']) => void
  logExercise: (l: Omit<ExerciseLog, 'id'>) => void
  submitCheckIn: (c: Omit<CheckIn, 'id' | 'reviewed' | 'at'>) => void
  reviewCheckIn: (id: string, reply?: string) => void

  addMotion: (m: Omit<MotionResult, 'id'>) => string
  reviewMotion: (id: string, patch: Partial<MotionResult>) => void

  sendMessage: (patientId: string, from: 'patient' | 'clinic' | 'companion', text: string) => void
  addNotice: (n: Omit<Notice, 'id' | 'at' | 'read'>) => void
  markNoticeRead: (id: string) => void
  markAllRead: (audience: 'physio' | 'patient', patientId?: string) => void
  addRequest: (r: Omit<PatientRequest, 'id' | 'at' | 'status'>) => void
  resolveRequest: (id: string) => void
  addDraft: (d: Omit<DraftNote, 'id' | 'at' | 'status'>) => string
  updateDraft: (id: string, patch: Partial<DraftNote>) => void
  addAnnouncement: (title: string, body: string) => void
  setStaffActive: (id: string, active: boolean) => void
  addStaff: (s: Omit<Staff, 'id' | 'verified' | 'active' | 'workDays' | 'start' | 'end'> & Partial<Pick<Staff, 'workDays' | 'start' | 'end'>>) => void
  updateStaff: (id: string, patch: Partial<Staff>) => void
  verifyStaff: (id: string) => void
  addLeave: (staffId: string, date: string, reason: string) => void
  removeLeave: (id: string) => void
  addCharge: (c: Omit<Charge, 'id'>) => void
  setFees: (f: FeeSchedule) => void
  setProblems: (patientId: string, list: string[]) => void
  updateAssignment: (id: string, patch: Partial<Assignment>) => void
}

export type Store = DB & { ui: UI } & Actions

const now = () => new Date().toISOString()
const patientName = (s: DB, id: string) => s.patients.find((p) => p.id === id)?.name ?? 'Patient'

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const actor = () => ACTORS[get().ui.physioRole]
      const pushAudit = (s: DB, action: string, who: string) => [{ id: uid('au'), at: now(), who, action }, ...s.audit].slice(0, 80)
      const pushNotice = (s: DB, n: Omit<Notice, 'id' | 'at' | 'read'>) => [{ ...n, id: uid('n'), at: now(), read: false }, ...s.notices].slice(0, 120)

      return {
        ...buildSeed(),
        ui: loadUI(),

        reset: () => set((s) => ({ ...buildSeed(), ui: { ...defaultUI, physioRole: s.ui.physioRole, patientId: s.ui.patientId, tourOpen: false } })),
        setPhysioRole: (r) => set((s) => ({ ui: { ...s.ui, physioRole: r } })),
        setClinic: (c) => set((s) => ({ ui: { ...s.ui, clinic: c } })),
        setPatientId: (id) => set((s) => ({ ui: { ...s.ui, patientId: id } })),
        setTour: (open, step) => set((s) => ({ ui: { ...s.ui, tourOpen: open, tourStep: step ?? (open ? s.ui.tourStep : 0) } })),
        addAudit: (action, who) => set((s) => ({ audit: pushAudit(s, action, who ?? actor()) })),

        addPatient: (input) => {
          const s = get()
          const n = s.patients.length
          const { pkg, sendInvite, ...rest } = input
          const patient: Patient = {
            ...rest,
            id: `p${n + 1}${Math.random().toString(36).slice(2, 4)}`,
            code: `GP-${1001 + n}`,
            registeredAt: todayISO(),
            episodeStart: todayISO(),
            invite: sendInvite ? { code: `GP-${Math.floor(1000 + Math.random() * 9000)}`, status: 'sent' } : { code: '', status: 'none' },
            tint: ['#2a80d2', '#14a3a8', '#7c5cd6', '#e07a3f', '#d6568a', '#3a9d6b'][n % 6],
            history: {
              diabetes: { has: false }, cardiac: { has: false }, stroke: { has: false }, hypertension: false,
              surgeries: 'None', injuries: 'None', neuro: 'None', msk: 'None', medications: 'None', allergies: 'No known allergies',
              imaging: 'None', previousPhysio: 'None', redFlags: 'None identified', contraindications: 'None', notes: '',
              source: 'Registration desk', updatedAt: todayISO(),
            },
          }
          set((st) => ({
            patients: [patient, ...st.patients],
            packages: pkg ? [...st.packages, { patientId: patient.id, name: pkg.name, totalFees: pkg.fees, discount: 0, sessionsTotal: pkg.sessions }] : st.packages,
            audit: pushAudit(st, `Registered new patient ${patient.name} (${patient.code})${sendInvite ? ` and sent invite ${patient.invite.code}` : ''}`, actor()),
          }))
          return patient
        },
        updatePatient: (id, patch) => set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          audit: pushAudit(s, `Updated profile of ${patientName(s, id)}`, actor()),
        })),
        updateHistory: (id, patch, source) => set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, history: { ...p.history, ...patch, updatedAt: todayISO(), source: source ?? 'Therapist entry' } } : p)),
          audit: pushAudit(s, `Updated medical history of ${patientName(s, id)}`, actor()),
        })),
        sendInvite: (id) => {
          const code = `GP-${Math.floor(1000 + Math.random() * 9000)}`
          set((s) => ({
            patients: s.patients.map((p) => (p.id === id ? { ...p, invite: { code, status: 'sent' } } : p)),
            audit: pushAudit(s, `Sent app invite ${code} to ${patientName(s, id)}`, actor()),
          }))
          return code
        },
        acceptInvite: (code) => {
          const c = code.trim().toUpperCase()
          const p = get().patients.find((x) => x.invite.code.toUpperCase() === c && x.invite.status !== 'none')
          if (!p) return null
          set((s) => ({
            patients: s.patients.map((x) => (x.id === p.id ? { ...x, invite: { ...x.invite, status: 'accepted' } } : x)),
            notices: pushNotice(s, { audience: 'physio', kind: 'alert', title: 'Patient joined GearPhys', body: `${p.name} accepted the invite and created their account.` }),
            audit: pushAudit(s, `${p.name} accepted app invite ${p.invite.code}`, p.name),
            ui: { ...s.ui, patientId: p.id },
          }))
          return get().patients.find((x) => x.id === p.id)!
        },
        dischargePatient: (id) => set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, status: 'discharged' } : p)),
          notices: pushNotice(s, { audience: 'patient', patientId: id, kind: 'recovery', title: 'Discharge summary available', body: 'Your therapist has completed your discharge. See Reports.' }),
          audit: pushAudit(s, `Discharged ${patientName(s, id)} and closed the rehabilitation episode`, actor()),
        })),

        findConflict: (therapistId, date, time, duration, exceptId) => {
          const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
          const a0 = toMin(time), a1 = a0 + duration
          return get().appointments.find((x) =>
            x.id !== exceptId && x.therapistId === therapistId && x.date === date && !['Cancelled', 'Rescheduled', 'No-show'].includes(x.status)
            && toMin(x.time) < a1 && a0 < toMin(x.time) + x.duration)
        },
        bookAppointment: (a) => {
          const why = a.walkIn ? null : unavailableReason(get(), a.therapistId, a.date, a.time, a.duration)
          if (why) return { ok: false, error: why }
          const c = get().findConflict(a.therapistId, a.date, a.time, a.duration)
          if (c) return { ok: false, error: `Conflict: ${get().staff.find((t) => t.id === a.therapistId)?.name} already has ${patientName(get(), c.patientId)} at ${fmtTime(c.time)}.` }
          const id = uid('ap')
          set((s) => ({
            appointments: [...s.appointments, { ...a, id }],
            notices: pushNotice(s, { audience: 'patient', patientId: a.patientId, kind: 'appointment', title: 'Appointment booked', body: `${a.type} on ${fmtDate(a.date)} at ${fmtTime(a.time)}.` }),
            audit: pushAudit(s, `Booked ${a.type} for ${patientName(s, a.patientId)} on ${fmtDate(a.date)} ${fmtTime(a.time)}`, actor()),
          }))
          return { ok: true, id }
        },
        updateAppointment: (id, patch) => {
          const cur = get().appointments.find((x) => x.id === id)
          if (!cur) return { ok: false, error: 'Not found' }
          const next = { ...cur, ...patch }
          const moved = next.therapistId !== cur.therapistId || next.date !== cur.date || next.time !== cur.time
          const why = moved ? unavailableReason(get(), next.therapistId, next.date, next.time, next.duration) : null
          if (why) return { ok: false, error: why }
          const c = get().findConflict(next.therapistId, next.date, next.time, next.duration, id)
          if (c) return { ok: false, error: `Conflict with ${patientName(get(), c.patientId)} at ${fmtTime(c.time)}.` }
          set((s) => ({
            appointments: s.appointments.map((x) => (x.id === id ? next : x)),
            notices: patch.date || patch.time ? pushNotice(s, { audience: 'patient', patientId: cur.patientId, kind: 'appointment', title: 'Appointment rescheduled', body: `Now on ${fmtDate(next.date)} at ${fmtTime(next.time)}.` }) : s.notices,
            audit: pushAudit(s, `Updated appointment of ${patientName(s, cur.patientId)}`, actor()),
          }))
          return { ok: true }
        },
        setApptStatus: (id, status, remark) => set((s) => {
          const a = s.appointments.find((x) => x.id === id)
          if (!a) return {}
          const attendance = status === 'Completed' ? 'present' : status === 'No-show' ? 'absent' : a.attendance
          return {
            appointments: s.appointments.map((x) => (x.id === id ? { ...x, status, attendance, absenceRemark: remark ?? x.absenceRemark } : x)),
            notices: status === 'Cancelled' ? pushNotice(s, { audience: 'patient', patientId: a.patientId, kind: 'appointment', title: 'Appointment cancelled', body: `Your ${a.type} on ${fmtDate(a.date)} was cancelled.` }) : s.notices,
            audit: pushAudit(s, `Set ${patientName(s, a.patientId)} ${fmtTime(a.time)} to "${status}"`, actor()),
          }
        }),
        markAttendance: (id, att, remark) => set((s) => {
          const a = s.appointments.find((x) => x.id === id)
          if (!a) return {}
          return {
            appointments: s.appointments.map((x) => (x.id === id ? { ...x, attendance: att, absenceRemark: remark, status: att === 'present' ? (x.status === 'Completed' ? 'Completed' : 'Checked in') : 'No-show' } : x)),
            audit: pushAudit(s, `Marked ${patientName(s, a.patientId)} ${att}`, actor()),
          }
        }),
        addWaiting: (name, phone, reason) => set((s) => ({ waiting: [{ id: uid('w'), name, phone, reason, since: now() }, ...s.waiting], audit: pushAudit(s, `Added ${name} to the waiting list`, actor()) })),
        removeWaiting: (id) => set((s) => ({ waiting: s.waiting.filter((w) => w.id !== id) })),

        addPayment: (p) => {
          const pay: Payment = { ...p, id: uid('pay'), receiptNo: `RC-${2400 + get().payments.length + 1}` }
          set((s) => ({
            payments: [pay, ...s.payments],
            audit: pushAudit(s, `Recorded ${pay.kind.toLowerCase()} of ₹${Math.abs(pay.amount)} (${pay.method}) for ${patientName(s, pay.patientId)}`, actor()),
            notices: pushNotice(s, { audience: 'patient', patientId: pay.patientId, kind: 'payment', title: 'Payment received', body: `₹${Math.abs(pay.amount)} via ${pay.method}. Receipt ${pay.receiptNo}.` }),
          }))
          return pay
        },
        setPackage: (p) => set((s) => ({ packages: s.packages.some((x) => x.patientId === p.patientId) ? s.packages.map((x) => (x.patientId === p.patientId ? p : x)) : [...s.packages, p] })),

        saveAssessment: (a) => {
          const id = a.id ?? uid('as')
          set((s) => ({
            assessments: s.assessments.some((x) => x.id === id) ? s.assessments.map((x) => (x.id === id ? { ...x, ...a, id } : x)) : [{ ...a, id } as Assessment, ...s.assessments],
            audit: pushAudit(s, `${a.status === 'final' ? 'Finalised' : 'Saved draft'} ${a.kind} assessment for ${patientName(s, a.patientId)}`, actor()),
          }))
          return id
        },
        addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid('g') }] })),
        updateGoal: (id, patch) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
        savePlan: (p) => set((s) => ({
          plans: s.plans.some((x) => x.patientId === p.patientId) ? s.plans.map((x) => (x.patientId === p.patientId ? p : x)) : [...s.plans, p],
          notices: p.shared ? pushNotice(s, { audience: 'patient', patientId: p.patientId, kind: 'recovery', title: 'Treatment plan updated', body: 'Your therapist updated your treatment plan.' }) : s.notices,
          audit: pushAudit(s, `Updated treatment plan of ${patientName(s, p.patientId)}`, actor()),
        })),
        addSessionNote: (n) => set((s) => ({ sessions: [...s.sessions, { ...n, id: uid('sn') }], audit: pushAudit(s, `Documented session #${n.no} for ${patientName(s, n.patientId)}`, actor()) })),
        toggleSessionShared: (id) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, shared: !x.shared } : x)) })),
        addOutcome: (o) => set((s) => ({ outcomes: [...s.outcomes, { ...o, id: uid('oc') }] })),

        assignExercise: (a) => set((s) => ({
          assignments: [...s.assignments, { ...a, id: uid('asg'), status: 'Active' }],
          notices: pushNotice(s, { audience: 'patient', patientId: a.patientId, kind: 'exercise', title: 'New exercise assigned', body: 'Your therapist added an exercise to your programme.' }),
          audit: pushAudit(s, `Assigned exercise to ${patientName(s, a.patientId)}`, actor()),
        })),
        setAssignmentStatus: (id, status) => set((s) => ({ assignments: s.assignments.map((x) => (x.id === id ? { ...x, status } : x)) })),
        logExercise: (l) => set((s) => ({
          logs: [...s.logs, { ...l, id: uid('lg') }],
          notices: l.pain >= 7 ? pushNotice(s, { audience: 'physio', kind: 'alert', title: 'High pain reported after exercise', body: `${patientName(s, l.patientId)} reported pain ${l.pain}/10.` }) : s.notices,
        })),
        submitCheckIn: (c) => set((s) => ({
          checkins: [{ ...c, id: uid('ci'), at: now(), reviewed: false }, ...s.checkins],
          notices: pushNotice(s, { audience: 'physio', kind: 'alert', title: `Symptom check-in: pain ${c.pain}/10`, body: `${patientName(s, c.patientId)}: ${c.newSymptoms || c.location}` }),
        })),
        reviewCheckIn: (id, reply) => set((s) => {
          const c = s.checkins.find((x) => x.id === id)
          return {
            checkins: s.checkins.map((x) => (x.id === id ? { ...x, reviewed: true, reply } : x)),
            notices: c && reply ? pushNotice(s, { audience: 'patient', patientId: c.patientId, kind: 'recovery', title: 'Therapist replied to your check-in', body: reply }) : s.notices,
            audit: pushAudit(s, `Reviewed symptom check-in of ${c ? patientName(s, c.patientId) : ''}`, actor()),
          }
        }),

        addMotion: (m) => {
          const id = uid('m')
          set((s) => ({
            motions: [{ ...m, id }, ...s.motions],
            notices: m.status === 'pending' ? pushNotice(s, { audience: 'physio', kind: 'ai', title: 'Motion analysis awaiting review', body: `${patientName(s, m.patientId)}: ${m.movementLabel} (${m.source}).` }) : s.notices,
          }))
          return id
        },
        reviewMotion: (id, patch) => set((s) => {
          const m = s.motions.find((x) => x.id === id)
          if (!m) return {}
          const next = { ...m, ...patch, reviewedBy: actor() }
          const approved = patch.status === 'approved'
          return {
            motions: s.motions.map((x) => (x.id === id ? next : x)),
            notices: approved && next.visibleToPatient
              ? pushNotice(s, { audience: 'patient', patientId: m.patientId, kind: 'recovery', title: 'New approved movement feedback', body: `${m.movementLabel}: ${next.headline}${m.unit}. Tap to view your progress.` })
              : s.notices,
            audit: pushAudit(s, `${patch.status === 'approved' ? 'Approved' : patch.status === 'rejected' ? 'Rejected' : 'Flagged for repeat'} motion analysis for ${patientName(s, m.patientId)} (${m.movementLabel})`, actor()),
          }
        }),

        sendMessage: (patientId, from, text) => set((s) => ({
          messages: [...s.messages, { id: uid('ms'), patientId, from, text, at: now() }],
          notices: from === 'clinic' ? pushNotice(s, { audience: 'patient', patientId, kind: 'recovery', title: 'New message from your clinic', body: text })
            : from === 'patient' ? pushNotice(s, { audience: 'physio', kind: 'alert', title: `Message from ${patientName(s, patientId)}`, body: text }) : s.notices,
        })),
        addNotice: (n) => set((s) => ({ notices: pushNotice(s, n) })),
        markNoticeRead: (id) => set((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllRead: (aud, patientId) => set((s) => ({ notices: s.notices.map((n) => ((n.audience === aud || n.audience === 'all') && (!patientId || !n.patientId || n.patientId === patientId) ? { ...n, read: true } : n)) })),
        addRequest: (r) => set((s) => ({
          requests: [{ ...r, id: uid('rq'), at: now(), status: 'open' }, ...s.requests],
          notices: pushNotice(s, { audience: 'physio', kind: 'alert', title: `${r.kind} request`, body: `${patientName(s, r.patientId)}: ${r.text}` }),
        })),
        resolveRequest: (id) => set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status: 'done' } : r)), audit: pushAudit(s, 'Resolved a patient request', actor()) })),
        addDraft: (d) => {
          const id = uid('dr')
          set((s) => ({ drafts: [{ ...d, id, at: now(), status: 'draft' }, ...s.drafts] }))
          return id
        },
        updateDraft: (id, patch) => set((s) => ({
          drafts: s.drafts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          audit: patch.status === 'approved' ? pushAudit(s, 'Approved an AI-assisted draft note', actor()) : s.audit,
        })),
        addAnnouncement: (title, body) => set((s) => ({
          announcements: [{ id: uid('an'), title, body, at: now() }, ...s.announcements],
          notices: pushNotice(s, { audience: 'all', kind: 'announcement', title, body }),
          audit: pushAudit(s, `Published announcement "${title}"`, actor()),
        })),
        setStaffActive: (id, active) => set((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, active } : x)), audit: pushAudit(s, `${active ? 'Activated' : 'Deactivated'} staff account ${s.staff.find((x) => x.id === id)?.name}`, actor()) })),
        addStaff: (st) => set((s) => ({ staff: [...s.staff, { workDays: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', ...st, id: uid('s'), verified: false, active: true }], audit: pushAudit(s, `Created staff account for ${st.name}`, actor()) })),
        updateStaff: (id, patch) => set((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, ...patch } : x)), audit: pushAudit(s, `Updated staff profile of ${s.staff.find((x) => x.id === id)?.name}`, actor()) })),
        verifyStaff: (id) => set((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, verified: true } : x)), audit: pushAudit(s, `Verified professional credentials of ${s.staff.find((x) => x.id === id)?.name}`, actor()) })),
        addLeave: (staffId, date, reason) => set((s) => ({ leaves: [...s.leaves, { id: uid('lv'), staffId, date, reason }], audit: pushAudit(s, `Marked ${s.staff.find((x) => x.id === staffId)?.name} unavailable on ${fmtDate(date)}`, actor()) })),
        removeLeave: (id) => set((s) => ({ leaves: s.leaves.filter((l) => l.id !== id) })),
        addCharge: (c) => set((s) => ({
          charges: [...s.charges, { ...c, id: uid('ch') }],
          audit: pushAudit(s, `Added charge "${c.desc}" ₹${c.amount} for ${patientName(s, c.patientId)}`, actor()),
        })),
        setFees: (f) => set((s) => ({ fees: f, audit: pushAudit(s, 'Updated the fee schedule', actor()) })),
        setProblems: (patientId, list) => set((s) => ({ problems: { ...s.problems, [patientId]: list } })),
        updateAssignment: (id, patch) => set((s) => ({
          assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          notices: pushNotice(s, { audience: 'patient', patientId: s.assignments.find((x) => x.id === id)?.patientId, kind: 'exercise', title: 'Exercise plan updated', body: 'Your therapist adjusted one of your exercises.' }),
        })),
      }
    },
    {
      name: STORE_KEY,
      version: 2,
      partialize: (s) => {
        const keys = Object.keys(buildSeed()) as (keyof DB)[]
        const out: Record<string, unknown> = {}
        for (const k of keys) out[k] = s[k]
        return out as never
      },
    },
  ),
)

// Keep two browser tabs (e.g. a physio tab and a patient tab) in sync.
if (typeof window !== 'undefined') {
  useStore.subscribe((s) => {
    try { sessionStorage.setItem(UI_KEY, JSON.stringify(s.ui)) } catch { /* ignore */ }
  })
  window.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY) void useStore.persist.rehydrate()
  })
}

/** Refresh the sample data once per day so "today" always looks current. */
export function ensureFreshSeed() {
  if (useStore.getState().seededOn !== todayISO()) useStore.getState().reset()
}
