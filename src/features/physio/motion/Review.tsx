import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Flag, RotateCcw, XCircle } from 'lucide-react'
import { TrendChart } from '../../../components/charts'
import { Avatar, Badge, Button, Card, Empty, Field, Input, Notice, PageHeader, SectionTitle, Textarea, Toggle, toast } from '../../../components/ui'
import { fmtDate, fmtDateTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import { replayCache, ReplayPlayer, ResultSummary, STATUS_META } from './ResultSummary'

export default function Review() {
  const { id } = useParams()
  const nav = useNavigate()
  const m = useStore((s) => s.motions.find((x) => x.id === id))
  const motions = useStore((s) => s.motions)
  const assessments = useStore((s) => s.assessments)
  const sessions = useStore((s) => s.sessions)
  const patient = useStore((s) => s.patients.find((p) => p.id === m?.patientId))
  const review = useStore((s) => s.reviewMotion)
  const [manual, setManual] = useState(m?.manualValue?.toString() ?? '')
  const [note, setNote] = useState(m?.annotation ?? '')
  const [share, setShare] = useState(true)

  if (!m || !patient) return <Empty title="Analysis not found" action={<Link to="/physio/motion" className="font-semibold text-brand-600">Back to Motion Analysis</Link>} />

  const history = motions.filter((x) => x.patientId === m.patientId)
  const nearest = <T extends { date: string }>(list: T[]) => [...list].sort((a, b) => Math.abs(new Date(a.date).getTime() - new Date(m.at).getTime()) - Math.abs(new Date(b.date).getTime() - new Date(m.at).getTime()))[0]
  const linkedAssess = nearest(assessments.filter((a) => a.patientId === m.patientId && a.status === 'final' && (a.kind !== 'ortho' || a.region === m.region || m.category !== 'rom')))
  const linkedSession = nearest(sessions.filter((s) => s.patientId === m.patientId))
  const replay = replayCache.get(m.id)
  const meta = STATUS_META[m.status]
  const manualNum = manual === '' ? null : Number(manual)
  const diff = manualNum !== null && Number.isFinite(manualNum) ? Math.round((m.headline - manualNum) * 10) / 10 : null
  const agree = diff !== null && Math.abs(diff) <= 5

  const trend = history
    .filter((x) => x.movementId === m.movementId && x.side === m.side && (x.status === 'approved' || x.id === m.id))
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((x) => ({ x: fmtDate(x.at), ai: x.headline, manual: x.manualValue ?? null }))

  const act = (status: 'approved' | 'rejected' | 'repeat') => {
    review(m.id, { status, manualValue: manualNum ?? undefined, annotation: note || undefined, visibleToPatient: status === 'approved' && share })
    toast(status === 'approved' ? 'Approved and saved to the clinical record' : status === 'repeat' ? 'Flagged for repeat capture' : 'Analysis rejected', status === 'approved' ? 'ok' : 'info')
    nav(`/physio/patients/${patient.id}?tab=motion`)
  }

  return (
    <div className="fade-up">
      <PageHeader title="Review motion analysis" back={() => nav(-1)} actions={<Badge tone={meta.tone}>{meta.label}</Badge>} subtitle={`${m.movementLabel} · captured ${fmtDateTime(m.at)} · ${m.source}`} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <ResultSummary m={m} history={history} />
          {trend.length > 1 && (
            <Card>
              <SectionTitle title="Progress across approved analyses" />
              <TrendChart data={trend} lines={[{ key: 'ai', name: 'AI estimate', color: '#1a68b5' }, { key: 'manual', name: 'Manual measurement', color: '#14a3a8', dashed: true }]} target={m.category === 'rom' ? m.target : undefined} unit={m.unit} height={200} />
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <Link to={`/physio/patients/${patient.id}`} className="flex items-center gap-3">
              <Avatar name={patient.name} tint={patient.tint} />
              <div className="min-w-0"><div className="truncate text-sm font-bold">{patient.name}</div><div className="truncate text-xs text-muted">{patient.code} · {patient.condition}</div></div>
            </Link>
          </Card>

          <Card className="!p-3.5">
            <div className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-muted">Linked records</div>
            <div className="space-y-1.5 text-sm">
              {linkedAssess ? <Link to={`/physio/patients/${patient.id}?tab=assess`} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 hover:bg-brand-50"><span><b>{linkedAssess.kind[0].toUpperCase() + linkedAssess.kind.slice(1)} assessment</b>{linkedAssess.region ? ` (${linkedAssess.region})` : ''}</span><span className="text-xs text-muted">{fmtDate(linkedAssess.date)}</span></Link> : <p className="text-muted">No assessment on file.</p>}
              {linkedSession ? <Link to={`/physio/patients/${patient.id}?tab=sessions`} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 hover:bg-brand-50"><span><b>Session #{linkedSession.no}</b> · pain {linkedSession.painBefore}→{linkedSession.painAfter}</span><span className="text-xs text-muted">{fmtDate(linkedSession.date)}</span></Link> : <p className="text-muted">No session documented yet.</p>}
              <Link to={`/physio/patients/${patient.id}?tab=motion`} className="block rounded-lg bg-surface px-3 py-2 hover:bg-brand-50"><b>All motion analyses</b> for {patient.name.split(' ')[0]}</Link>
            </div>
          </Card>

          {replay && replay.frames.length > 0 && <ReplayPlayer replay={replay} />}

          {m.status === 'pending' ? (
            <Card>
              <h3 className="mb-1 text-[15px] font-bold">Clinical review</h3>
              <p className="mb-3 text-[13px] text-muted">Compare the AI estimate with your own measurement, add clinical notes, then decide. Only approved results are saved to the record.</p>
              <Field label={`Your manual measurement (${m.unit})`} hint="e.g. goniometer reading taken in the same session">
                <Input type="number" inputMode="decimal" value={manual} onChange={(e) => setManual(e.target.value)} placeholder={`AI estimate: ${m.headline}`} />
              </Field>
              {diff !== null && (
                <div className="mt-3"><Notice tone={agree ? 'green' : 'amber'} title={agree ? 'Within 5° of your measurement' : `Differs by ${Math.abs(diff)}${m.unit}`}>{agree ? 'The AI estimate agrees with your manual reading.' : 'Consider repeating the capture or relying on the manual value.'}</Notice></div>
              )}
              <Field label="Clinical observations" className="mt-3"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Compensations, pain behaviour, patient effort…" /></Field>
              <div className="mt-3"><Toggle checked={share} onChange={setShare} label="Share approved feedback with the patient" /></div>
              <div className="mt-4 grid gap-2">
                <Button variant="teal" size="lg" icon={<CheckCircle2 size={18} />} onClick={() => act('approved')}>Approve and save to record</Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" icon={<Flag size={16} />} onClick={() => act('repeat')}>Repeat capture</Button>
                  <Button variant="secondary" className="!text-bad" icon={<XCircle size={16} />} onClick={() => act('rejected')}>Reject</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <h3 className="mb-2 text-[15px] font-bold">Review decision</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">Status</span><Badge tone={meta.tone}>{meta.label}</Badge></div>
                <div className="flex justify-between"><span className="text-muted">Reviewed by</span><span className="font-semibold">{m.reviewedBy}</span></div>
                {m.manualValue !== undefined && <div className="flex justify-between"><span className="text-muted">Manual measurement</span><span className="font-semibold">{m.manualValue}{m.unit}</span></div>}
                <div className="flex justify-between"><span className="text-muted">Visible to patient</span><span className="font-semibold">{m.visibleToPatient ? 'Yes' : 'No'}</span></div>
              </div>
              {m.annotation && <p className="mt-3 rounded-xl bg-surface p-3 text-[13px] text-slate-700">{m.annotation}</p>}
              <Button className="mt-3" full variant="secondary" icon={<RotateCcw size={16} />} onClick={() => review(m.id, { status: 'pending', visibleToPatient: false })}>Reopen review</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
