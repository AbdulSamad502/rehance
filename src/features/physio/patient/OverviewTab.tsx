import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, Edit3, Send, Smartphone } from 'lucide-react'
import { Badge, Button, Card, Field, Input, KV, Ring, SectionTitle, Select, Sheet, SimBadge, StatCard, Textarea, toast } from '../../../components/ui'
import { canSee } from '../../../lib/access'
import { adherence, apptsOf, packageSummary, therapistName } from '../../../lib/derive'
import { fmtDate, fmtTime, inr, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { Patient } from '../../../types'
import { StatusBadge } from '../shared'

export default function OverviewTab({ p }: { p: Patient }) {
  const db = useStore()
  const nav = useNavigate()
  const [edit, setEdit] = useState(false)
  const role = db.ui.physioRole
  const clinical = canSee(role, 'clinical')
  const sum = packageSummary(db, p.id)
  const ad = adherence(db, p.id, 7)
  const sessions = db.sessions.filter((s) => s.patientId === p.id).sort((a, b) => a.date.localeCompare(b.date))
  const lastPain = sessions.length ? sessions[sessions.length - 1].painAfter : null
  const appts = apptsOf(db, p.id)
  const upcoming = appts.filter((a) => a.date >= todayISO() && !['Completed', 'Cancelled', 'No-show', 'Rescheduled'].includes(a.status))
  const past = appts.filter((a) => !upcoming.includes(a)).reverse().slice(0, 5)

  const timeline = clinical ? [
    ...db.sessions.filter((s) => s.patientId === p.id).map((s) => ({ at: s.date, t: `Session #${s.no}`, d: `Pain ${s.painBefore}→${s.painAfter}. ${s.objective}`, i: '🩺' })),
    ...db.assessments.filter((a) => a.patientId === p.id).map((a) => ({ at: a.date, t: `${a.kind[0].toUpperCase() + a.kind.slice(1)} assessment${a.region ? ` (${a.region})` : ''}`, d: a.status === 'final' ? 'Finalised' : 'Draft', i: '📋' })),
    ...db.motions.filter((m) => m.patientId === p.id).map((m) => ({ at: m.at.slice(0, 10), t: `Motion analysis: ${m.movementLabel}`, d: `${m.headline}${m.unit} · ${m.status}`, i: '🤖' })),
    ...db.checkins.filter((c) => c.patientId === p.id).map((c) => ({ at: c.at.slice(0, 10), t: `Symptom check-in: pain ${c.pain}/10`, d: c.newSymptoms || c.location, i: '💬' })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8) : []

  const invite = () => { const code = db.sendInvite(p.id); toast(`Invite ${code} sent (simulated SMS)`) }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="flex items-center gap-3 !p-3.5">
          <Ring value={sum.sessionsTotal ? (sum.used / sum.sessionsTotal) * 100 : 0} label={`${sum.used}/${sum.sessionsTotal}`} size={58} />
          <div><div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">Sessions</div><div className="text-sm font-bold">{sum.remaining} remaining</div></div>
        </Card>
        {clinical && <StatCard label="Exercise adherence" value={ad === null ? '–' : `${ad}%`} sub="Last 7 days" tone={ad !== null && ad < 40 ? 'red' : 'teal'} />}
        {clinical && <StatCard label="Latest pain" value={lastPain === null ? '–' : `${lastPain}/10`} sub="After last session" tone="amber" />}
        <StatCard label="Outstanding" value={inr(sum.outstanding)} sub={sum.pkg?.name ?? 'No package'} tone={sum.outstanding > 0 ? 'amber' : 'green'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card>
            <SectionTitle title="Administrative profile" action={<Button size="sm" variant="soft" icon={<Edit3 size={14} />} onClick={() => setEdit(true)}>Edit</Button>} />
            <KV k="Patient ID" v={p.code} />
            <KV k="Phone" v={p.phone} />
            <KV k="Email" v={p.email} />
            <KV k="Address" v={p.address} />
            <KV k="Emergency contact" v={p.emergency || '–'} />
            <KV k="Referral" v={p.referral} />
            <KV k="Registered" v={fmtDate(p.registeredAt)} />
            <KV k="Clinic" v={p.location} />
            <KV k="Treating therapist" v={therapistName(db, p.therapistId)} />
            <KV k="Rehabilitation episode" v={`${p.episodeTitle} (since ${fmtDate(p.episodeStart)})`} />
            <KV k="Admin remarks" v={p.adminRemarks || '–'} />
          </Card>

          <Card className="border-teal-100 bg-teal-50/40">
            <SectionTitle title="GearPhys app access" action={<Badge tone={p.invite.status === 'accepted' ? 'teal' : p.invite.status === 'sent' ? 'amber' : 'gray'}>{p.invite.status === 'accepted' ? 'Joined' : p.invite.status === 'sent' ? 'Invite sent' : 'Not invited'}</Badge>} />
            {p.invite.status === 'none' && <p className="mb-3 text-sm text-muted">This patient has not been invited to the app yet.</p>}
            {p.invite.status === 'sent' && <p className="mb-3 text-sm text-muted">Invite code <b className="rounded bg-white px-1.5 py-0.5 font-mono text-brand-700">{p.invite.code}</b>. Waiting for the patient to join and give consent.</p>}
            {p.invite.status === 'accepted' && <p className="mb-3 text-sm text-muted">Patient is on the app and can see appointments, assigned exercises and approved results.</p>}
            <div className="flex flex-wrap items-center gap-2">
              {p.invite.status !== 'accepted' && <Button size="sm" icon={<Send size={14} />} onClick={invite}>{p.invite.status === 'sent' ? 'Resend invite' : 'Send app invite'}</Button>}
              <Button size="sm" variant="secondary" icon={<Smartphone size={14} />} onClick={() => { if (p.invite.status === 'accepted') { db.setPatientId(p.id); nav('/patient/home') } else nav('/patient') }}>{p.invite.status === 'accepted' ? 'View as patient' : 'Open patient app'}</Button>
              <SimBadge label="SMS simulated" />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <div>
            <SectionTitle title="Appointments" />
            <Card pad={false} className="divide-y divide-line">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3">
                  <CalendarClock size={18} className="text-brand-500" />
                  <div className="min-w-0 flex-1"><div className="text-sm font-bold">{fmtDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(a.time)}</div><div className="text-xs text-muted">{a.type} · {therapistName(db, a.therapistId).replace('Dr. ', '')}</div></div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
              {past.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 opacity-80">
                  <CalendarClock size={18} className="text-slate-300" />
                  <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{fmtDate(a.date)} · {fmtTime(a.time)}</div><div className="text-xs text-muted">{a.type}</div></div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
              {!upcoming.length && !past.length && <p className="p-5 text-center text-sm text-muted">No appointments yet</p>}
            </Card>
          </div>
          {clinical && (
            <div>
              <SectionTitle title="Clinical timeline" />
              <Card pad={false} className="divide-y divide-line">
                {timeline.map((e, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <div className="text-lg">{e.i}</div>
                    <div className="min-w-0"><div className="text-sm font-bold">{e.t}</div><div className="truncate text-xs text-muted">{e.d}</div></div>
                    <div className="ml-auto shrink-0 text-xs text-slate-400">{fmtDate(e.at)}</div>
                  </div>
                ))}
                {!timeline.length && <p className="p-5 text-center text-sm text-muted">No clinical events yet</p>}
              </Card>
            </div>
          )}
        </div>
      </div>
      <EditSheet p={p} open={edit} onClose={() => setEdit(false)} />
    </div>
  )
}

function EditSheet({ p, open, onClose }: { p: Patient; open: boolean; onClose: () => void }) {
  const staff = useStore((s) => s.staff)
  const update = useStore((s) => s.updatePatient)
  const [f, setF] = useState({ phone: p.phone, email: p.email, address: p.address, emergency: p.emergency, referral: p.referral, therapistId: p.therapistId, status: p.status, adminRemarks: p.adminRemarks })
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }))
  return (
    <Sheet open={open} onClose={onClose} title="Edit administrative details">
      <div className="space-y-3">
        <Field label="Phone"><Input value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Email"><Input value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Address"><Input value={f.address} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label="Emergency contact"><Input value={f.emergency} onChange={(e) => set('emergency', e.target.value)} /></Field>
        <Field label="Referring doctor / source"><Input value={f.referral} onChange={(e) => set('referral', e.target.value)} /></Field>
        <Field label="Treating therapist"><Select value={f.therapistId} onChange={(e) => set('therapistId', e.target.value)}>{staff.filter((s) => s.role.includes('Physio')).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="Status"><Select value={f.status} onChange={(e) => set('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="discharged">Discharged</option></Select></Field>
        <Field label="Administrative remarks"><Textarea value={f.adminRemarks} onChange={(e) => set('adminRemarks', e.target.value)} /></Field>
        <Button full onClick={() => { update(p.id, { ...f, status: f.status as Patient['status'] }); toast('Details updated'); onClose() }}>Save changes</Button>
      </div>
    </Sheet>
  )
}
