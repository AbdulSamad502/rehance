import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, ChevronRight, ScanLine, ShieldCheck } from 'lucide-react'
import { Avatar, Badge, Button, Card, Chip, Empty, SectionTitle, Select, StatCard } from '../../../components/ui'
import { daysFromToday, fmtDate } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { MotionResult } from '../../../types'
import { CATEGORIES, MOVEMENTS } from '../../motion/engine/movements'
import { STATUS_META } from './ResultSummary'

export default function MotionHub() {
  const nav = useNavigate()
  const motions = useStore((s) => s.motions)
  const patients = useStore((s) => s.patients)
  const [status, setStatus] = useState<'all' | MotionResult['status']>('all')
  const [pid, setPid] = useState('all')

  const pending = motions.filter((m) => m.status === 'pending')
  const list = useMemo(() => motions.filter((m) => (status === 'all' || m.status === status) && (pid === 'all' || m.patientId === pid)).sort((a, b) => b.at.localeCompare(a.at)), [motions, status, pid])
  const who = (id: string) => patients.find((p) => p.id === id)

  return (
    <div className="fade-up space-y-5">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-brand-800 via-brand-700 to-teal-600 text-white" pad={false}>
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative p-5 sm:p-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><ScanLine size={14} /> Real-time pose tracking · runs on this device</div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">AI Motion Analysis</h1>
          <p className="mt-1.5 max-w-xl text-[15px] text-white/85">Measure joint range of motion, posture, gait and functional movement with a standard webcam. You supervise, review and approve every result.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button size="lg" variant="teal" className="!bg-white !from-white !to-white !text-brand-700" icon={<Activity size={18} />} onClick={() => nav('/physio/motion/new')}>Start new analysis</Button>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/80"><ShieldCheck size={14} /> Estimates from 2D camera input, not a diagnosis</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Analyses (7 days)" value={motions.filter((m) => m.at.slice(0, 10) >= daysFromToday(-7)).length} tone="blue" icon={<Activity size={18} />} />
        <StatCard label="Awaiting review" value={pending.length} tone="amber" />
        <StatCard label="Approved" value={motions.filter((m) => m.status === 'approved').length} tone="green" />
        <StatCard label="Avg tracking quality" value={`${motions.length ? Math.round(motions.reduce((s, m) => s + m.quality, 0) / motions.length) : 0}%`} tone="teal" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Card key={c.id} onClick={() => nav('/physio/motion/new')} className="!p-3.5">
            <div className="text-2xl">{c.emoji}</div>
            <div className="mt-1 text-sm font-bold">{c.label}</div>
            <div className="text-xs text-muted">{MOVEMENTS.filter((m) => m.category === c.id).length} {MOVEMENTS.filter((m) => m.category === c.id).length === 1 ? 'movement' : 'movements'}</div>
          </Card>
        ))}
      </div>

      {pending.length > 0 && (
        <div>
          <SectionTitle title={<span className="inline-flex items-center gap-2">Awaiting your review <Badge tone="amber">{pending.length}</Badge></span>} />
          <div className="grid gap-3 sm:grid-cols-2">
            {pending.map((m) => (
              <Card key={m.id} onClick={() => nav(`/physio/motion/review/${m.id}`)} className="border-amber-200 bg-amber-50/40">
                <div className="flex items-center gap-3">
                  <Avatar name={who(m.patientId)?.name ?? '?'} tint={who(m.patientId)?.tint} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{who(m.patientId)?.name}</div>
                    <div className="truncate text-xs text-muted">{m.movementLabel} · {m.headline}{m.unit} · {m.source}</div>
                  </div>
                  <ChevronRight size={18} className="text-muted" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle title="All analyses" />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(['all', 'pending', 'approved', 'repeat', 'rejected'] as const).map((s) => <Chip key={s} active={status === s} onClick={() => setStatus(s)}>{s === 'all' ? 'All' : STATUS_META[s].label}</Chip>)}
          <Select value={pid} onChange={(e) => setPid(e.target.value)} className="!h-9 !w-auto !rounded-full text-[13px]" aria-label="Filter by patient">
            <option value="all">All patients</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>
        {list.length === 0 ? <Empty icon="📈" title="No analyses match" body="Start a new analysis to capture one." /> : (
          <Card pad={false} className="divide-y divide-line">
            {list.map((m) => (
              <Link key={m.id} to={`/physio/motion/review/${m.id}`} className="flex items-center gap-3 p-3 transition hover:bg-brand-50/50">
                <Avatar name={who(m.patientId)?.name ?? '?'} tint={who(m.patientId)?.tint} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{who(m.patientId)?.name} <span className="font-medium text-muted">· {m.movementLabel}</span></div>
                  <div className="text-xs text-muted">{fmtDate(m.at)} · {m.source}{m.isBaseline ? ' · Baseline' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-brand-700">{m.headline}<span className="text-xs">{m.unit}</span></div>
                  <Badge tone={STATUS_META[m.status].tone}>{STATUS_META[m.status].label}</Badge>
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}
