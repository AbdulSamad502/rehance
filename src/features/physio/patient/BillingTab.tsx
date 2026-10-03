import { useState } from 'react'
import { Printer, Receipt } from 'lucide-react'
import { Badge, Button, Card, Chip, Field, Input, KV, ProgressBar, SectionTitle, Select, Sheet, SimBadge, StatCard, toast } from '../../../components/ui'
import { levelOf } from '../../../lib/access'
import { packageSummary } from '../../../lib/derive'
import { fmtDate, inr, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { Patient, PayMethod, Payment } from '../../../types'

const METHODS: PayMethod[] = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Other']

export default function BillingTab({ p }: { p: Patient }) {
  const db = useStore()
  const sum = packageSummary(db, p.id)
  const pays = db.payments.filter((x) => x.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date))
  const canEdit = levelOf(db.ui.physioRole, 'billing') === 'full'
  const [payOpen, setPayOpen] = useState(false)
  const [pkgOpen, setPkgOpen] = useState(false)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const charges = db.charges.filter((c) => c.patientId === p.id)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total fees" value={inr(sum.total)} sub={sum.pkg && sum.pkg.discount ? `after ${inr(sum.pkg.discount)} discount` : undefined} />
        <StatCard label="Fees paid" value={inr(sum.paid)} tone="green" />
        <StatCard label="Outstanding" value={inr(sum.outstanding)} tone={sum.outstanding ? 'amber' : 'green'} sub={sum.overdue ? 'Overdue' : undefined} />
        <StatCard label="Last payment" value={sum.lastPay ? fmtDate(sum.lastPay.date) : '–'} sub={sum.lastPay?.method} tone="blue" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Treatment package" action={canEdit && <div className="flex gap-1.5"><Button size="sm" variant="soft" onClick={() => setChargeOpen(true)}>Add charge</Button><Button size="sm" variant="soft" onClick={() => setPkgOpen(true)}>Edit</Button></div>} />
          {sum.pkg ? (
            <>
              <div className="text-base font-extrabold">{sum.pkg.name}</div>
              <div className="my-3"><div className="mb-1 flex justify-between text-xs text-muted"><span>Sessions used</span><b className="text-ink">{sum.used} / {sum.sessionsTotal}</b></div><ProgressBar value={(sum.used / sum.sessionsTotal) * 100} tone="teal" /></div>
              <KV k="Sessions remaining" v={sum.remaining} />
              <KV k="Package fee" v={inr(sum.pkg.totalFees)} />
              <KV k="Discount" v={inr(sum.pkg.discount)} />
              {charges.map((c) => <KV key={c.id} k={`Charge: ${c.desc} (${fmtDate(c.date)})`} v={inr(c.amount)} />)}
            </>
          ) : <p className="text-sm text-muted">No package assigned.</p>}
        </Card>
        <Card>
          <SectionTitle title="Payment history" action={canEdit && <Button size="sm" onClick={() => setPayOpen(true)}>Record payment</Button>} />
          <div className="divide-y divide-line">
            {pays.map((x) => (
              <button key={x.id} onClick={() => setReceipt(x)} className="flex w-full items-center gap-3 py-2.5 text-left">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><Receipt size={16} /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold">{x.kind === 'Payment' ? 'Payment' : x.kind}{x.note ? ` · ${x.note}` : ''}</div><div className="text-xs text-muted">{fmtDate(x.date)} · {x.method} · {x.receiptNo}</div></div>
                <div className={`text-sm font-extrabold ${x.amount < 0 ? 'text-bad' : 'text-ok'}`}>{x.amount < 0 ? '-' : '+'}{inr(Math.abs(x.amount))}</div>
              </button>
            ))}
            {!pays.length && <p className="py-4 text-center text-sm text-muted">No payments recorded</p>}
          </div>
        </Card>
      </div>

      <PaySheet p={p} open={payOpen} onClose={() => setPayOpen(false)} balance={sum.outstanding} onDone={(x) => setReceipt(x)} />
      <PackageSheet p={p} open={pkgOpen} onClose={() => setPkgOpen(false)} />
      <ChargeSheet p={p} open={chargeOpen} onClose={() => setChargeOpen(false)} />
      <Sheet open={!!receipt} onClose={() => setReceipt(null)} title="Receipt">
        {receipt && (
          <div className="print-area space-y-3">
            <div className="text-center"><div className="text-lg font-extrabold text-brand-700">GearPhys</div><div className="text-xs text-muted">{db.ui.clinic}</div></div>
            <div className="rounded-2xl bg-surface p-4">
              <KV k="Receipt no." v={receipt.receiptNo} /><KV k="Date" v={fmtDate(receipt.date)} /><KV k="Patient" v={`${p.name} (${p.code})`} />
              <KV k="Type" v={receipt.kind} /><KV k="Method" v={receipt.method} /><KV k="Amount" v={<span className="text-lg">{inr(Math.abs(receipt.amount))}</span>} />
            </div>
            <div className="no-print flex items-center gap-2"><Button full variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>Print / Save PDF</Button><SimBadge /></div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function PaySheet({ p, open, onClose, balance, onDone }: { p: Patient; open: boolean; onClose: () => void; balance: number; onDone: (x: Payment) => void }) {
  const add = useStore((s) => s.addPayment)
  const [f, setF] = useState({ amount: '', method: 'UPI' as PayMethod, kind: 'Payment' as Payment['kind'], note: '', date: todayISO() })
  return (
    <Sheet open={open} onClose={onClose} title="Record payment">
      <div className="space-y-3">
        <div className="flex gap-1.5">{(['Payment', 'Refund', 'Adjustment'] as const).map((k) => <Chip key={k} active={f.kind === k} onClick={() => setF({ ...f, kind: k })}>{k}</Chip>)}</div>
        <Field label="Amount (₹)" hint={balance ? `Outstanding balance ${inr(balance)}` : undefined}><Input type="number" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        {balance > 0 && f.kind === 'Payment' && <Button size="sm" variant="soft" onClick={() => setF({ ...f, amount: String(balance) })}>Pay full balance</Button>}
        <Field label="Method"><Select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as PayMethod })}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
        <Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Note"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <Button full size="lg" disabled={!Number(f.amount)} onClick={() => {
          const amt = Math.abs(Number(f.amount)) * (f.kind === 'Refund' ? -1 : 1)
          const x = add({ patientId: p.id, date: f.date, amount: amt, method: f.method, kind: f.kind, note: f.note || undefined })
          toast(`${f.kind} recorded. Receipt ${x.receiptNo}`)
          setF({ ...f, amount: '', note: '' })
          onClose()
          onDone(x)
        }}>Save and generate receipt</Button>
      </div>
    </Sheet>
  )
}

