import { useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { Bars, TrendChart } from '../../../components/charts'
import { Badge, Card, ProgressBar, Ring } from '../../../components/ui'
import { OUTCOMES } from '../../../data/catalog'
import { adherence, motionsOf } from '../../../lib/derive'
import { addDays, fmtDate, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import { H, Screen, usePatient } from '../ui'

export default function Progress() {
  const db = useStore()
  const p = usePatient()
  const [explain, setExplain] = useState<string | null>(null)
  const approved = motionsOf(db, p.id, true)
  const keys = [...new Set(approved.map((m) => `${m.movementId}|${m.side}`))]
  const sessions = db.sessions.filter((s) => s.patientId === p.id && s.shared).sort((a, b) => a.no - b.no)
  const goals = db.goals.filter((g) => g.patientId === p.id)
  const ad = adherence(db, p.id, 7)
  const logs = db.logs.filter((l) => l.patientId === p.id)
  const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(todayISO(), i - 6); return { x: fmtDate(d, { weekday: 'narrow' }), v: logs.filter((l) => l.date === d).length } })
  const appts = db.appointments.filter((a) => a.patientId === p.id)
  const attended = appts.filter((a) => a.status === 'Completed').length
  const missed = appts.filter((a) => a.status === 'No-show').length

  const painData = sessions.map((s) => ({ x: `#${s.no}`, pain: s.painBefore }))
  const summary = db.drafts.filter((d) => d.patientId === p.id && d.shared && d.status === 'approved').sort((a, b) => b.at.localeCompare(a.at))[0]
  const baselineRows = [
    ...keys.flatMap((k) => { const l = approved.filter((m) => `${m.movementId}|${m.side}` === k); return l.length > 1 ? [{ k, label: `${l[0].movementLabel}${l[0].side !== 'NA' ? ` (${l[0].side})` : ''}`, first: `${l[0].headline}${l[0].unit}`, last: `${l[l.length - 1].headline}${l[0].unit}` }] : [] }),
    ...(sessions.length > 1 ? [{ k: 'pain', label: 'Pain (0 to 10)', first: String(sessions[0].painBefore), last: String(sessions[sessions.length - 1].painBefore) }] : []),
  ]
  const outcomeCards = [...new Set(db.outcomes.filter((o) => o.patientId === p.id).map((o) => o.measure))].flatMap((m) => {
    const meta = OUTCOMES.find((x) => x.id === m)
    const s = db.outcomes.filter((o) => o.patientId === p.id && o.measure === m).sort((a, b) => a.date.localeCompare(b.date))
    if (!meta || s.length < 2) return []
    const first = s[0].score, last = s[s.length - 1].score
    return [{ id: m, name: meta.name, blurb: meta.blurb, first, last, higherBetter: meta.higherBetter, better: meta.higherBetter ? last > first : last < first }]
  })

  return (
    <Screen title="My progress" back={false}>
      {approved.length === 0 && sessions.length === 0 && <Card className="text-center text-sm text-muted">Your progress will appear here after your therapist records and approves your first measurements.</Card>}

      {summary && (
        <Card className="border-teal-200 bg-teal-50/50">
          <div className="flex items-center justify-between"><div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-700"><Sparkles size={13} /> Summary from your therapist</div><Badge tone="green">Approved</Badge></div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800">{summary.text}</p>
          <p className="mt-2 text-[11px] text-muted">Signed by {summary.signedBy} · {fmtDate(summary.at.slice(0, 10))}</p>
        </Card>
      )}

      {baselineRows.length > 0 && (
        <Card>
          <div className="mb-2 text-sm font-extrabold">Baseline vs latest</div>
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead><tr className="bg-surface text-left text-[11px] uppercase tracking-wide text-muted"><th className="px-3 py-2">Measure</th><th className="px-3 py-2 text-right">Start</th><th className="px-3 py-2 text-right">Now</th></tr></thead>
              <tbody>{baselineRows.map((r) => <tr key={r.k} className="border-t border-line"><td className="px-3 py-2 font-medium">{r.label}</td><td className="px-3 py-2 text-right text-muted">{r.first}</td><td className="px-3 py-2 text-right font-extrabold text-brand-700">{r.last}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {keys.map((k) => {
        const list = approved.filter((m) => `${m.movementId}|${m.side}` === k)
        const first = list[0], last = list[list.length - 1]
        const pct = last.target ? Math.min(100, Math.round((last.headline / last.target) * 100)) : 0
        return (
          <Card key={k} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div><div className="text-xs font-bold uppercase tracking-wide text-muted">{last.movementLabel}{last.side !== 'NA' ? ` · ${last.side}` : ''}</div><div className="mt-0.5 text-4xl font-extrabold text-brand-700">{last.headline}<span className="text-lg">{last.unit}</span></div></div>
              {first.id !== last.id && <Badge tone="green">+{Math.round((last.headline - first.headline) * 10) / 10}{last.unit} since start</Badge>}
            </div>
            {last.target && <div><div className="mb-1 flex justify-between text-xs text-muted"><span>Your goal: {last.target}{last.unit}</span><b className="text-ink">{pct}%</b></div><ProgressBar value={pct} tone="teal" /></div>}
            {list.length > 1 && <TrendChart data={list.map((m) => ({ x: fmtDate(m.at), v: m.headline }))} lines={[{ key: 'v', name: last.movementLabel, color: '#1a68b5' }]} target={last.category === 'rom' ? last.target : undefined} unit={last.unit} height={170} area />}
            <button onClick={() => setExplain(explain === k ? null : k)} className="flex w-full items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-left text-sm font-semibold text-brand-700"><span className="inline-flex items-center gap-1.5"><Sparkles size={14} /> What does this mean?</span><ChevronDown size={16} className={explain === k ? 'rotate-180' : ''} /></button>
            {explain === k && <p className="text-sm leading-relaxed text-slate-700">This number is how far you can move this joint, measured through your phone or clinic camera and checked by your therapist. As the number moves toward your goal, your movement is improving. {last.annotation ? `Therapist note: ${last.annotation}` : ''}</p>}
            <p className="text-[11px] text-muted">Approved by {last.reviewedBy}. Camera estimates are guidance, not a diagnosis.</p>
          </Card>
        )
      })}

      {outcomeCards.length > 0 && (
        <div>
          <H>My scores</H>
          <div className="space-y-2.5">
            {outcomeCards.map((o) => (
              <Card key={o.id} className="!p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div><div className="text-sm font-extrabold">{o.name}</div><div className="text-xs text-muted">{o.blurb}</div></div>
                  <Badge tone={o.better ? 'green' : 'amber'}>{o.first} → {o.last}</Badge>
                </div>
                <p className="mt-1.5 text-xs text-muted">{o.higherBetter ? 'A higher score means better function.' : 'A lower score means better function.'} {o.better ? 'You are moving in the right direction.' : 'Your therapist will review this with you.'}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3"><Ring value={ad ?? 0} size={56} /><div className="text-xs"><div className="text-sm font-extrabold">Exercises</div><span className="text-muted">last 7 days</span></div></Card>
        <Card><div className="text-xs font-semibold uppercase tracking-wide text-muted">Attendance</div><div className="text-2xl font-extrabold text-brand-700">{attended}<span className="text-sm font-semibold text-muted"> attended</span></div><div className="text-xs text-muted">{missed} missed</div></Card>
      </div>
      <Card className="!pb-1"><div className="text-xs font-semibold uppercase tracking-wide text-muted">Exercise completion this week</div><Bars data={week} height={100} color="#14a3a8" /></Card>

      {painData.length > 1 && (
        <Card>
          <div className="mb-1 text-sm font-extrabold">Pain over your sessions</div>
          <TrendChart data={painData} lines={[{ key: 'pain', name: 'Pain (0-10)', color: '#d98e04' }]} yDomain={[0, 10]} height={160} area />
          <p className="mt-1 text-xs text-muted">Lower is better. Pain recorded at the start of each session.</p>
        </Card>
      )}

      <div>
        <H>Goal progress</H>
        <Card className="space-y-3">{goals.length ? goals.map((g) => <div key={g.id}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{g.text}</span><b>{g.progress}%</b></div><ProgressBar value={g.progress} tone={g.progress >= 100 ? 'green' : 'blue'} /></div>) : <p className="text-sm text-muted">No goals set yet.</p>}</Card>
      </div>

      <div>
        <H>Recovery timeline</H>
        <Card className="space-y-0 !p-0">
          {[...sessions.slice(-4).map((s) => ({ at: s.date, t: `Session #${s.no}`, d: s.objective })), ...approved.slice(-3).map((m) => ({ at: m.at.slice(0, 10), t: `${m.movementLabel}: ${m.headline}${m.unit}`, d: 'Approved by your therapist' }))].sort((a, b) => b.at.localeCompare(a.at)).map((e, i) => (
            <div key={i} className="flex gap-3 border-b border-line p-3 last:border-0"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500" /><div className="min-w-0"><div className="text-sm font-bold">{e.t}</div><div className="truncate text-xs text-muted">{e.d}</div></div><div className="ml-auto shrink-0 text-xs text-slate-400">{fmtDate(e.at)}</div></div>
          ))}
        </Card>
      </div>
    </Screen>
  )
}
