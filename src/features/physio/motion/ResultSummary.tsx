import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Badge, Card, Notice, ProgressBar, SectionTitle, type Tone } from '../../../components/ui'
import { TrendChart } from '../../../components/charts'
import { fmtDateTime } from '../../../lib/utils'
import type { MotionResult } from '../../../types'
import { drawPose } from '../../motion/engine/draw'
import type { Replay } from '../../motion/engine/session'
import type { Pose } from '../../motion/engine/types'

/** In-memory replay frames for sessions captured in this page load (not persisted). */
export const replayCache = new Map<string, Replay>()

export const STATUS_META: Record<MotionResult['status'], { label: string; tone: Tone }> = {
  pending: { label: 'Awaiting review', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  repeat: { label: 'Repeat requested', tone: 'purple' },
}
const FLAG_TONE: Record<string, string> = { ok: 'text-emerald-600', watch: 'text-amber-600', alert: 'text-red-600' }

export function qualityTone(q: number): { tone: Tone; label: string } {
  return q >= 80 ? { tone: 'green', label: 'Good tracking' } : q >= 65 ? { tone: 'amber', label: 'Fair tracking' } : { tone: 'red', label: 'Poor tracking' }
}

export function ResultSummary({ m, history = [] }: { m: Omit<MotionResult, 'id' | 'patientId' | 'at' | 'status' | 'visibleToPatient' | 'source'> & Partial<MotionResult>; history?: MotionResult[] }) {
  const q = qualityTone(m.quality)
  const lowerBetter = m.movementId === 'sit-to-stand' || (m.metricLabel ?? '').toLowerCase().includes('time')
  const same = history.filter((h) => h.movementId === m.movementId && h.side === m.side && h.id !== m.id && h.status === 'approved').sort((a, b) => a.at.localeCompare(b.at))
  const baseline = same.find((h) => h.isBaseline) ?? same[0]
  const prev = same[same.length - 1]
  const delta = (ref?: MotionResult) => (ref ? Math.round((m.headline - ref.headline) * 10) / 10 : null)
  const progress = m.target ? Math.min(100, Math.round(lowerBetter ? (m.target / (m.headline || m.target)) * 100 : (m.headline / m.target) * 100)) : 0
  const data = m.series.map((v, i) => ({ x: Math.round(i) / 10, v }))
  const measured = m.headline > 0 // a failed capture has nothing meaningful to compare or chart
  const showChart = measured && m.series.length > 8 && m.series.some((v) => v !== 0)

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-brand-700 to-brand-500 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/70">{m.metricLabel}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl font-extrabold tracking-tight">{m.headline || '–'}</span>
              <span className="mt-1 self-start text-xl font-bold text-white/80">{m.unit}</span>
            </div>
            <div className="mt-1 text-sm text-white/80">{m.movementLabel}{m.side !== 'NA' ? ` · ${m.side}` : ''}</div>
          </div>
          <div className="space-y-1 text-right">
            <Badge tone={q.tone} className="!bg-white/95">{q.label} · {m.quality}%</Badge>
            {m.reps.length > 0 && <div className="text-sm font-semibold text-white/90">{m.reps.length} reps</div>}
          </div>
        </div>
        {m.target !== undefined && measured && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-white/80"><span>Progress to goal</span><span>Goal {m.target}{m.unit}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-teal-300" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        {measured && (baseline || prev) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {prev && <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">vs previous: {delta(prev)! > 0 ? '+' : ''}{delta(prev)}{m.unit}</span>}
            {baseline && baseline.id !== prev?.id && <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">vs baseline: {delta(baseline)! > 0 ? '+' : ''}{delta(baseline)}{m.unit}</span>}
          </div>
        )}
      </Card>

      {m.warnings.length > 0 && (
        <div className="space-y-2">{m.warnings.map((w) => <Notice key={w} tone="amber" title="Technical warning">{w}</Notice>)}</div>
      )}

      {m.extra.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {m.extra.map((e) => (
            <Card key={e.label} className="!p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{e.label}</div>
              <div className={`mt-0.5 text-[15px] font-extrabold ${e.flag ? FLAG_TONE[e.flag] : 'text-ink'}`}>{e.value}</div>
            </Card>
          ))}
        </div>
      )}

      {showChart && (
        <Card>
          <SectionTitle title={m.seriesLabel} />
          <TrendChart data={data} xKey="x" lines={[{ key: 'v', name: m.seriesLabel, color: '#1a68b5' }]} height={190} area unit="" target={m.category === 'rom' ? m.target : undefined} />
          <div className="mt-1 text-center text-[11px] text-muted">Seconds</div>
        </Card>
      )}

      {m.reps.length > 0 && (
        <Card>
          <SectionTitle title="Repetitions" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {m.reps.map((r) => (
              <div key={r.n} className="rounded-xl bg-surface p-2 text-center">
                <div className="text-[10px] font-semibold text-muted">REP {r.n}</div>
                <div className="text-base font-extrabold text-brand-700">{Math.round(r.peak)}°</div>
                <div className="text-[10px] text-muted">{(r.durationMs / 1000).toFixed(1)} s</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {m.observations.length > 0 && (
        <Card className="border-teal-100 bg-teal-50/40">
          <SectionTitle title="Auto-observations" action={<Badge tone="teal">Rule-based</Badge>} />
          <ul className="space-y-1.5 text-sm text-slate-700">
            {m.observations.map((o) => <li key={o} className="flex gap-2"><span className="text-teal-500">●</span>{o}</li>)}
          </ul>
          <p className="mt-2 text-[11px] text-muted">Estimates from 2D camera input, for clinician review. Not a diagnosis.</p>
        </Card>
      )}
      {m.at && <div className="text-center text-[11px] text-muted">Captured {fmtDateTime(m.at)}{m.source ? ` · ${m.source}` : ''}</div>}
    </div>
  )
}

export function ReplayPlayer({ replay }: { replay: Replay }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const c = ref.current
    if (!c || !replay.frames.length) return
    c.width = replay.w
    c.height = replay.h
    const f = replay.frames[Math.min(i, replay.frames.length - 1)]
    const lm = Array.from({ length: 33 }, (_, k) => ({ x: f[k * 3], y: f[k * 3 + 1], z: 0, v: f[k * 3 + 2] }))
    const pose: Pose = { lm, world: lm, t: 0 }
    drawPose(c.getContext('2d')!, pose, replay.w, replay.h, { mirror: false })
  }, [i, replay])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setI((x) => { if (x >= replay.frames.length - 1) { setPlaying(false); return 0 } return x + 1 }), 50)
    return () => clearInterval(id)
  }, [playing, replay.frames.length])

  return (
    <Card pad={false} className="overflow-hidden">
      <div className="relative bg-[#0b1b2b]" style={{ aspectRatio: `${replay.w} / ${replay.h}` }}>
        <canvas ref={ref} className="absolute inset-0 h-full w-full object-contain" />
        <div className="absolute left-3 top-3 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">Skeleton replay</div>
      </div>
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => setPlaying((p) => !p)} className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <input type="range" min={0} max={Math.max(0, replay.frames.length - 1)} value={i} onChange={(e) => { setPlaying(false); setI(Number(e.target.value)) }} className="h-2 flex-1 cursor-pointer accent-brand-600" aria-label="Replay position" />
        <span className="w-12 text-right text-xs tabular-nums text-muted">{((replay.times[i] ?? 0) / 1000).toFixed(1)}s</span>
      </div>
    </Card>
  )
}

export { ProgressBar }
