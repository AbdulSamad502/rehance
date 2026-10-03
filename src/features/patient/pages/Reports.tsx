import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Badge, Button, Card, Sheet } from '../../../components/ui'
import { draftFor } from '../../../lib/copilot'
import { motionsOf } from '../../../lib/derive'
import { fmtDate } from '../../../lib/utils'
import { useStore } from '../../../store'
import { Screen, usePatient } from '../ui'

interface Doc { id: string; title: string; sub: string; body: string; tone: 'blue' | 'teal' | 'green' }

export default function Reports() {
  const db = useStore()
  const p = usePatient()
  const [sel, setSel] = useState<Doc | null>(null)
  const docs: Doc[] = []
  const ms = motionsOf(db, p.id, true)
  const last = ms[ms.length - 1]
  if (last) docs.push({ id: 'motion', title: 'Movement analysis report', sub: `${last.movementLabel} · ${fmtDate(last.at)}`, tone: 'teal', body: `${last.movementLabel} (${last.side})\nResult: ${last.headline}${last.unit}${last.target ? ` (goal ${last.target}${last.unit})` : ''}\nRepetitions: ${last.reps.length}\n${last.observations.join('\n')}\n\nApproved by ${last.reviewedBy}. Camera estimates are guidance, not a diagnosis.` })
  const fin = db.assessments.find((a) => a.patientId === p.id && a.status === 'final')
  if (fin) docs.push({ id: 'assess', title: 'Assessment summary', sub: `${fmtDate(fin.date)} · approved`, tone: 'blue', body: draftFor('Assessment summary', db, p).replace(/\n\[Draft.*$/s, '') })
  if (db.sessions.some((s) => s.patientId === p.id && s.shared)) docs.push({ id: 'progress', title: 'Progress report', sub: 'Shared by your therapist', tone: 'blue', body: draftFor('Progress report', db, p).replace(/\n\n\[Draft.*$/s, '') })
  db.drafts.filter((d) => d.patientId === p.id && d.shared && d.status === 'approved').forEach((d) => docs.push({ id: d.id, title: d.kind, sub: `Signed by ${d.signedBy ?? 'your therapist'} · ${fmtDate(d.at.slice(0, 10))}`, tone: 'green', body: d.text }))
  const hep = db.assignments.filter((a) => a.patientId === p.id && a.status === 'Active')
  if (hep.length) docs.push({ id: 'hep', title: 'Home exercise instructions', sub: `${hep.length} exercises`, tone: 'green', body: 'Your home exercise programme is in the Exercises tab with instructions for each movement.' })
  if (p.status === 'discharged') docs.push({ id: 'discharge', title: 'Discharge summary', sub: 'Episode closed', tone: 'green', body: draftFor('Discharge summary', db, p).replace(/\n\n\[Draft.*$/s, '') })

  return (
    <Screen title="Reports & documents">
      {docs.length === 0 && <Card className="text-center text-sm text-muted">Reports your therapist approves will appear here.</Card>}
      <div className="space-y-2.5">
        {docs.map((d) => (
          <Card key={d.id} onClick={() => setSel(d)} className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><FileText /></div>
            <div className="min-w-0 flex-1"><div className="text-sm font-bold">{d.title}</div><div className="text-xs text-muted">{d.sub}</div></div>
            <Badge tone={d.tone}>Approved</Badge>
          </Card>
        ))}
      </div>
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel?.title} wide>
        {sel && <div className="print-area space-y-3"><pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{sel.body}</pre><Button full variant="secondary" icon={<Download size={16} />} onClick={() => window.print()}>Download / print</Button></div>}
      </Sheet>
    </Screen>
  )
}
