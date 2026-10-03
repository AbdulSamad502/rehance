import type { DB } from '../data/seed'
import type { Appointment, Assignment, MotionResult, Patient } from '../types'
import { addDays, daysFromToday, todayISO } from './utils'

export const therapistName = (db: DB, id: string) => db.staff.find((s) => s.id === id)?.name ?? 'Unassigned'
export const patientById = (db: DB, id: string) => db.patients.find((p) => p.id === id)

export function packageSummary(db: DB, patientId: string) {
  const pkg = db.packages.find((p) => p.patientId === patientId)
  const pays = db.payments.filter((p) => p.patientId === patientId)
  const paid = pays.reduce((s, p) => s + (p.kind === 'Refund' ? -Math.abs(p.amount) : p.amount), 0)
  const extra = db.charges.filter((c) => c.patientId === patientId).reduce((s, c) => s + c.amount, 0)
  const total = pkg ? pkg.totalFees - pkg.discount + extra : extra
  const used = db.appointments.filter((a) => a.patientId === patientId && a.status === 'Completed').length
  const lastPay = [...pays].sort((a, b) => b.date.localeCompare(a.date))[0]
  return {
    pkg, paid, total, extra, outstanding: Math.max(0, total - paid), used,
    remaining: pkg ? Math.max(0, pkg.sessionsTotal - used) : 0,
    sessionsTotal: pkg?.sessionsTotal ?? 0, lastPay,
    overdue: total - paid > 0 && !!lastPay && lastPay.date < daysFromToday(-14),
  }
}

export const activeAssignments = (db: DB, patientId: string): Assignment[] =>
  db.assignments.filter((a) => a.patientId === patientId && a.status === 'Active')

/** Share of expected exercise logs completed over the last `days` days (0-100). */
export function adherence(db: DB, patientId: string, days = 7) {
  const act = activeAssignments(db, patientId)
  if (!act.length) return null
  const from = daysFromToday(-(days - 1))
  const done = new Set(db.logs.filter((l) => l.patientId === patientId && l.date >= from).map((l) => `${l.assignmentId}|${l.date}`)).size
  return Math.min(100, Math.round((done / (act.length * days)) * 100))
}

export function daysSinceLastLog(db: DB, patientId: string) {
  const last = db.logs.filter((l) => l.patientId === patientId).map((l) => l.date).sort().pop()
  if (!last) return null
  return Math.round((new Date(todayISO()).getTime() - new Date(last).getTime()) / 86400000)
}

export const todaysTasks = (db: DB, patientId: string) => {
  const today = todayISO()
  return activeAssignments(db, patientId).map((a) => ({ a, done: db.logs.some((l) => l.assignmentId === a.id && l.date === today) }))
}

export const apptsOf = (db: DB, patientId: string) => db.appointments.filter((a) => a.patientId === patientId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

export const nextAppt = (db: DB, patientId: string): Appointment | undefined => {
  const nowKey = todayISO() + new Date().toTimeString().slice(0, 5)
  return apptsOf(db, patientId).find((a) => !['Cancelled', 'No-show', 'Rescheduled', 'Completed'].includes(a.status) && a.date + a.time >= nowKey.slice(0, 10) + '00:00')
}

export const motionsOf = (db: DB, patientId: string, onlyApproved = false): MotionResult[] =>
  db.motions.filter((m) => m.patientId === patientId && (!onlyApproved || (m.status === 'approved' && m.visibleToPatient))).sort((a, b) => a.at.localeCompare(b.at))

export const sessionNumber = (db: DB, patientId: string) => db.sessions.filter((s) => s.patientId === patientId).length

export function clinicKpis(db: DB) {
  const today = todayISO()
  const todays = db.appointments.filter((a) => a.date === today)
  const upcoming = db.appointments.filter((a) => a.date > today && !['Cancelled', 'Rescheduled'].includes(a.status))
  const totalOutstanding = db.patients.reduce((s, p) => s + packageSummary(db, p.id).outstanding, 0)
  const collectionsToday = db.payments.filter((p) => p.date === today && p.kind !== 'Refund').reduce((s, p) => s + p.amount, 0)
  const weekAgo = addDays(today, -7)
  return {
    totalPatients: db.patients.length,
    activePatients: db.patients.filter((p) => p.status === 'active').length,
    todays, upcoming,
    attended: todays.filter((a) => a.attendance === 'present' || a.status === 'Completed').length,
    absent: todays.filter((a) => a.status === 'No-show').length,
    cancelled: todays.filter((a) => a.status === 'Cancelled' || a.status === 'Rescheduled').length,
    totalOutstanding, collectionsToday,
    newRegistrations: db.patients.filter((p) => p.registeredAt >= weekAgo).length,
    sessionsCompleted: db.appointments.filter((a) => a.status === 'Completed').length,
    sessionsScheduled: db.appointments.filter((a) => ['Scheduled', 'Confirmed'].includes(a.status)).length,
  }
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export const onLeave = (db: DB, staffId: string, date: string) => db.leaves.some((l) => l.staffId === staffId && l.date === date)

/** Why a therapist cannot take an appointment at this date/time, or null if they can. */
export function unavailableReason(db: DB, staffId: string, date: string, time: string, duration: number): string | null {
  const s = db.staff.find((x) => x.id === staffId)
  if (!s) return null
  if (onLeave(db, staffId, date)) return `${s.name} is on leave on ${date}.`
  const dow = new Date(date + 'T12:00:00').getDay()
  if (!s.workDays.includes(dow)) return `${s.name} does not work on this day.`
  if (toMin(time) < toMin(s.start) || toMin(time) + duration > toMin(s.end)) return `Outside ${s.name}'s hours (${s.start} to ${s.end}).`
  return null
}

/** Free start times for a therapist on a date, on a 30-minute grid, within working hours. */
export function availableSlots(db: DB, staffId: string, date: string, duration = 45): string[] {
  const s = db.staff.find((x) => x.id === staffId)
  if (!s) return []
  const out: string[] = []
  const nowKey = todayISO()
  for (let m = toMin(s.start); m + duration <= toMin(s.end); m += 30) {
    const t = fromMin(m)
    if (unavailableReason(db, staffId, date, t, duration)) continue
    if (date === nowKey && m < new Date().getHours() * 60 + new Date().getMinutes()) continue
    const clash = db.appointments.some((a) => a.therapistId === staffId && a.date === date && !['Cancelled', 'Rescheduled', 'No-show'].includes(a.status) && toMin(a.time) < m + duration && m < toMin(a.time) + a.duration)
    if (!clash) out.push(t)
  }
  return out
}

export const lastName = (p: Patient) => p.name.split(' ').slice(-1)[0]
export const firstName = (p: Patient) => p.name.split(' ')[0]
