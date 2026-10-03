import { Badge, Card } from '../../../components/ui'
import { apptsOf, therapistName } from '../../../lib/derive'
import { fmtDate, fmtTime, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import { STATUS_TONE } from '../../physio/shared'
import { H, Screen, usePatient } from '../ui'

export default function Sessions() {
  const db = useStore()
  const p = usePatient()
  const notes = db.sessions.filter((s) => s.patientId === p.id).sort((a, b) => b.no - a.no)
  const upcoming = apptsOf(db, p.id).filter((a) => a.date >= todayISO() && !['Completed', 'Cancelled', 'No-show', 'Rescheduled'].includes(a.status))
  return (
    <Screen title="Treatment sessions" sub={`${notes.length} completed`}>
      {upcoming.length > 0 && (
        <div><H>Coming up</H><div className="space-y-2">{upcoming.slice(0, 3).map((a) => <Card key={a.id} className="!p-3"><div className="flex items-center justify-between"><div><div className="text-sm font-bold">{fmtDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(a.time)}</div><div className="text-xs text-muted">{a.type}</div></div><Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge></div></Card>)}</div></div>
      )}
      <div>
        <H>Completed</H>
        {notes.length === 0 && <Card className="text-sm text-muted">Your session summaries will appear here after each visit.</Card>}
        <div className="space-y-2.5">
          {notes.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between"><div className="text-sm font-extrabold">Session #{s.no}</div><span className="text-xs text-muted">{fmtDate(s.date)} · {therapistName(db, s.therapistId).replace('Dr. ', 'Dr ')}</span></div>
              {s.shared ? (
                <div className="mt-2 space-y-1.5 text-sm">
                  <div className="flex gap-2"><Badge tone="amber">Pain before {s.painBefore}</Badge><Badge tone="green">after {s.painAfter}</Badge></div>
                  <p><b>Today's treatment:</b> {s.treatment.join(', ')}</p>
                  <p><b>Findings:</b> {s.objective}</p>
                  <p><b>Next time:</b> {s.nextPlan}</p>
                </div>
              ) : <p className="mt-2 text-sm text-muted">Your therapist has not shared a summary for this session.</p>}
            </Card>
          ))}
        </div>
      </div>
    </Screen>
  )
}
