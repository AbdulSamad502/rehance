import { useState } from 'react'
import { ClipboardList, Eye, EyeOff } from 'lucide-react'
import { Badge, Button, Card, Chip, Empty, Field, Input, Scale, Select, Sheet, Textarea, Toggle, toast } from '../../../components/ui'
import { TREATMENT_MODES } from '../../../data/catalog'
import { therapistName } from '../../../lib/derive'
import { fmtDate, todayISO } from '../../../lib/utils'
import { ACTORS, useStore } from '../../../store'
import type { Patient } from '../../../types'

export default function SessionsTab({ p }: { p: Patient }) {
  const db = useStore()
  const list = db.sessions.filter((s) => s.patientId === p.id).sort((a, b) => b.no - a.no)
  const [open, setOpen] = useState(false)
  const canEdit = db.ui.physioRole === 'physio'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{list.length} documented sessions</p>
        {canEdit && <Button icon={<ClipboardList size={16} />} onClick={() => setOpen(true)}>Document session</Button>}
      </div>
      {list.length === 0 && <Empty icon="🩺" title="No sessions documented" body="Document each treatment session with pain scores, interventions and the next-session plan." />}
      <div className="space-y-3">
        {list.map((s) => (
          <Card key={s.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[15px] font-extrabold">Session #{s.no} <span className="text-sm font-medium text-muted">· {fmtDate(s.date)} · {therapistName(db, s.therapistId)}</span></div>
              <button onClick={() => db.toggleSessionShared(s.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600">{s.shared ? <Eye size={14} /> : <EyeOff size={14} />}{s.shared ? 'Summary shared with patient' : 'Not shared'}</button>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Badge tone="amber">Pain before {s.painBefore}/10</Badge><span className="text-muted">→</span><Badge tone="green">after {s.painAfter}/10</Badge>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted">Subjective</dt><dd>{s.subjective}</dd></div>
              <div><dt className="text-xs text-muted">Objective findings</dt><dd>{s.objective}</dd></div>
              <div><dt className="text-xs text-muted">Treatment provided</dt><dd className="flex flex-wrap gap-1">{s.treatment.map((t) => <Badge key={t} tone="teal">{t}</Badge>)}</dd></div>
              <div><dt className="text-xs text-muted">Exercise dosage</dt><dd>{s.dosage}</dd></div>
              <div><dt className="text-xs text-muted">Tolerance / adverse response</dt><dd>{s.tolerance}. {s.adverse}</dd></div>
              <div><dt className="text-xs text-muted">Next-session plan</dt><dd>{s.nextPlan}</dd></div>
              {s.notes && <div className="sm:col-span-2"><dt className="text-xs text-muted">Notes</dt><dd>{s.notes}</dd></div>}
            </dl>
            <p className="mt-3 text-[11px] font-semibold text-emerald-700">Signed by {therapistName(db, s.therapistId)} · {fmtDate(s.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </Card>
        ))}
      </div>
      <SessionSheet p={p} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function SessionSheet({ p, open, onClose }: { p: Patient; open: boolean; onClose: () => void }) {
  const add = useStore((s) => s.addSessionNote)
  const sessions = useStore((s) => s.sessions)
  const role = useStore((s) => s.ui.physioRole)
  const staff = useStore((s) => s.staff)
  const no = sessions.filter((s) => s.patientId === p.id).length + 1
  const blank = { painBefore: 5, painAfter: 3, subjective: '', objective: '', treatment: ['Therapeutic exercise'] as string[], dosage: '', tolerance: 'Good', adverse: 'None', notes: '', nextPlan: '', shared: true }
  const [f, setF] = useState(blank)
  return (
    <Sheet open={open} onClose={onClose} title={`Session #${no} documentation`} wide>
      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pain before treatment"><Scale value={f.painBefore} onChange={(n) => setF({ ...f, painBefore: n })} /></Field>
          <Field label="Pain after treatment"><Scale value={f.painAfter} onChange={(n) => setF({ ...f, painAfter: n })} /></Field>
        </div>
        <Field label="Subjective response"><Textarea value={f.subjective} onChange={(e) => setF({ ...f, subjective: e.target.value })} className="!min-h-[60px]" /></Field>
        <Field label="Objective findings"><Textarea value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })} className="!min-h-[60px]" /></Field>
        <div>
          <span className="mb-1 block text-[12.5px] font-semibold text-slate-600">Treatment provided</span>
          <div className="flex flex-wrap gap-1.5">{TREATMENT_MODES.map((m) => <Chip key={m} active={f.treatment.includes(m)} onClick={() => setF({ ...f, treatment: f.treatment.includes(m) ? f.treatment.filter((x) => x !== m) : [...f.treatment, m] })}>{m}</Chip>)}</div>
        </div>
        <Field label="Exercise dosage (sets, reps, duration)"><Input value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Patient tolerance"><Select value={f.tolerance} onChange={(e) => setF({ ...f, tolerance: e.target.value })}><option>Good</option><option>Fair</option><option>Poor</option></Select></Field>
          <Field label="Adverse response"><Input value={f.adverse} onChange={(e) => setF({ ...f, adverse: e.target.value })} /></Field>
        </div>
        <Field label="Session notes"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="!min-h-[56px]" /></Field>
        <Field label="Next-session plan"><Input value={f.nextPlan} onChange={(e) => setF({ ...f, nextPlan: e.target.value })} /></Field>
        <Toggle checked={f.shared} onChange={(v) => setF({ ...f, shared: v })} label="Share an approved summary with the patient" />
        <Button full size="lg" disabled={!f.subjective || !f.objective} onClick={() => {
          const th = staff.find((s) => s.name === ACTORS[role])?.id ?? p.therapistId
          add({ patientId: p.id, no, date: todayISO(), therapistId: th, ...f })
          toast(`Session #${no} documented`)
          setF(blank)
          onClose()
        }}>Finalise session note</Button>
      </div>
    </Sheet>
  )
}