function PackageSheet({ p, open, onClose }: { p: Patient; open: boolean; onClose: () => void }) {
  const pkg = useStore((s) => s.packages.find((x) => x.patientId === p.id))
  const set = useStore((s) => s.setPackage)
  const [f, setF] = useState({ name: pkg?.name ?? 'Standard: 10 sessions', totalFees: String(pkg?.totalFees ?? 12000), discount: String(pkg?.discount ?? 0), sessionsTotal: String(pkg?.sessionsTotal ?? 10) })
  return (
    <Sheet open={open} onClose={onClose} title="Package and fees">
      <div className="space-y-3">
        <Field label="Package name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total fee (₹)"><Input type="number" value={f.totalFees} onChange={(e) => setF({ ...f, totalFees: e.target.value })} /></Field>
          <Field label="Discount (₹)"><Input type="number" value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} /></Field>
        </div>
        <Field label="Number of sessions"><Input type="number" value={f.sessionsTotal} onChange={(e) => setF({ ...f, sessionsTotal: e.target.value })} /></Field>
        <Button full onClick={() => { set({ patientId: p.id, name: f.name, totalFees: Number(f.totalFees), discount: Number(f.discount), sessionsTotal: Number(f.sessionsTotal) }); toast('Package updated'); onClose() }}>Save package</Button>
        <Badge tone="gray">Fees only affect this prototype's local data</Badge>
      </div>
    </Sheet>
  )
}

function ChargeSheet({ p, open, onClose }: { p: Patient; open: boolean; onClose: () => void }) {
  const fees = useStore((s) => s.fees)
  const addCharge = useStore((s) => s.addCharge)
  const [f, setF] = useState({ desc: '', amount: '' })
  const quick = [{ d: 'Consultation', a: fees.consultation }, { d: 'Extra session', a: fees.session }, { d: 'Report / certificate', a: 500 }]
  return (
    <Sheet open={open} onClose={onClose} title="Add billing entry">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">{quick.map((q) => <Chip key={q.d} onClick={() => setF({ desc: q.d, amount: String(q.a) })}>{q.d} · {inr(q.a)}</Chip>)}</div>
        <Field label="Description"><Input value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="e.g. Extra session, equipment" /></Field>
        <Field label="Amount (₹)"><Input type="number" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Button full disabled={!f.desc || !Number(f.amount)} onClick={() => { addCharge({ patientId: p.id, date: todayISO(), desc: f.desc, amount: Number(f.amount) }); toast('Billing entry added to total fees'); setF({ desc: '', amount: '' }); onClose() }}>Add to bill</Button>
      </div>
    </Sheet>
  )
}