import { useState } from 'react'
import { Edit3, ShieldAlert } from 'lucide-react'
import { Badge, Button, Card, Field, Input, KV, Notice, SectionTitle, Sheet, Textarea, Toggle, toast } from '../../../components/ui'
import { fmtDate, fmtDateTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { MedicalHistory, Patient } from '../../../types'

export default function HistoryTab({ p }: { p: Patient }) {
  const reqs = useStore((s) => s.requests).filter((r) => r.patientId === p.id && r.kind === 'History update' && r.status === 'open')
  const resolve = useStore((s) => s.resolveRequest)
  const update = useStore((s) => s.updateHistory)
  const [edit, setEdit] = useState(false)
  const h = p.history

  return (
    <div className="space-y-4">
      {reqs.map((r) => (
        <Notice key={r.id} tone="amber" title="Patient-submitted update awaiting review">
          <p className="mb-2">"{r.text}" <span className="text-xs text-muted">({fmtDateTime(r.at)})</span></p>
          <Button size="sm" variant="secondary" onClick={() => { update(p.id, { notes: `${h.notes ? h.notes + '\n' : ''}[${fmtDate(r.at)}] Patient reported: ${r.text}` }, 'Patient submission (verified by therapist)'); resolve(r.id); toast('Added to medical history') }}>Incorporate into record</Button>
        </Notice>
      ))}

      {(h.redFlags !== 'None identified' || h.contraindications !== 'None') && (
        <Notice tone="red" title="Red flags and contraindications">
          <div className="flex items-start gap-2"><ShieldAlert size={15} className="mt-0.5 shrink-0" /><div>{h.redFlags !== 'None identified' && <p>Red flags: {h.redFlags}</p>}{h.contraindications !== 'None' && <p>Contraindications: {h.contraindications}</p>}</div></div>
        </Notice>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Source: {h.source} · Updated {fmtDate(h.updatedAt)}</p>
        <Button size="sm" variant="soft" icon={<Edit3 size={14} />} onClick={() => setEdit(true)}>Update history</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle title="Diabetes" action={<Badge tone={h.diabetes.has ? 'amber' : 'gray'}>{h.diabetes.has ? 'Yes' : 'No'}</Badge>} />
          {h.diabetes.has ? (<><KV k="Type" v={h.diabetes.type || '–'} /><KV k="Duration" v={h.diabetes.duration || '–'} /><KV k="Medication" v={h.diabetes.meds || '–'} /><KV k="Precautions" v={h.diabetes.precautions || '–'} /></>) : <p className="text-sm text-muted">No diabetes recorded.</p>}
        </Card>
        <Card>
          <SectionTitle title="Cardiac" action={<Badge tone={h.cardiac.has ? 'amber' : 'gray'}>{h.cardiac.has ? 'Yes' : 'No'}</Badge>} />
          {h.cardiac.has ? (<><KV k="Condition" v={h.cardiac.condition || '–'} /><KV k="Treatment" v={h.cardiac.treatment || '–'} /><KV k="Precautions" v={h.cardiac.precautions || '–'} /></>) : <p className="text-sm text-muted">No cardiac condition recorded.</p>}
        </Card>
        <Card>
          <SectionTitle title="Stroke" action={<Badge tone={h.stroke.has ? 'amber' : 'gray'}>{h.stroke.has ? 'Yes' : 'No'}</Badge>} />
          {h.stroke.has ? (<><KV k="Date" v={h.stroke.date || '–'} /><KV k="Affected side" v={h.stroke.side || '–'} /><KV k="Residual symptoms" v={h.stroke.residual || '–'} /><KV k="Precautions" v={h.stroke.precautions || '–'} /></>) : <p className="text-sm text-muted">No stroke recorded.</p>}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Additional medical history" />
        <KV k="Hypertension" v={h.hypertension ? 'Yes' : 'No'} />
        <KV k="Previous surgeries" v={h.surgeries} />
        <KV k="Previous injuries" v={h.injuries} />
        <KV k="Neurological conditions" v={h.neuro} />
        <KV k="Musculoskeletal conditions" v={h.msk} />
        <KV k="Current medication" v={h.medications} />
        <KV k="Allergies" v={h.allergies} />
        <KV k="Investigations and imaging" v={h.imaging} />
        <KV k="Previous physiotherapy" v={h.previousPhysio} />
        <KV k="Additional notes" v={h.notes || '–'} />
      </Card>
      <HistorySheet p={p} open={edit} onClose={() => setEdit(false)} />
    </div>
  )
}

function HistorySheet({ p, open, onClose }: { p: Patient; open: boolean; onClose: () => void }) {
  const update = useStore((s) => s.updateHistory)
  const [h, setH] = useState<MedicalHistory>(p.history)
  const t = (k: keyof MedicalHistory, v: string) => setH((x) => ({ ...x, [k]: v }))
  return (
    <Sheet open={open} onClose={onClose} title="Update medical history" wide>
      <div className="space-y-4">
        <div className="rounded-2xl border border-line p-3">
          <Toggle checked={h.diabetes.has} onChange={(v) => setH({ ...h, diabetes: { ...h.diabetes, has: v } })} label="Diabetes" />
          {h.diabetes.has && <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field label="Type"><Input value={h.diabetes.type ?? ''} onChange={(e) => setH({ ...h, diabetes: { ...h.diabetes, type: e.target.value } })} /></Field>
            <Field label="Duration"><Input value={h.diabetes.duration ?? ''} onChange={(e) => setH({ ...h, diabetes: { ...h.diabetes, duration: e.target.value } })} /></Field>
            <Field label="Current medication"><Input value={h.diabetes.meds ?? ''} onChange={(e) => setH({ ...h, diabetes: { ...h.diabetes, meds: e.target.value } })} /></Field>
            <Field label="Precautions"><Input value={h.diabetes.precautions ?? ''} onChange={(e) => setH({ ...h, diabetes: { ...h.diabetes, precautions: e.target.value } })} /></Field>
          </div>}
        </div>
        <div className="rounded-2xl border border-line p-3">
          <Toggle checked={h.cardiac.has} onChange={(v) => setH({ ...h, cardiac: { ...h.cardiac, has: v } })} label="Cardiac condition" />
          {h.cardiac.has && <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field label="Condition"><Input value={h.cardiac.condition ?? ''} onChange={(e) => setH({ ...h, cardiac: { ...h.cardiac, condition: e.target.value } })} /></Field>
            <Field label="Treatment"><Input value={h.cardiac.treatment ?? ''} onChange={(e) => setH({ ...h, cardiac: { ...h.cardiac, treatment: e.target.value } })} /></Field>
            <Field label="Precautions" className="sm:col-span-2"><Input value={h.cardiac.precautions ?? ''} onChange={(e) => setH({ ...h, cardiac: { ...h.cardiac, precautions: e.target.value } })} /></Field>
          </div>}
        </div>
        <div className="rounded-2xl border border-line p-3">
          <Toggle checked={h.stroke.has} onChange={(v) => setH({ ...h, stroke: { ...h.stroke, has: v } })} label="Stroke" />
          {h.stroke.has && <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field label="Date of stroke"><Input value={h.stroke.date ?? ''} onChange={(e) => setH({ ...h, stroke: { ...h.stroke, date: e.target.value } })} /></Field>
            <Field label="Affected side"><Input value={h.stroke.side ?? ''} onChange={(e) => setH({ ...h, stroke: { ...h.stroke, side: e.target.value } })} /></Field>
            <Field label="Residual symptoms"><Input value={h.stroke.residual ?? ''} onChange={(e) => setH({ ...h, stroke: { ...h.stroke, residual: e.target.value } })} /></Field>
            <Field label="Precautions"><Input value={h.stroke.precautions ?? ''} onChange={(e) => setH({ ...h, stroke: { ...h.stroke, precautions: e.target.value } })} /></Field>
          </div>}
        </div>
        <Toggle checked={h.hypertension} onChange={(v) => setH({ ...h, hypertension: v })} label="Hypertension" />
        {([['surgeries', 'Previous surgeries'], ['injuries', 'Previous injuries'], ['neuro', 'Neurological conditions'], ['msk', 'Musculoskeletal conditions'], ['medications', 'Current medication'], ['allergies', 'Allergies'], ['imaging', 'Investigations and imaging'], ['previousPhysio', 'Previous physiotherapy'], ['redFlags', 'Red flags'], ['contraindications', 'Contraindications'], ['notes', 'Additional notes']] as const).map(([k, label]) => (
          <Field key={k} label={label}><Textarea value={h[k] as string} onChange={(e) => t(k, e.target.value)} className="!min-h-[56px]" /></Field>
        ))}
        <Button full size="lg" onClick={() => { update(p.id, h, 'Therapist entry'); toast('Medical history updated'); onClose() }}>Save history</Button>
      </div>
    </Sheet>
  )
}
