import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bars } from '../../../components/charts'
import { Badge, Button, Card, Field, Input, PageHeader, SectionTitle, StatCard, toast } from '../../../components/ui'
import { levelOf } from '../../../lib/access'
import { packageSummary } from '../../../lib/derive'
import { addDays, fmtDate, inr, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import { PatientChip } from '../shared'

export default function Billing() {
  const db = useStore()
  const nav = useNavigate()
  const today = todayISO()
  const month = addDays(today, -30)
  const sumBy = (from: string) => db.payments.filter((p) => p.date >= from && p.kind !== 'Refund').reduce((s, p) => s + p.amount, 0)
  const rows = db.patients.map((p) => ({ p, s: packageSummary(db, p.id) })).filter((r) => r.s.pkg)
  const owing = rows.filter((r) => r.s.outstanding > 0).sort((a, b) => b.s.outstanding - a.s.outstanding)
  const byMethod = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Other'].map((m) => ({ x: m === 'Bank transfer' ? 'Bank' : m, v: db.payments.filter((p) => p.method === m && p.date >= month && p.kind !== 'Refund').reduce((s, p) => s + p.amount, 0) }))
  const recent = [...db.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  return (
    <div className="fade-up space-y-5">
      <PageHeader title="Billing" subtitle="Fees, packages, collections and outstanding balances" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Collected today" value={inr(sumBy(today))} tone="green" />
        <StatCard label="Last 30 days" value={inr(sumBy(month))} tone="blue" />
        <StatCard label="Outstanding" value={inr(owing.reduce((s, r) => s + r.s.outstanding, 0))} tone="amber" sub={`${owing.length} patients`} />
        <StatCard label="Overdue (> 14 days)" value={owing.filter((r) => r.s.overdue).length} tone="red" />
      </div>
      <FeeSchedule />
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <SectionTitle title="Outstanding balances" />
          <Card pad={false} className="divide-y divide-line">
            {owing.map(({ p, s }) => (
              <div key={p.id} className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1"><PatientChip p={p} sub={s.pkg?.name} /></div>
                <div className="text-right"><div className="text-sm font-extrabold text-warn">{inr(s.outstanding)}</div>{s.overdue && <Badge tone="red">Overdue</Badge>}</div>
                <button onClick={() => nav(`/physio/patients/${p.id}?tab=billing`)} className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700">Collect</button>
              </div>
            ))}
            {!owing.length && <p className="p-5 text-center text-sm text-muted">All balances are settled 🎉</p>}
          </Card>
        </div>
        <div className="space-y-5">
          <Card><SectionTitle title="Collections by method (30 days)" /><Bars data={byMethod} unit="" height={170} color="#14a3a8" /></Card>
          <div>
            <SectionTitle title="Recent payments" />
            <Card pad={false} className="divide-y divide-line">
              {recent.map((x) => (
                <div key={x.id} className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                  <div className="min-w-0"><div className="truncate font-semibold">{db.patients.find((p) => p.id === x.patientId)?.name}</div><div className="text-xs text-muted">{fmtDate(x.date)} · {x.method} · {x.receiptNo}</div></div>
                  <b className={x.amount < 0 ? 'text-bad' : 'text-ok'}>{x.amount < 0 ? '-' : '+'}{inr(Math.abs(x.amount))}</b>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeeSchedule() {
  const fees = useStore((s) => s.fees)
  const setFees = useStore((s) => s.setFees)
  const role = useStore((s) => s.ui.physioRole)
  const [f, setF] = useState({ consultation: String(fees.consultation), session: String(fees.session) })
  const canEdit = levelOf(role, 'billing') === 'full'
  return (
    <Card>
      <SectionTitle title="Fee schedule" action={<Badge tone="gray">Applies to new charges and packages</Badge>} />
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <Field label="Consultation charge (₹)"><Input type="number" inputMode="numeric" value={f.consultation} disabled={!canEdit} onChange={(e) => setF({ ...f, consultation: e.target.value })} /></Field>
        <Field label="Per-session charge (₹)"><Input type="number" inputMode="numeric" value={f.session} disabled={!canEdit} onChange={(e) => setF({ ...f, session: e.target.value })} /></Field>
        <Button disabled={!canEdit} onClick={() => { setFees({ consultation: Number(f.consultation) || 0, session: Number(f.session) || 0 }); toast('Fee schedule saved') }}>Save fees</Button>
      </div>
      {!canEdit && <p className="mt-2 text-xs text-muted">Only the clinic owner or front desk can change fees.</p>}
    </Card>
  )
}