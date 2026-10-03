import { useState } from 'react'
import { Card, Toggle } from '../../../components/ui'
import { cn, fmtDateTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import { H, Screen, usePatient } from '../ui'

const ICON: Record<string, string> = { appointment: '📅', exercise: '🏃', recovery: '💚', payment: '💳', announcement: '📣', alert: '⚠️', ai: '🤖' }

export default function Notifications() {
  const db = useStore()
  const p = usePatient()
  const [prefs, setPrefs] = useState({ appointment: true, exercise: true, recovery: true, payment: true })
  const list = db.notices.filter((n) => n.audience === 'all' || (n.audience === 'patient' && n.patientId === p.id))
  return (
    <Screen title="Notifications" action={<button className="text-xs font-bold text-brand-600" onClick={() => db.markAllRead('patient', p.id)}>Mark all read</button>}>
      <div className="space-y-2">
        {list.length === 0 && <Card className="text-center text-sm text-muted">Nothing here yet.</Card>}
        {list.map((n) => (
          <button key={n.id} onClick={() => db.markNoticeRead(n.id)} className={cn('flex w-full gap-3 rounded-2xl border p-3 text-left', n.read ? 'border-line bg-white' : 'border-brand-200 bg-brand-50/60')}>
            <div className="text-xl">{ICON[n.kind] ?? '🔔'}</div>
            <div className="min-w-0"><div className="text-sm font-bold">{n.title}</div><div className="text-[13px] text-muted">{n.body}</div><div className="mt-0.5 text-[11px] text-slate-400">{fmtDateTime(n.at)}</div></div>
          </button>
        ))}
      </div>
      <div>
        <H>Notification preferences</H>
        <Card className="space-y-3">
          <Toggle checked={prefs.appointment} onChange={(v) => setPrefs({ ...prefs, appointment: v })} label="Appointment reminders" />
          <Toggle checked={prefs.exercise} onChange={(v) => setPrefs({ ...prefs, exercise: v })} label="Exercise reminders" />
          <Toggle checked={prefs.recovery} onChange={(v) => setPrefs({ ...prefs, recovery: v })} label="Recovery updates and reassessments" />
          <Toggle checked={prefs.payment} onChange={(v) => setPrefs({ ...prefs, payment: v })} label="Payment reminders" />
        </Card>
      </div>
    </Screen>
  )
}
