import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarPlus, ChevronLeft, ChevronRight, UserCheck, UserX } from 'lucide-react'
import { Bars } from '../../../components/charts'
import { Badge, Button, Card, Chip, Empty, Field, Input, Notice, PageHeader, ProgressBar, SectionTitle, Segmented, Select, Sheet, Tabs, toast } from '../../../components/ui'
import { APPT_STATUSES, APPT_TYPES } from '../../../data/catalog'
import { availableSlots, packageSummary, patientById, therapistName } from '../../../lib/derive'
import { addDays, fmtDate, fmtDateLong, fmtTime, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { Appointment, ApptStatus, ApptType } from '../../../types'
import { PatientChip, StatusBadge } from '../shared'

type Tab = 'calendar' | 'attendance' | 'waiting' | 'team'

export default function Schedule() {
  const db = useStore()
  const [sp, setSp] = useSearchParams()
  const [tab, setTab] = useState<Tab>('calendar')
  const [view, setView] = useState<'Day' | 'Week'>('Day')
  const [date, setDate] = useState(todayISO())
  const [therapist, setTherapist] = useState('all')
  const [detail, setDetail] = useState<string | null>(null)
  const [book, setBook] = useState<string | null | undefined>(undefined)
  useEffect(() => { const b = sp.get('book'); if (b) { setBook(b); setSp({}) } }, [sp, setSp])

  const weekStart = useMemo(() => { const d = new Date(date + 'T12:00:00'); const off = (d.getDay() + 6) % 7; return addDays(date, -off) }, [date])
  const days = view === 'Day' ? [date] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const forDay = (d: string) => db.appointments.filter((a) => a.date === d && (therapist === 'all' || a.therapistId === therapist)).sort((a, b) => a.time.localeCompare(b.time))
  const step = view === 'Day' ? 1 : 7

  return (
    <div className="fade-up">
      <PageHeader title="Schedule" subtitle="Appointments, attendance, waiting list and therapist availability" actions={<Button icon={<CalendarPlus size={16} />} onClick={() => setBook(null)}>Book</Button>} />
      <Tabs className="mb-4" tabs={[{ id: 'calendar', label: 'Calendar' }, { id: 'attendance', label: 'Attendance & packages' }, { id: 'waiting', label: 'Waiting list', badge: db.waiting.length }, { id: 'team', label: 'Therapists' }]} value={tab} onChange={setTab} />

      {tab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white" onClick={() => setDate(addDays(date, -step))} aria-label="Previous"><ChevronLeft size={17} /></button>
              <button className="h-9 rounded-lg border border-line bg-white px-3 text-sm font-semibold" onClick={() => setDate(todayISO())}>Today</button>
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white" onClick={() => setDate(addDays(date, step))} aria-label="Next"><ChevronRight size={17} /></button>
            </div>
            <div className="text-sm font-bold">{view === 'Day' ? fmtDateLong(date) : `${fmtDate(weekStart)} – ${fmtDate(addDays(weekStart, 6))}`}</div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-32"><Segmented options={['Day', 'Week'] as const} value={view} onChange={setView} /></div>
              <Select value={therapist} onChange={(e) => setTherapist(e.target.value)} className="!h-9 !w-auto !rounded-lg text-[13px]" aria-label="Therapist">
                <option value="all">All therapists</option>
                {db.staff.filter((s) => s.role.includes('Physio')).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          </div>

          {view === 'Day' ? (
            forDay(date).length === 0 ? <Empty icon="📅" title="No appointments" body="Nothing scheduled for this day." action={<Button onClick={() => setBook(null)}>Book an appointment</Button>} /> : (
              <Card pad={false} className="divide-y divide-line">
                {forDay(date).map((a) => <ApptRow key={a.id} a={a} onOpen={() => setDetail(a.id)} />)}
              </Card>
            )
          ) : (
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="grid min-w-[760px] grid-cols-7 gap-2">
                {days.map((d) => (
                  <div key={d} className={`rounded-2xl border p-2 ${d === todayISO() ? 'border-brand-300 bg-brand-50/50' : 'border-line bg-white'}`}>
                    <button onClick={() => { setDate(d); setView('Day') }} className="mb-2 block w-full text-left"><div className="text-[11px] font-semibold uppercase text-muted">{fmtDate(d, { weekday: 'short' })}</div><div className="text-lg font-extrabold">{fmtDate(d, { day: 'numeric' })}</div></button>
                    <div className="space-y-1.5">
                      {forDay(d).map((a) => (
                        <button key={a.id} onClick={() => setDetail(a.id)} className="block w-full rounded-lg bg-surface p-1.5 text-left text-[11px] leading-tight hover:bg-brand-50">
                          <div className="font-bold text-brand-700">{fmtTime(a.time)}</div>
                          <div className="truncate font-medium">{patientById(db, a.patientId)?.name.split(' ')[0]}</div>
                          <div className={`mt-0.5 h-1 rounded-full ${a.status === 'Cancelled' || a.status === 'No-show' ? 'bg-bad' : a.status === 'Completed' ? 'bg-ok' : 'bg-brand-300'}`} />
                        </button>
                      ))}
                      {forDay(d).length === 0 && <div className="py-3 text-center text-[11px] text-slate-300">–</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'attendance' && <Attendance onOpen={setDetail} />}
      {tab === 'waiting' && <Waiting onBook={() => setBook(null)} />}
      {tab === 'team' && <Team />}

      <ApptSheet id={detail} onClose={() => setDetail(null)} />
      <BookSheet open={book !== undefined} patientId={book ?? undefined} date={date} onClose={() => setBook(undefined)} />
    </div>
  )
}

function ApptRow({ a, onOpen }: { a: Appointment; onOpen: () => void }) {
  const db = useStore()
  const p = patientById(db, a.patientId)
  if (!p) return null
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-brand-50/50">
      <div className="w-16 shrink-0 text-center"><div className="text-sm font-extrabold text-brand-700">{fmtTime(a.time)}</div><div className="text-[10px] text-muted">{a.duration} min</div></div>
      <div className="min-w-0 flex-1"><PatientChip p={p} to={false} sub={`${a.type} · ${therapistName(db, a.therapistId).replace('Dr. ', '')}${a.mode === 'Online' ? ' · Online' : ''}${a.walkIn ? ' · Walk-in' : ''}`} /></div>
      <StatusBadge status={a.status} />
    </button>
  )
}

function ApptSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const db = useStore()
  const a = db.appointments.find((x) => x.id === id)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [remark, setRemark] = useState('')
  useEffect(() => { if (a) { setDate(a.date); setTime(a.time); setRemark(a.absenceRemark ?? '') } }, [a?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!a) return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  const p = patientById(db, a.patientId)
  return (
    <Sheet open onClose={onClose} title="Appointment">
      <div className="space-y-4">
        <PatientChip p={p!} sub={`${a.type} · ${a.duration} min · ${a.mode}`} />
        <Field label="Status">
          <Select value={a.status} onChange={(e) => { db.setApptStatus(a.id, e.target.value as ApptStatus, remark || undefined); toast('Status updated') }}>{APPT_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
        </Field>
        <Field label="Assigned therapist (reassign)">
          <Select value={a.therapistId} onChange={(e) => { const r = db.updateAppointment(a.id, { therapistId: e.target.value }); if (r.ok) toast('Therapist reassigned'); else toast(r.error ?? '', 'warn') }}>{db.staff.filter((s) => s.role.includes('Physio')).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Time"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        {(date !== a.date || time !== a.time) && <Button full variant="secondary" onClick={() => { const r = db.updateAppointment(a.id, { date, time, status: 'Rescheduled' }); if (r.ok) { db.setApptStatus(a.id, 'Scheduled'); toast('Rescheduled. Patient notified'); onClose() } else toast(r.error ?? '', 'warn') }}>Reschedule</Button>}
        <Field label="Absence remark (administrative)"><Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Reason for absence, if any" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" icon={<UserCheck size={16} />} onClick={() => { db.markAttendance(a.id, 'present'); toast('Marked present'); onClose() }}>Present</Button>
          <Button variant="secondary" className="!text-bad" icon={<UserX size={16} />} onClick={() => { db.markAttendance(a.id, 'absent', remark || undefined); toast('Marked absent', 'info'); onClose() }}>Absent</Button>
        </div>
        <Button full variant="ghost" className="!text-bad" onClick={() => { db.setApptStatus(a.id, 'Cancelled'); toast('Appointment cancelled', 'info'); onClose() }}>Cancel appointment</Button>
      </div>
    </Sheet>
  )
}

function BookSheet({ open, patientId, date, onClose }: { open: boolean; patientId?: string; date: string; onClose: () => void }) {
  const db = useStore()
  const [f, setF] = useState({ patientId: patientId ?? 'p1', therapistId: 's1', date, time: '12:30', duration: 45, type: 'Follow-up session' as ApptType, mode: 'In-clinic' as 'In-clinic' | 'Online', walkIn: false })
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setErr(''); setF((x) => ({ ...x, patientId: patientId ?? x.patientId, date })) } }, [open, patientId, date])
  const submit = () => {
    const r = db.bookAppointment({ patientId: f.patientId, therapistId: f.therapistId, date: f.date, time: f.time, duration: f.duration, type: f.type, status: f.walkIn ? 'Checked in' : 'Scheduled', mode: f.mode, walkIn: f.walkIn })
    if (r.ok) { toast('Appointment booked. Patient notified'); onClose() } else setErr(r.error ?? 'Could not book')
  }
  return (
    <Sheet open={open} onClose={onClose} title="Book appointment">
      <div className="space-y-3">
        <Field label="Patient"><Select value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value, therapistId: patientById(db, e.target.value)?.therapistId ?? f.therapistId })}>{db.patients.filter((p) => p.status !== 'discharged').map((p) => <option key={p.id} value={p.id}>{p.name} · {p.code}</option>)}</Select></Field>
        <Field label="Therapist"><Select value={f.therapistId} onChange={(e) => setF({ ...f, therapistId: e.target.value })}>{db.staff.filter((s) => s.role.includes('Physio')).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Time"><Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
        </div>
        {(() => {
          const slots = availableSlots(db, f.therapistId, f.date, f.duration)
          return (
            <div>
              <div className="mb-1 text-[12.5px] font-semibold text-slate-600">Free slots that day</div>
              {slots.length ? <div className="flex flex-wrap gap-1.5">{slots.slice(0, 12).map((t) => <Chip key={t} active={f.time === t} onClick={() => setF({ ...f, time: t })}>{fmtTime(t)}</Chip>)}</div> : <p className="text-xs text-muted">No free slots (day off, on leave, or fully booked).</p>}
            </div>
          )
        })()}
        <Field label="Appointment type"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ApptType, duration: e.target.value === 'Initial consultation' || e.target.value === 'Reassessment' ? 60 : 45 })}>{APPT_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (min)"><Select value={f.duration} onChange={(e) => setF({ ...f, duration: Number(e.target.value) })}>{[30, 45, 60, 90].map((d) => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="Mode"><Select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as 'In-clinic' | 'Online' })}><option>In-clinic</option><option>Online</option></Select></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.walkIn} onChange={(e) => setF({ ...f, walkIn: e.target.checked })} className="h-4 w-4 accent-teal-600" /> Walk-in (check in immediately)</label>
        {err && <Notice tone="red" title="Scheduling conflict">{err}</Notice>}
        <Button full size="lg" onClick={submit}>Book appointment</Button>
      </div>
    </Sheet>
  )
}

function Attendance({ onOpen }: { onOpen: (id: string) => void }) {
  const db = useStore()
  const [date, setDate] = useState(todayISO())
  const list = db.appointments.filter((a) => a.date === date).sort((a, b) => a.time.localeCompare(b.time))
  const rows = db.patients.filter((p) => p.status === 'active').map((p) => {
    const s = packageSummary(db, p.id)
    const done = db.appointments.filter((a) => a.patientId === p.id && a.status === 'Completed').length
    const missed = db.appointments.filter((a) => a.patientId === p.id && a.status === 'No-show').length
    const sched = db.appointments.filter((a) => a.patientId === p.id && ['Scheduled', 'Confirmed'].includes(a.status)).length
    return { p, s, done, missed, sched, reg: done + missed ? Math.round((done / (done + missed)) * 100) : 100 }
  })
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="!w-auto" /><Button size="sm" variant="ghost" onClick={() => setDate(todayISO())}>Today</Button></div>
      <Card pad={false} className="divide-y divide-line">
        {list.map((a) => {
          const p = patientById(db, a.patientId)!
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-2 p-3">
              <button onClick={() => onOpen(a.id)} className="min-w-0 flex-1 text-left"><PatientChip p={p} to={false} sub={`${fmtTime(a.time)} · ${a.type} · Session ${db.appointments.filter((x) => x.patientId === a.patientId && x.status === 'Completed' && x.date + x.time <= a.date + a.time).length + (a.status === 'Completed' ? 0 : 1)}`} /></button>
              {a.attendance === 'absent' && a.absenceRemark && <span className="text-xs text-muted">“{a.absenceRemark}”</span>}
              <div className="flex gap-1.5">
                <Button size="sm" variant={a.attendance === 'present' ? 'teal' : 'soft'} onClick={() => db.markAttendance(a.id, 'present')}>Present</Button>
                <Button size="sm" variant={a.attendance === 'absent' ? 'danger' : 'secondary'} onClick={() => db.markAttendance(a.id, 'absent')}>Absent</Button>
              </div>
            </div>
          )
        })}
        {!list.length && <p className="p-5 text-center text-sm text-muted">No appointments on this date.</p>}
      </Card>
      <div>
        <SectionTitle title="Session packages and attendance regularity" />
        <Card pad={false} className="divide-y divide-line">
          {rows.map(({ p, s, done, missed, sched, reg }) => (
            <div key={p.id} className="grid gap-2 p-3 sm:grid-cols-5 sm:items-center">
              <div className="sm:col-span-2"><PatientChip p={p} sub={s.pkg?.name ?? 'No package'} /></div>
              <div className="text-xs text-muted"><b className="text-ink">{done}</b> attended · <b className="text-ink">{sched}</b> scheduled · <b className="text-ink">{s.remaining}</b> left</div>
              <div><ProgressBar value={s.sessionsTotal ? (s.used / s.sessionsTotal) * 100 : 0} tone="teal" /></div>
              <div className="text-xs"><Badge tone={reg >= 85 ? 'green' : reg >= 70 ? 'amber' : 'red'}>Regularity {reg}%</Badge> {missed > 0 && <span className="text-muted">{missed} missed</span>}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

function Waiting({ onBook }: { onBook: () => void }) {
  const db = useStore()
  const [f, setF] = useState({ name: '', phone: '', reason: '' })
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="Add to waiting list / walk-in enquiry" />
        <div className="grid gap-2 sm:grid-cols-3">
          <Input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input placeholder="Reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </div>
        <Button className="mt-3" disabled={!f.name} onClick={() => { db.addWaiting(f.name, f.phone, f.reason); setF({ name: '', phone: '', reason: '' }); toast('Added to waiting list') }}>Add</Button>
      </Card>
      {db.waiting.length === 0 ? <Empty icon="⏳" title="Waiting list is empty" /> : db.waiting.map((w) => (
        <Card key={w.id} className="flex flex-wrap items-center gap-3 !p-3.5">
          <div className="min-w-0 flex-1"><div className="text-sm font-bold">{w.name}</div><div className="text-xs text-muted">{w.phone} · {w.reason}</div></div>
          <Button size="sm" variant="soft" onClick={onBook}>Offer slot</Button>
          <Button size="sm" variant="ghost" onClick={() => db.removeWaiting(w.id)}>Remove</Button>
        </Card>
      ))}
    </div>
  )
}


const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const hoursText = (days: number[], start: string, end: string) => {
  const sorted = [...days].sort((a, b) => a - b)
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
  const label = sorted.length === 0 ? 'No days' : contiguous && sorted.length > 1 ? `${DAYS[sorted[0]]}-${DAYS[sorted[sorted.length - 1]]}` : sorted.map((d) => DAYS[d]).join('/')
  return `${label} ${start}-${end}`
}

function Team() {
  const db = useStore()
  const therapists = db.staff.filter((s) => s.role.includes('Physio') || s.role.includes('Doctor'))
  const [edit, setEdit] = useState<string | null>(null)
  const [leave, setLeave] = useState<{ t: string; d: string; reason: string } | null>(null)
  const [reassignTo, setReassignTo] = useState('s3')
  const upcomingLeaves = db.leaves.filter((l) => l.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date))
  const affected = leave ? db.appointments.filter((a) => a.therapistId === leave.t && a.date === leave.d && !['Cancelled', 'Completed', 'No-show'].includes(a.status)) : []
  const editing = db.staff.find((s) => s.id === edit)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {therapists.map((t) => {
          const week = Array.from({ length: 5 }, (_, i) => { const d = addDays(todayISO(), i); return { x: fmtDate(d, { weekday: 'short' }), v: db.appointments.filter((a) => a.therapistId === t.id && a.date === d && !['Cancelled', 'Rescheduled'].includes(a.status)).length } })
          const mine = upcomingLeaves.filter((l) => l.staffId === t.id)
          return (
            <Card key={t.id}>
              <div className="flex items-center justify-between"><div className="text-sm font-extrabold">{t.name}</div>{t.verified && <Badge tone="green">Verified</Badge>}</div>
              <div className="text-xs text-muted">{t.speciality}</div>
              <div className="mt-1 flex flex-wrap gap-1">{DAYS.map((d, i) => <span key={d} className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.workDays.includes(i) ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>{d}</span>)}<span className="ml-1 text-[11px] text-muted">{t.start}-{t.end}</span></div>
              <div className="mt-2"><Bars data={week} height={80} color="#2a80d2" /></div>
              {mine.map((l) => <div key={l.id} className="mb-1 flex items-center justify-between rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-900"><span>Leave {fmtDate(l.date)}{l.reason ? `: ${l.reason}` : ''}</span><button className="font-bold" onClick={() => db.removeLeave(l.id)} aria-label="Remove leave">×</button></div>)}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button size="sm" variant="soft" onClick={() => setEdit(t.id)}>Working hours</Button>
                <Button size="sm" variant="soft" onClick={() => setLeave({ t: t.id, d: todayISO(), reason: '' })}>Mark unavailable</Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Sheet open={!!editing} onClose={() => setEdit(null)} title={editing ? `Working hours: ${editing.name}` : ''}>
        {editing && (
          <div className="space-y-3">
            <Field label="Working days"><div className="flex flex-wrap gap-1.5">{DAYS.map((d, i) => <Chip key={d} active={editing.workDays.includes(i)} onClick={() => { const next = editing.workDays.includes(i) ? editing.workDays.filter((x) => x !== i) : [...editing.workDays, i]; db.updateStaff(editing.id, { workDays: next, hours: hoursText(next, editing.start, editing.end) }) }}>{d}</Chip>)}</div></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts"><Input type="time" value={editing.start} onChange={(e) => db.updateStaff(editing.id, { start: e.target.value, hours: hoursText(editing.workDays, e.target.value, editing.end) })} /></Field>
              <Field label="Ends"><Input type="time" value={editing.end} onChange={(e) => db.updateStaff(editing.id, { end: e.target.value, hours: hoursText(editing.workDays, editing.start, e.target.value) })} /></Field>
            </div>
            <Notice tone="blue">New bookings and patient self-booking only offer slots inside these hours and never on leave days.</Notice>
            <Button full onClick={() => { toast('Working hours saved'); setEdit(null) }}>Done</Button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!leave} onClose={() => setLeave(null)} title="Mark therapist unavailable">
        {leave && (
          <div className="space-y-3">
            <Field label="Therapist"><Select value={leave.t} onChange={(e) => setLeave({ ...leave, t: e.target.value })}>{therapists.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
            <Field label="Date"><Input type="date" value={leave.d} onChange={(e) => setLeave({ ...leave, d: e.target.value })} /></Field>
            <Field label="Reason"><Input value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} placeholder="e.g. Conference, sick leave" /></Field>
            {affected.length === 0 ? <Notice tone="green">No appointments are affected on this date.</Notice> : (
              <>
                <Notice tone="amber" title={`${affected.length} appointment(s) affected`}>Reassign them to another therapist after saving the leave.</Notice>
                <Field label="Reassign to"><Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>{therapists.filter((t) => t.id !== leave.t).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
              </>
            )}
            <Button full onClick={() => {
              db.addLeave(leave.t, leave.d, leave.reason)
              let ok = 0
              affected.forEach((a) => { if (db.updateAppointment(a.id, { therapistId: reassignTo }).ok) ok++ })
              toast(affected.length ? `Leave saved. ${ok} of ${affected.length} appointments reassigned${ok < affected.length ? ' (the rest need manual rescheduling)' : ''}` : 'Leave saved', ok < affected.length ? 'warn' : 'ok')
              setLeave(null)
            }}>Save leave</Button>
          </div>
        )}
      </Sheet>
    </div>
  )
}