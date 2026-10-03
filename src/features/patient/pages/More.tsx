import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, CreditCard, FileText, HeartPulse, LifeBuoy, LogOut, MessageCircle, Monitor, Stethoscope, ClipboardList, User, Activity } from 'lucide-react'
import { Avatar, Card } from '../../../components/ui'
import { useStore } from '../../../store'
import { Screen, usePatient } from '../ui'

export default function More() {
  const nav = useNavigate()
  const p = usePatient()
  const setPatientId = useStore((s) => s.setPatientId)
  const unread = useStore((s) => s.notices.filter((n) => (n.audience === 'all' || (n.audience === 'patient' && n.patientId === p.id)) && !n.read).length)
  const items = [
    { to: '/patient/checkin', icon: <HeartPulse />, t: 'Symptom check-in', d: 'Tell your therapist how you feel', c: 'bg-amber-100 text-amber-600' },
    { to: '/patient/plan', icon: <ClipboardList />, t: 'My treatment plan', d: 'Goals, schedule and precautions', c: 'bg-teal-100 text-teal-600' },
    { to: '/patient/medical', icon: <Stethoscope />, t: 'My medical information', d: 'Summary and updates', c: 'bg-brand-100 text-brand-600' },
    { to: '/patient/sessions', icon: <Activity />, t: 'Treatment sessions', d: 'Past and upcoming', c: 'bg-violet-100 text-violet-600' },
    { to: '/patient/payments', icon: <CreditCard />, t: 'Payments', d: 'Fees, receipts and package', c: 'bg-emerald-100 text-emerald-600' },
    { to: '/patient/reports', icon: <FileText />, t: 'Reports & documents', d: 'Approved reports', c: 'bg-sky-100 text-sky-600' },
    { to: '/patient/messages', icon: <MessageCircle />, t: 'Messages & companion', d: 'Clinic chat and help', c: 'bg-pink-100 text-pink-600' },
    { to: '/patient/notifications', icon: <Bell />, t: 'Notifications', d: unread ? `${unread} new` : 'All caught up', c: 'bg-orange-100 text-orange-600' },
    { to: '/patient/support', icon: <LifeBuoy />, t: 'Feedback & support', d: 'We would love to hear from you', c: 'bg-slate-100 text-slate-600' },
  ]
  return (
    <Screen title="More" back={false}>
      <Card onClick={() => nav('/patient/profile')} className="flex items-center gap-3">
        <Avatar name={p.name} tint={p.tint} size={52} />
        <div className="min-w-0 flex-1"><div className="truncate text-base font-extrabold">{p.name}</div><div className="text-xs text-muted">{p.code} · {p.location}</div></div>
        <User size={18} className="text-muted" />
      </Card>
      <div className="space-y-2">
        {items.map((i) => (
          <Card key={i.to} onClick={() => nav(i.to)} className="flex items-center gap-3 !p-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${i.c} [&_svg]:h-5 [&_svg]:w-5`}>{i.icon}</div>
            <div className="min-w-0 flex-1"><div className="text-sm font-bold">{i.t}</div><div className="truncate text-xs text-muted">{i.d}</div></div>
            <ChevronRight size={17} className="text-slate-300" />
          </Card>
        ))}
      </div>
      <Card onClick={() => nav('/physio')} className="flex items-center gap-3 !p-3"><Monitor className="text-brand-600" /><span className="text-sm font-semibold">Open clinic workspace (demo)</span></Card>
      <button onClick={() => { setPatientId(null); nav('/patient') }} className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-bad"><LogOut size={16} /> Log out</button>
    </Screen>
  )
}
