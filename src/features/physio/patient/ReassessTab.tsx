import { useState } from 'react'
import { CalendarPlus, CheckCircle2, Circle, LogOut } from 'lucide-react'
import { Badge, Button, Card, Field, Input, Notice, Scale, SectionTitle, Sheet, toast } from '../../../components/ui'
import { daysFromToday, fmtDate, todayISO } from '../../../lib/utils'
import { adherence } from '../../../lib/derive'
import { useStore } from '../../../store'
import type { Patient } from '../../../types'

export default function ReassessTab({ p }: { p: Patient }) {
  const db = useStore()
  const canEdit = db.ui.physioRole === 'physio'
  const [book, setBook] = useState(false)
  const [rec, setRec] = useState({ pain: 3, rom: '', strength: '', score: '', measure: 'KOOS', notes: '' })
  const [followUp, setFollowUp] = useState('')
  const lastRe = db.appointments.filter((a) => a.patientId === p.id && a.type === 'Reassessment' && a.status === 'Completed').map((a) => a.date).sort().pop()
  const nextRe = db.appointments.find((a) => a.patientId === p.id && a.type === 'Reassessment' && !['Completed', 'Cancelled'].includes(a.status))
  const goals = db.goals.filter((g) => g.patientId === p.id)
  const dischargeDraft = db.drafts.some((d) => d.patientId === p.id && d.kind === 'Discharge summary')
  const recentFinal = db.assessments.some((a) => a.patientId === p.id && a.status === 'final' && a.date >= daysFromToday(-10))
  const hep = db.assignments.some((a) => a.patientId === p.id && a.status === 'Active')
  const [goalsReviewed, setGoalsReviewed] = useState(false)
  const checklist = [
    { ok: recentFinal, label: 'Final assessment completed (within 10 days)' },
    { ok: goalsReviewed, label: `Rehabilitation goals reviewed (${goals.filter((g) => g.progress >= 80).length}/${goals.length} nearly achieved)`, action: () => setGoalsReviewed(true) },
    { ok: db.outcomes.some((o) => o.patientId === p.id && o.date >= daysFromToday(-10)), label: 'Final outcome measure recorded' },
    { ok: dischargeDraft, label: 'Discharge summary generated (AI Copilot tab)' },
    { ok: hep, label: 'Home exercise recommendations prepared' },
    { ok: followUp.trim().length > 3, label: 'Follow-up recommendations recorded' },
  ]
  const ready = checklist.every((c) => c.ok)
  const discharged = p.status === 'discharged'

  const saveRe = () => {
    const th = p.therapistId
    db.saveAssessment({ patientId: p.id, kind: 'clinical', date: todayISO(), therapistId: th, status: 'final', data: { chief: 'Reassessment', painNow: String(rec.pain), rom_R: rec.rom, strength_R: rec.strength, impression: rec.notes } })
    if (rec.score) db.addOutcome({ patientId: p.id, measure: rec.measure, date: todayISO(), score: Number(rec.score) })
    toast('Reassessment recorded. Compare it on the Progress tab')
    setRec({ pain: 3, rom: '', strength: '', score: '', measure: rec.measure, notes: '' })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Reassessment schedule" action={canEdit && <Button size="sm" variant="soft" icon={<CalendarPlus size={14} />} onClick={() => setBook(true)}>Schedule</Button>} />
          <p className="text-sm">Last reassessment: <b>{lastRe ? fmtDate(lastRe) : 'none yet'}</b></p>
          <p className="text-sm">Next: <b>{nextRe ? `${fmtDate(nextRe.date)} ${nextRe.time}` : 'not scheduled'}</b></p>
          <p className="mt-1 text-xs text-muted">Current adherence {adherence(db, p.id, 7) ?? '–'}% · plan reassess interval {db.plans.find((x) => x.patientId === p.id)?.reassessEvery ?? '–'}</p>
        </Card>
        <Card>
          <SectionTitle title="Record reassessment" />
          <div className="space-y-3">
            <Field label="Pain now"><Scale value={rec.pain} onChange={(n) => setRec({ ...rec, pain: n })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="ROM (°)"><Input inputMode="numeric" value={rec.rom} onChange={(e) => setRec({ ...rec, rom: e.target.value })} /></Field>
              <Field label="Strength (MMT 0-5)"><Input inputMode="numeric" value={rec.strength} onChange={(e) => setRec({ ...rec, strength: e.target.value })} /></Field>
              <Field label="Outcome measure"><Input value={rec.measure} onChange={(e) => setRec({ ...rec, measure: e.target.value })} /></Field>
              <Field label="Score"><Input inputMode="decimal" value={rec.score} onChange={(e) => setRec({ ...rec, score: e.target.value })} /></Field>
            </div>
            <Field label="Clinical conclusion"><Input value={rec.notes} onChange={(e) => setRec({ ...rec, notes: e.target.value })} /></Field>
            <Button full disabled={!canEdit} onClick={saveRe}>Save reassessment</Button>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Discharge" action={discharged ? <Badge tone="gray">Discharged</Badge> : <Badge tone={ready ? 'green' : 'amber'}>{checklist.filter((c) => c.ok).length}/{checklist.length} ready</Badge>} />
        {discharged ? <Notice tone="green" title="Episode closed">This patient has been discharged. The summary is available in Reports and on the patient's app.</Notice> : (
          <>
            <ul className="mb-3 divide-y divide-line">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-3 py-2.5 text-sm">
                  {c.ok ? <CheckCircle2 size={19} className="shrink-0 text-ok" /> : <Circle size={19} className="shrink-0 text-slate-300" />}
                  <span className={c.ok ? '' : 'text-muted'}>{c.label}</span>
                  {!c.ok && c.action && <Button size="sm" variant="soft" className="ml-auto" onClick={c.action}>Mark reviewed</Button>}
                </li>
              ))}
            </ul>
            <Field label="Follow-up recommendations"><Input value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="e.g. Review in 6 weeks; continue home programme 3x/week" /></Field>
            <Button className="mt-3" full size="lg" variant="danger" icon={<LogOut size={16} />} disabled={!ready || !canEdit} onClick={() => { db.dischargePatient(p.id); toast('Patient discharged and episode closed') }}>Discharge patient and close episode</Button>
            {!ready && <p className="mt-2 text-center text-xs text-muted">Complete the checklist to enable discharge.</p>}
          </>
        )}
      </Card>
      <BookRe p={p} open={book} onClose={() => setBook(false)} />
    </div>
  )
}

function BookRe({ p, open, onClose }: { p: Patient; open: boolean; onClose: () => void }) {
  const book = useStore((s) => s.bookAppointment)
  const [date, setDate] = useState(daysFromToday(3))
  const [time, setTime] = useState('14:00')
  return (
    <Sheet open={open} onClose={onClose} title="Schedule reassessment">
      <div className="space-y-3">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Time"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        <Button full onClick={() => {
          const r = book({ patientId: p.id, therapistId: p.therapistId, date, time, duration: 60, type: 'Reassessment', status: 'Scheduled', mode: 'In-clinic' })
          if (r.ok) { toast('Reassessment scheduled. Patient notified'); onClose() } else toast(r.error ?? 'Could not book', 'warn')
        }}>Book reassessment</Button>
      </div>
    </Sheet>
  )
}
