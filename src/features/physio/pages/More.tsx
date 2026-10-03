import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell, FileText, Inbox, Play, RotateCcw, Settings, Smartphone, Wallet } from 'lucide-react'
import { Card, PageHeader, toast } from '../../../components/ui'
import { canSee } from '../../../lib/access'
import { useStore } from '../../../store'

export default function More() {
  const nav = useNavigate()
  const role = useStore((s) => s.ui.physioRole)
  const reset = useStore((s) => s.reset)
  const setTour = useStore((s) => s.setTour)
  const setPatientId = useStore((s) => s.setPatientId)
  const clinic = useStore((s) => s.ui.clinic)
  const setClinic = useStore((s) => s.setClinic)
  const reqs = useStore((s) => s.requests).filter((r) => r.status === 'open').length + useStore((s) => s.checkins).filter((c) => !c.reviewed).length
  const items = [
    { to: '/physio/inbox', label: 'Inbox', sub: `${reqs} to review`, icon: <Inbox />, show: true },
    { to: '/physio/billing', label: 'Billing', sub: 'Payments & balances', icon: <Wallet />, show: canSee(role, 'billing') },
    { to: '/physio/exercises', label: 'Exercise library', sub: 'Programmes & videos', icon: <Dumbbell />, show: canSee(role, 'clinical') },
    { to: '/physio/reports', label: 'Reports', sub: 'Clinical & admin', icon: <FileText />, show: true },
    { to: '/physio/admin', label: 'Clinic admin', sub: 'Staff, access, audit', icon: <Settings />, show: canSee(role, 'admin') },
  ].filter((i) => i.show)
  return (
    <div className="fade-up">
      <PageHeader title="More" />
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <Link key={i.to} to={i.to}><Card className="h-full"><div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{i.icon}</div><div className="text-sm font-extrabold">{i.label}</div><div className="text-xs text-muted">{i.sub}</div></Card></Link>
        ))}
      </div>
      <div className="mt-5 space-y-2">
        <Card className="flex items-center gap-3 !p-3.5 sm:hidden">
          <div className="min-w-0 flex-1"><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Clinic location</div>
            <select value={clinic} onChange={(e) => setClinic(e.target.value)} className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold"><option>GearPhys Pune (Main)</option><option>GearPhys Thane</option></select></div>
        </Card>
        <Card onClick={() => { setPatientId('p1'); nav('/patient/home') }} className="flex items-center gap-3 !p-3.5"><Smartphone className="text-teal-600" /><div><div className="text-sm font-bold">Open patient app</div><div className="text-xs text-muted">See what the patient sees</div></div></Card>
        <Card onClick={() => { setTour(true, 0); nav('/physio') }} className="flex items-center gap-3 !p-3.5"><Play className="text-brand-600" /><div><div className="text-sm font-bold">Guided tour</div><div className="text-xs text-muted">The recovery loop in 10 steps</div></div></Card>
        <Card onClick={() => { reset(); toast('Demo data reset') }} className="flex items-center gap-3 !p-3.5"><RotateCcw className="text-bad" /><div><div className="text-sm font-bold">Reset demo data</div><div className="text-xs text-muted">Back to the starting state</div></div></Card>
      </div>
    </div>
  )
}
