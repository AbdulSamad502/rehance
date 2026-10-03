import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Chip, Field, KV, Notice, Sheet, Textarea, toast } from '../../../components/ui'
import { summaryRows } from '../../../components/ConfigForm'
import { CLINICAL, GENERAL, NEURO, orthoTemplate } from '../../../data/templates'
import { fmtDate } from '../../../lib/utils'
import { useStore } from '../../../store'
import { H, Screen, usePatient } from '../ui'

const KINDS = ['New medication', 'Allergy', 'New symptom', 'Medical history change', 'Correct my details'] as const

export default function Medical() {
  const db = useStore()
  const p = usePatient()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<(typeof KINDS)[number]>('New medication')
  const [text, setText] = useState('')
  const h = p.history
  const a = db.assessments.filter((x) => x.patientId === p.id && x.status === 'final').sort((x, y) => y.date.localeCompare(x.date))[0]
  const tpl = a ? (a.kind === 'general' ? GENERAL : a.kind === 'clinical' ? CLINICAL : a.kind === 'neuro' ? NEURO : orthoTemplate(a.region ?? 'Knee')) : null
  const rows = a && tpl ? summaryRows(tpl, a.data).filter(([k]) => !/note|impression|special/i.test(k)).slice(0, 7) : []
  const mine = db.requests.filter((r) => r.patientId === p.id && ['History update', 'Profile correction'].includes(r.kind))

  return (
    <Screen title="My medical information">
      <Card>
        <div className="text-xs font-bold uppercase tracking-wide text-muted">Current condition</div>
        <div className="mt-1 text-base font-extrabold">{p.condition}</div>
        <div className="text-sm text-muted">{p.episodeTitle} · since {fmtDate(p.episodeStart)}</div>
      </Card>

      {(h.contraindications !== 'None' || h.redFlags !== 'None identified') && (
        <Notice tone="amber" title="Precautions to remember">{h.contraindications !== 'None' && <p>{h.contraindications}</p>}{h.redFlags !== 'None identified' && <p>{h.redFlags}</p>}</Notice>
      )}

      <div>
        <H>From my record</H>
        <Card>
          <KV k="Conditions" v={[h.diabetes.has && 'Diabetes', h.hypertension && 'Hypertension', h.cardiac.has && 'Heart condition', h.stroke.has && 'Stroke'].filter(Boolean).join(', ') || 'None recorded'} />
          <KV k="Surgeries" v={h.surgeries} />
          <KV k="Medication" v={h.medications} />
          <KV k="Allergies" v={h.allergies} />
          <KV k="Last updated" v={fmtDate(h.updatedAt)} />
        </Card>
      </div>

      {a && rows.length > 0 && (
        <div>
          <H>Assessment summary <Badge tone="green">Approved by your therapist</Badge></H>
          <Card><KV k="Assessment date" v={fmtDate(a.date)} />{rows.map(([k, v]) => <KV key={k} k={k} v={v} />)}</Card>
        </div>
      )}

      <div>
        <H>Previous treatment</H>
        <Card>
          <KV k="Sessions completed" v={db.appointments.filter((x) => x.patientId === p.id && x.status === 'Completed').length} />
          <KV k="Treatments used" v={[...new Set(db.sessions.filter((s) => s.patientId === p.id).flatMap((s) => s.treatment))].join(', ') || 'None yet'} />
          <KV k="Started" v={fmtDate(p.episodeStart)} />
          <Link to="/patient/sessions" className="mt-2 block text-sm font-bold text-brand-600">See session summaries →</Link>
        </Card>
      </div>

      <Card className="border-brand-100 bg-brand-50/40">
        <div className="text-sm font-extrabold">Something changed?</div>
        <p className="mt-0.5 text-sm text-muted">Tell your clinic about new medication, allergies or symptoms. Your therapist reviews it before it goes into your record.</p>
        <Button className="mt-3" full onClick={() => setOpen(true)}>Submit an update</Button>
      </Card>

      {mine.length > 0 && (
        <div><H>My submissions</H><div className="space-y-2">{mine.map((r) => <Card key={r.id} className="!p-3"><div className="flex items-center justify-between"><span className="text-sm font-bold">{r.kind}</span><Badge tone={r.status === 'open' ? 'amber' : 'green'}>{r.status === 'open' ? 'Awaiting review' : 'Added to record'}</Badge></div><p className="text-sm text-muted">{r.text}</p></Card>)}</div></div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Submit an update">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">{KINDS.map((k) => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{k}</Chip>)}</div>
          <Field label="Details"><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe the change" /></Field>
          <Button full disabled={!text} onClick={() => { db.addRequest({ patientId: p.id, kind: kind === 'Correct my details' ? 'Profile correction' : 'History update', text: `${kind}: ${text}` }); toast('Sent for your therapist to review'); setText(''); setOpen(false) }}>Send</Button>
        </div>
      </Sheet>
    </Screen>
  )
}
