import { useMemo, useState } from 'react'
import { CalendarPlus, MapPin, Video } from 'lucide-react'
import { Badge, Button, Card, Field, Input, Notice, Sheet, Tabs, Textarea, toast } from '../../../components/ui'
import { apptsOf, availableSlots, therapistName } from '../../../lib/derive'
import { addDays, fmtDate, fmtDateLong, fmtTime, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { Appointment } from '../../../types'
import { STATUS_TONE } from '../../physio/shared'
import { H, Screen, usePatient } from '../ui'

export default function Appointments() {
  const db = useStore()
  const p = usePatient()
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming')
  const [sel, setSel] = useState<Appointment | null>(null)
  const [req, setReq] = useState(false)
  const [slots, setSlots] = useState(false)
  const all = apptsOf(db, p.id)
  const upcoming = all.filter((a) => a.date >= todayISO() && !['Completed', 'Cancelled', 'No-show', 'Rescheduled'].includes(a.status))
  const history = all.filter((a) => !upcoming.includes(a)).reverse()
  const list = tab === 'upcoming' ? upcoming : history

  return (
    <Screen title="Appointments" back={false} action={<Button size="sm" icon={<CalendarPlus size={15} />} onClick={() => setReq(true)}>Request</Button>}>
      <Tabs tabs={[{ id: 'upcoming', label: `Upcoming (${upcoming.length})` }, { id: 'history', label: 'History' }]} value={tab} onChange={setTab} />
      {list.length === 0 && <Card className="text-center text-sm text-muted">{tab === 'upcoming' ? 'No upcoming appointments. Request one or book an available slot.' : 'No past appointments.'}</Card>}
      <div className="space-y-2.5">
        {list.map((a) => (
          <Card key={a.id} onClick={() => setSel(a)}>
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-center leading-none"><div><div className="text-[10px] font-bold uppercase text-brand-500">{fmtDate(a.date, { month: 'short' })}</div><div className="text-xl font-extrabold text-brand-700">{fmtDate(a.date, { day: 'numeric' })}</div></div></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold">{fmtTime(a.time)} · {a.type}</div>
                <div className="text-xs text-muted">{therapistName(db, a.therapistId)}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5"><Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge><Badge tone="gray">{a.mode === 'Online' ? <><Video size={11} /> Online</> : <><MapPin size={11} /> In clinic</>}</Badge></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {tab === 'upcoming' && <Button full variant="secondary" onClick={() => setSlots(true)}>Book an available slot</Button>}

      <Sheet open={!!sel} onClose={() => setSel(null)} title="Appointment details">
        {sel && <Detail a={sel} onClose={() => setSel(null)} />}
      </Sheet>
      <RequestSheet open={req} onClose={() => setReq(false)} />
      <SlotSheet open={slots} onClose={() => setSlots(false)} />
      <H>{''}</H>
    </Screen>
  )
}

function Detail({ a, onClose }: { a: Appointment; onClose: () => void }) {
  const db = useStore()
  const p = usePatient()
  const open = !['Completed', 'Cancelled', 'No-show', 'Rescheduled'].includes(a.status)
  return (
    <div className="space-y-3">
      <div><div className="text-lg font-extrabold">{a.type}</div><div className="text-sm text-muted">{fmtDateLong(a.date)} · {fmtTime(a.time)} · {a.duration} min</div></div>
      <div className="rounded-2xl bg-surface p-3 text-sm">
        <div><b>Therapist:</b> {therapistName(db, a.therapistId)}</div>
        <div><b>Where:</b> {a.mode === 'Online' ? 'Online video session. A link is sent 15 minutes before.' : `${p.location}, 14 Residency Road, Pune`}</div>
        <div><b>Status:</b> {a.status}</div>
      </div>
      <Notice tone="blue" title="Before your visit">Wear comfortable clothing that lets the therapist see the affected area. Bring your reports and any walking aids.</Notice>
      {open && (
        <div className="grid gap-2">
          {a.status !== 'Confirmed' && <Button variant="teal" onClick={() => { db.setApptStatus(a.id, 'Confirmed'); toast('Appointment confirmed'); onClose() }}>Confirm I will attend</Button>}
          <Button variant="secondary" onClick={() => { db.addRequest({ patientId: p.id, kind: 'Reschedule', text: `Please reschedule my ${a.type} on ${fmtDate(a.date)} at ${fmtTime(a.time)}.` }); toast('Reschedule requested. The clinic will confirm'); onClose() }}>Request reschedule</Button>
          <Button variant="ghost" className="!text-bad" onClick={() => { db.addRequest({ patientId: p.id, kind: 'Cancellation', text: `Please cancel my ${a.type} on ${fmtDate(a.date)} at ${fmtTime(a.time)}.` }); toast('Cancellation requested', 'info'); onClose() }}>Request cancellation</Button>
        </div>
      )}
    </div>
  )
}

function RequestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addRequest = useStore((s) => s.addRequest)
  const p = usePatient()
  const [f, setF] = useState({ date: addDays(todayISO(), 2), time: 'Morning', reason: '' })
  return (
    <Sheet open={open} onClose={onClose} title="Request an appointment">
      <div className="space-y-3">
        <Field label="Preferred date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Preferred time"><div className="grid grid-cols-3 gap-2">{['Morning', 'Afternoon', 'Evening'].map((t) => <button key={t} onClick={() => setF({ ...f, time: t })} className={`rounded-xl border py-2 text-sm font-semibold ${f.time === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line'}`}>{t}</button>)}</div></Field>
        <Field label="Reason (optional)"><Textarea value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} className="!min-h-[64px]" /></Field>
        <Button full onClick={() => { addRequest({ patientId: p.id, kind: 'Appointment request', text: `${f.time} on ${fmtDate(f.date)}. ${f.reason}` }); toast('Request sent to the clinic'); onClose() }}>Send request</Button>
      </div>
    </Sheet>
  )
}

function SlotSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useStore()
  const p = usePatient()
  const slots = useMemo(() => {
    const out: { date: string; time: string }[] = []
    for (let d = 1; d <= 7 && out.length < 10; d++) {
      const date = addDays(todayISO(), d)
      const free = availableSlots(db, p.therapistId, date, 45)
      // offer a spread across the day: first, middle and last free slot
      const picks = free.length > 3 ? [free[0], free[Math.floor(free.length / 2)], free[free.length - 1]] : free
      picks.forEach((t) => out.push({ date, time: t }))
    }
    return out.slice(0, 10)
  }, [db, p.therapistId])
  return (
    <Sheet open={open} onClose={onClose} title="Available slots">
      <p className="mb-3 text-sm text-muted">With {therapistName(db, p.therapistId)}. Only times when the therapist is working and free are shown. Tap a slot to book.</p>
      {slots.length === 0 && <p className="rounded-xl bg-surface p-3 text-sm text-muted">No free slots this week. Please send a request instead.</p>}
      <div className="grid grid-cols-2 gap-2">
        {slots.map((s) => (
          <button key={s.date + s.time} onClick={() => { const r = db.bookAppointment({ patientId: p.id, therapistId: p.therapistId, date: s.date, time: s.time, duration: 45, type: 'Follow-up session', status: 'Scheduled', mode: 'In-clinic' }); if (r.ok) { toast('Booked. See you then!'); onClose() } else toast(r.error ?? '', 'warn') }} className="rounded-2xl border border-line p-3 text-left hover:border-brand-400">
            <div className="text-xs text-muted">{fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div><div className="text-base font-extrabold text-brand-700">{fmtTime(s.time)}</div>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
