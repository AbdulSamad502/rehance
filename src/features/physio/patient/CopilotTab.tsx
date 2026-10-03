import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Search, Sparkles } from 'lucide-react'
import { Badge, Button, Card, Chip, Input, Notice, SectionTitle, SimBadge, Textarea, Toggle, toast } from '../../../components/ui'
import { ACTORS } from '../../../store'
import { DRAFT_KINDS, draftFor, missingDocumentation, recordAnswer, recordSearch, RECORD_QUERIES, type DraftKind, type RecordQuery } from '../../../lib/copilot'
import { fmtDateTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { Patient } from '../../../types'

export default function CopilotTab({ p }: { p: Patient }) {
  const db = useStore()
  const [kind, setKind] = useState<DraftKind>('SOAP note')
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [ask, setAsk] = useState<RecordQuery | null>(null)
  const [share, setShare] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const missing = missingDocumentation(db, p)
  const hits = recordSearch(db, p, q)
  const saved = db.drafts.filter((d) => d.patientId === p.id)
  const canEdit = db.ui.physioRole === 'physio'

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const generate = (k: DraftKind) => {
    setKind(k)
    setDraftId(null)
    const full = draftFor(k, db, p)
    if (timer.current) clearInterval(timer.current)
    setText('')
    setTyping(true)
    let i = 0
    timer.current = setInterval(() => {
      i += 9
      setText(full.slice(0, i))
      if (i >= full.length) { clearInterval(timer.current!); setTyping(false) }
    }, 16)
  }

  const save = (approve: boolean) => {
    const patch = approve ? { text, status: 'approved' as const, signedBy: ACTORS[db.ui.physioRole], shared: share && canShare } : { text, status: 'draft' as const }
    if (draftId) db.updateDraft(draftId, patch)
    else {
      const id = db.addDraft({ patientId: p.id, kind, text })
      db.updateDraft(id, patch)
      setDraftId(id)
    }
    toast(approve ? (share && canShare ? 'Approved, signed and shared with the patient' : 'Approved and signed. Added to the record') : 'Draft saved')
  }
  const canShare = ['Progress report', 'Reassessment summary', 'Discharge summary'].includes(kind)

  return (
    <div className="space-y-5">
      <Card className="border-teal-100 bg-gradient-to-br from-teal-50/70 to-white">
        <SectionTitle title={<span className="inline-flex items-center gap-2"><Sparkles size={16} className="text-teal-600" /> Documentation copilot</span>} action={<SimBadge label="Template engine, no LLM" />} />
        <p className="mb-3 text-sm text-muted">Drafts are assembled from the recorded data and stay <b>drafts</b> until you review and approve them.</p>
        <div className="flex flex-wrap gap-1.5">{DRAFT_KINDS.map((k) => <Chip key={k} active={kind === k && !!text} onClick={() => canEdit && generate(k)}>{k}</Chip>)}</div>
        {!canEdit && <p className="mt-2 text-xs text-amber-700">Switch to the Physiotherapist role to draft and approve notes.</p>}
        {(text || typing) && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2"><Badge tone="amber">Draft · needs clinician approval</Badge>{typing && <span className="text-xs text-muted">Drafting…</span>}</div>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="!min-h-[260px] font-mono !text-[13px] leading-relaxed" />
            {canShare && <Toggle checked={share} onChange={setShare} label="Share the approved summary with the patient in their app" />}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => save(false)} disabled={typing}>Save draft</Button>
              <Button variant="teal" icon={<CheckCircle2 size={16} />} onClick={() => save(true)} disabled={typing}>Review and approve</Button>
              <Button variant="ghost" onClick={() => generate(kind)}>Regenerate</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Missing documentation" />
          {missing.length ? <ul className="space-y-1.5">{missing.map((m) => <li key={m} className="flex items-start gap-2 text-sm"><AlertCircle size={15} className="mt-0.5 shrink-0 text-warn" />{m}</li>)}</ul> : <Notice tone="green">Documentation looks complete.</Notice>}
        </Card>
        <Card>
          <SectionTitle title="Record assistant" />
          <div className="mb-3 flex flex-wrap gap-1.5">{RECORD_QUERIES.map((r) => <Chip key={r} active={ask === r} onClick={() => setAsk(ask === r ? null : r)}>{r}</Chip>)}</div>
          {ask && <pre className="mb-3 whitespace-pre-wrap rounded-xl bg-teal-50/60 p-3 font-sans text-[13px] leading-relaxed text-slate-800">{recordAnswer(ask, db, p)}</pre>}
          <div className="relative"><Search size={15} className="absolute left-3 top-3.5 text-muted" /><Input className="pl-9" placeholder="Search this patient's record (e.g. stairs, swelling)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="mt-3 space-y-2">
            {hits.map((h, i) => <div key={i} className="rounded-xl bg-surface p-2.5 text-[13px]"><div className="mb-0.5 flex items-center gap-2"><Badge tone="blue">{h.type}</Badge><span className="text-xs text-muted">{h.when}</span></div>{h.text}</div>)}
            {q && !hits.length && <p className="text-sm text-muted">No matches in this record.</p>}
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle title="Saved drafts and notes" />
        {saved.length === 0 ? <p className="text-sm text-muted">Nothing saved yet.</p> : (
          <div className="space-y-2">
            {saved.map((d) => (
              <Card key={d.id} className="!p-3.5">
                <div className="mb-1 flex items-center justify-between"><div className="text-sm font-bold">{d.kind}</div><div className="flex gap-1.5">{d.shared && <Badge tone="teal">Shared with patient</Badge>}<Badge tone={d.status === 'approved' ? 'green' : 'amber'}>{d.status}</Badge></div></div>
                <pre className="whitespace-pre-wrap font-sans text-[13px] text-slate-700">{d.text}</pre>
                <div className="mt-1 text-[11px] text-slate-400">{fmtDateTime(d.at)}{d.signedBy ? ` · Signed by ${d.signedBy}` : ''}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
