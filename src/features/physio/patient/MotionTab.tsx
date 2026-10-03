import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { TrendChart } from '../../../components/charts'
import { Badge, Button, Card, Chip, Empty, SectionTitle } from '../../../components/ui'
import { motionsOf } from '../../../lib/derive'
import { fmtDate } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { Patient } from '../../../types'
import { STATUS_META } from '../motion/ResultSummary'

export default function MotionTab({ p }: { p: Patient }) {
  const db = useStore()
  const nav = useNavigate()
  const all = motionsOf(db, p.id)
  const keys = [...new Set(all.map((m) => `${m.movementId}|${m.side}`))]
  const [key, setKey] = useState(keys[0] ?? '')
  const sel = all.filter((m) => `${m.movementId}|${m.side}` === key)
  const approved = sel.filter((m) => m.status === 'approved')
  const first = approved[0], latest = approved[approved.length - 1]
  const label = (k: string) => { const m = all.find((x) => `${x.movementId}|${x.side}` === k); return m ? `${m.movementLabel}${m.side !== 'NA' ? ` (${m.side})` : ''}` : k }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{all.length} analyses · {all.filter((m) => m.status === 'pending').length} awaiting review</p>
        <Button variant="teal" icon={<Activity size={16} />} onClick={() => nav(`/physio/motion/new?patient=${p.id}`)}>New analysis</Button>
      </div>
      {all.length === 0 ? <Empty icon="🤖" title="No motion analyses yet" body="Capture a baseline so progress can be compared over time." /> : (
        <>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">{keys.map((k) => <Chip key={k} active={key === k} onClick={() => setKey(k)}>{label(k)}</Chip>)}</div>
          {approved.length > 0 && (
            <div className="grid gap-5 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <SectionTitle title="Baseline to latest (approved)" />
                <TrendChart data={approved.map((m) => ({ x: fmtDate(m.at), ai: m.headline, manual: m.manualValue ?? null }))} lines={[{ key: 'ai', name: 'AI estimate', color: '#1a68b5' }, { key: 'manual', name: 'Manual', color: '#14a3a8', dashed: true }]} target={approved[0].category === 'rom' ? approved[0].target : undefined} unit={approved[0].unit} height={210} />
              </Card>
              <Card className="lg:col-span-2">
                <SectionTitle title="Comparison" />
                {first && latest && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-2xl bg-surface p-3"><div className="text-[11px] font-semibold uppercase text-muted">Baseline</div><div className="text-3xl font-extrabold text-slate-600">{first.headline}<span className="text-sm">{first.unit}</span></div><div className="text-xs text-muted">{fmtDate(first.at)}</div></div>
                    <div className="rounded-2xl bg-teal-50 p-3"><div className="text-[11px] font-semibold uppercase text-teal-700">Latest</div><div className="text-3xl font-extrabold text-teal-700">{latest.headline}<span className="text-sm">{latest.unit}</span></div><div className="text-xs text-muted">{fmtDate(latest.at)}</div></div>
                  </div>
                )}
                {first && latest && first.id !== latest.id && <p className="mt-3 text-center text-sm font-semibold">{latest.headline - first.headline > 0 ? '+' : ''}{Math.round((latest.headline - first.headline) * 10) / 10}{latest.unit} since baseline</p>}
              </Card>
            </div>
          )}
          <Card pad={false} className="divide-y divide-line">
            {[...sel].reverse().map((m) => (
              <Link key={m.id} to={`/physio/motion/review/${m.id}`} className="flex items-center gap-3 p-3.5 hover:bg-brand-50/50">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{m.headline}{m.unit} <span className="font-medium text-muted">· {m.reps.length} reps · quality {m.quality}%</span></div>
                  <div className="text-xs text-muted">{fmtDate(m.at)} · {m.source}{m.isBaseline ? ' · Baseline' : ''}{m.manualValue !== undefined ? ` · manual ${m.manualValue}${m.unit}` : ''}</div>
                </div>
                <Badge tone={STATUS_META[m.status].tone}>{STATUS_META[m.status].label}</Badge>
              </Link>
            ))}
          </Card>
        </>
      )}
    </div>
  )
}
