import { useMemo, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { TrendChart } from '../../../components/charts'
import { Badge, Button, Card, Chip, Field, Input, Notice, ProgressBar, SectionTitle, Sheet, toast } from '../../../components/ui'
import { OUTCOMES } from '../../../data/catalog'
import { adherence, daysSinceLastLog, motionsOf } from '../../../lib/derive'
import { addDays, daysFromToday, fmtDate, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { Patient } from '../../../types'

export default function ProgressTab({ p }: { p: Patient }) {
  const db = useStore()
  const sessions = db.sessions.filter((s) => s.patientId === p.id).sort((a, b) => a.no - b.no)
  const outcomes = db.outcomes.filter((o) => o.patientId === p.id)
  const measures = [...new Set(outcomes.map((o) => o.measure))]
  const [measure, setMeasure] = useState(measures[0] ?? 'KOOS')
  const [add, setAdd] = useState(false)
  const motions = motionsOf(db, p.id).filter((m) => m.status === 'approved')
  const primary = motions.length ? motions[motions.length - 1] : null
  const rom = motions.filter((m) => primary && m.movementId === primary.movementId && m.side === primary.side)
  const goals = db.goals.filter((g) => g.patientId === p.id)
  const meta = OUTCOMES.find((o) => o.id === measure)
  const series = outcomes.filter((o) => o.measure === measure).sort((a, b) => a.date.localeCompare(b.date))

  const painData = sessions.map((s) => ({ x: `#${s.no}`, before: s.painBefore, after: s.painAfter }))
  const romData = rom.map((m) => ({ x: fmtDate(m.at), ai: m.headline, manual: m.manualValue ?? null }))
  const scoreData = series.map((o) => ({ x: fmtDate(o.date), score: o.score }))

  // weekly adherence trend
  const weekly = useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const from = addDays(todayISO(), -(27 - i * 7)), to = addDays(from, 6)
    const act = db.assignments.filter((a) => a.patientId === p.id && a.status === 'Active').length || 1
    const n = new Set(db.logs.filter((l) => l.patientId === p.id && l.date >= from && l.date <= to).map((l) => `${l.assignmentId}|${l.date}`)).size
    return { x: `Wk ${i + 1}`, adherence: Math.min(100, Math.round((n / (act * 7)) * 100)) }
  }), [db.logs, db.assignments, p.id])

  // Recovery intelligence: transparent, rule-based, clearly separated from measured data
  const insights: { tone: 'blue' | 'amber' | 'green'; text: string }[] = []
  if (sessions.length >= 2) {
    const first = sessions[0], last = sessions[sessions.length - 1]
    insights.push({ tone: 'green', text: `Recorded pain before treatment fell from ${first.painBefore}/10 to ${last.painBefore}/10 across ${sessions.length} sessions.` })
  }
  if (rom.length >= 2) insights.push({ tone: 'green', text: `${primary!.movementLabel}: ${rom[0].headline}${primary!.unit} at baseline to ${rom[rom.length - 1].headline}${primary!.unit} now (approved measurements).` })
  const ad = adherence(db, p.id, 7)
  const gap = daysSinceLastLog(db, p.id)
  if (ad !== null && ad < 50) insights.push({ tone: 'amber', text: `Home-exercise adherence is ${ad}% this week${gap !== null && gap >= 3 ? ` and nothing has been logged for ${gap} days` : ''}.` })
  const lastRe = db.appointments.filter((a) => a.patientId === p.id && a.type === 'Reassessment' && a.status === 'Completed').map((a) => a.date).sort().pop()
  if (p.status === 'active' && (!lastRe || lastRe < daysFromToday(-14))) insights.push({ tone: 'amber', text: 'No reassessment recorded in the last 14 days. Consider scheduling one.' })
  const unreviewed = db.checkins.filter((c) => c.patientId === p.id && !c.reviewed).length
  if (unreviewed) insights.push({ tone: 'amber', text: `${unreviewed} patient-reported symptom check-in is awaiting review.` })

  return (
    <div className="space-y-5">
      <Card className="border-teal-100 bg-teal-50/40">
        <SectionTitle title={<span className="inline-flex items-center gap-2"><Sparkles size={16} className="text-teal-600" /> Recovery intelligence</span>} action={<Badge tone="teal">Rule-based summary</Badge>} />
        <div className="space-y-2">{insights.length ? insights.map((i) => <Notice key={i.text} tone={i.tone === 'green' ? 'green' : 'amber'}>{i.text}</Notice>) : <p className="text-sm text-muted">Not enough recorded data yet.</p>}</div>
        <p className="mt-2 text-[11px] text-muted">Summaries describe recorded measurements only. They do not determine recovery or replace clinical judgement.</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Pain across sessions" action={<Badge tone="blue">Measured</Badge>} />
          {painData.length ? <TrendChart data={painData} lines={[{ key: 'before', name: 'Before treatment', color: '#d98e04' }, { key: 'after', name: 'After treatment', color: '#1f9d6b' }]} yDomain={[0, 10]} height={200} /> : <p className="text-sm text-muted">No session pain scores yet.</p>}
        </Card>
        <Card>
          <SectionTitle title={primary ? `${primary.movementLabel}: ${primary.side}` : 'Range of motion'} action={<Badge tone="teal">AI estimate · therapist approved</Badge>} />
          {romData.length ? <TrendChart data={romData} lines={[{ key: 'ai', name: 'AI estimate', color: '#1a68b5' }, { key: 'manual', name: 'Manual', color: '#14a3a8', dashed: true }]} target={primary?.target} unit={primary?.unit} height={200} /> : <p className="text-sm text-muted">No approved motion analyses yet.</p>}
        </Card>
        <Card>
          <SectionTitle title="Outcome measures" action={<Button size="sm" variant="soft" icon={<Plus size={14} />} onClick={() => setAdd(true)}>Record score</Button>} />
          <div className="mb-2 flex flex-wrap gap-1.5">{(measures.length ? measures : [measure]).map((m) => <Chip key={m} active={measure === m} onClick={() => setMeasure(m)}>{m}</Chip>)}</div>
          {meta && <p className="mb-2 text-xs text-muted">{meta.name}: {meta.blurb}. {meta.higherBetter ? 'Higher is better.' : 'Lower is better.'}</p>}
          {scoreData.length ? <TrendChart data={scoreData} lines={[{ key: 'score', name: measure, color: '#7c5cd6' }]} height={190} unit={meta?.unit === 's' ? ' s' : ''} /> : <p className="text-sm text-muted">No scores recorded for {measure}.</p>}
          {series.length >= 2 && <div className="mt-2 text-sm">Baseline <b>{series[0].score}</b> → latest <b>{series[series.length - 1].score}</b> <Badge tone={(series[series.length - 1].score - series[0].score > 0) === !!meta?.higherBetter ? 'green' : 'amber'}>{series[series.length - 1].score - series[0].score > 0 ? '+' : ''}{Math.round((series[series.length - 1].score - series[0].score) * 10) / 10}</Badge></div>}
        </Card>
        <Card>
          <SectionTitle title="Exercise adherence trend" />
          <TrendChart data={weekly} lines={[{ key: 'adherence', name: 'Adherence %', color: '#14a3a8' }]} yDomain={[0, 100]} unit="%" height={190} area />
        </Card>
      </div>

      <Card>
        <SectionTitle title="Goal achievement" />
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => (
            <div key={g.id}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{g.text}</span><b>{g.progress}%</b></div><ProgressBar value={g.progress} tone={g.progress >= 100 ? 'green' : 'blue'} /></div>
          ))}
        </div>
      </Card>

      <ScoreSheet p={p} open={add} onClose={() => setAdd(false)} defaultMeasure={measure} />
    </div>
  )
}

function ScoreSheet({ p, open, onClose, defaultMeasure }: { p: Patient; open: boolean; onClose: () => void; defaultMeasure: string }) {
  const addOutcome = useStore((s) => s.addOutcome)
  const [m, setM] = useState(defaultMeasure)
  const [score, setScore] = useState('')
  return (
    <Sheet open={open} onClose={onClose} title="Record outcome measure">
      <div className="space-y-3">
        <Field label="Measure"><div className="flex flex-wrap gap-1.5">{OUTCOMES.map((o) => <Chip key={o.id} active={m === o.id} onClick={() => setM(o.id)}>{o.name}</Chip>)}</div></Field>
        <Field label={`Score ${OUTCOMES.find((o) => o.id === m)?.unit ?? ''}`}><Input type="number" inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} /></Field>
        <Button full disabled={score === ''} onClick={() => { addOutcome({ patientId: p.id, measure: m, date: todayISO(), score: Number(score) }); toast(`${m} recorded`); setScore(''); onClose() }}>Save score</Button>
      </div>
    </Sheet>
  )
}
