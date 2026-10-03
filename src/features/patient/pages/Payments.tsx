import { useState } from 'react'
import { CheckCircle2, Printer, Receipt } from 'lucide-react'
import { Badge, Button, Card, Chip, Field, Input, KV, ProgressBar, Sheet, SimBadge, toast } from '../../../components/ui'
import { packageSummary } from '../../../lib/derive'
import { fmtDate, inr, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { PayMethod, Payment } from '../../../types'
import { H, Screen, usePatient } from '../ui'

export default function Payments() {
  const db = useStore()
  const p = usePatient()
  const s = packageSummary(db, p.id)
  const pays = db.payments.filter((x) => x.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date))
  const [pay, setPay] = useState(false)
  const [rc, setRc] = useState<Payment | null>(null)

  return (
    <Screen title="Payments">
      <Card className="bg-gradient-to-br from-brand-700 to-brand-500 text-white">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Outstanding balance</div>
        <div className="text-4xl font-extrabold">{inr(s.outstanding)}</div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><div className="text-white/70">Total fees</div><b>{inr(s.total)}</b></div><div><div className="text-white/70">Paid</div><b>{inr(s.paid)}</b></div></div>
        {s.outstanding > 0 && <Button full className="mt-4 !bg-white !from-white !to-white !text-brand-700" onClick={() => setPay(true)}>Pay online</Button>}
      </Card>

      {s.pkg && (
        <Card>
          <div className="text-sm font-extrabold">{s.pkg.name}</div>
          <div className="my-2"><div className="mb-1 flex justify-between text-xs text-muted"><span>Sessions used</span><b className="text-ink">{s.used} of {s.sessionsTotal}</b></div><ProgressBar value={(s.used / s.sessionsTotal) * 100} tone="teal" /></div>
          <div className="text-sm text-muted">{s.remaining} sessions remaining in your package</div>
        </Card>
      )}

      <div>
        <H>Payment history</H>
        <Card pad={false} className="divide-y divide-line">
          {pays.map((x) => (
            <button key={x.id} onClick={() => setRc(x)} className="flex w-full items-center gap-3 p-3 text-left">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><Receipt size={16} /></div>
              <div className="min-w-0 flex-1"><div className="text-sm font-bold">{x.kind}</div><div className="text-xs text-muted">{fmtDate(x.date)} · {x.method}</div></div>
              <b className={x.amount < 0 ? 'text-bad' : 'text-ok'}>{inr(Math.abs(x.amount))}</b>
            </button>
          ))}
          {!pays.length && <p className="p-4 text-center text-sm text-muted">No payments yet.</p>}
        </Card>
      </div>
      <PaySheet open={pay} onClose={() => setPay(false)} balance={s.outstanding} onPaid={(x) => setRc(x)} />
      <Sheet open={!!rc} onClose={() => setRc(null)} title="Receipt">
        {rc && <div className="print-area space-y-3"><div className="text-center"><div className="text-lg font-extrabold text-brand-700">GearPhys</div><div className="text-xs text-muted">{p.location}</div></div><div className="rounded-2xl bg-surface p-4"><KV k="Receipt" v={rc.receiptNo} /><KV k="Date" v={fmtDate(rc.date)} /><KV k="Method" v={rc.method} /><KV k="Amount" v={inr(Math.abs(rc.amount))} /></div><Button full variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>Download / print</Button></div>}
      </Sheet>
    </Screen>
  )
}

function PaySheet({ open, onClose, balance, onPaid }: { open: boolean; onClose: () => void; balance: number; onPaid: (p: Payment) => void }) {
  const add = useStore((s) => s.addPayment)
  const p = usePatient()
  const [amt, setAmt] = useState(String(balance))
  const [m, setM] = useState<PayMethod>('UPI')
  const [done, setDone] = useState(false)
  return (
    <Sheet open={open} onClose={() => { setDone(false); onClose() }} title="Pay online">
      {done ? (
        <div className="grid place-items-center py-6 text-center"><CheckCircle2 size={56} className="text-ok" /><div className="mt-2 text-lg font-extrabold">Payment successful</div><p className="text-sm text-muted">A receipt was added to your history.</p></div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><SimBadge label="Test mode" /><span className="text-xs text-muted">No real payment is taken</span></div>
          <Field label="Amount (₹)"><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
          <div className="flex gap-1.5">{(['UPI', 'Card', 'Bank transfer'] as PayMethod[]).map((x) => <Chip key={x} active={m === x} onClick={() => setM(x)}>{x}</Chip>)}</div>
          <Badge tone="gray">Secure payment is simulated</Badge>
          <Button full size="lg" disabled={!Number(amt)} onClick={() => { const x = add({ patientId: p.id, date: todayISO(), amount: Math.min(Number(amt), balance), method: m, kind: 'Payment', note: 'Online payment (simulated)' }); setDone(true); toast('Payment received'); setTimeout(() => { setDone(false); onClose(); onPaid(x) }, 1400) }}>Pay {inr(Number(amt) || 0)}</Button>
        </div>
      )}
    </Sheet>
  )
}
