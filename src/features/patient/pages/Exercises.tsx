import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, ChevronRight } from 'lucide-react'
import { Bars } from '../../../components/charts'
import { Badge, Card, Empty, Ring, Tabs } from '../../../components/ui'
import { getExercise } from '../../../data/catalog'
import { adherence, todaysTasks } from '../../../lib/derive'
import { addDays, fmtDate, fmtTime, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import { H, Screen, usePatient } from '../ui'

export default function Exercises() {
  const db = useStore()
  const nav = useNavigate()
  const p = usePatient()
  const [tab, setTab] = useState<'today' | 'all' | 'history'>('today')
  const tasks = todaysTasks(db, p.id)
  const ad = adherence(db, p.id, 7)
  const logs = db.logs.filter((l) => l.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date))
  const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(todayISO(), i - 6); return { x: fmtDate(d, { weekday: 'narrow' }), v: logs.filter((l) => l.date === d).length } })

  return (
    <Screen title="My exercises">
      <Card className="flex items-center gap-4">
        <Ring value={ad ?? 0} size={70} />
        <div><div className="text-sm font-extrabold">This week</div><div className="text-xs text-muted">{ad === null ? 'No exercises assigned yet' : ad >= 70 ? 'Great consistency!' : 'Try to do a little every day'}</div></div>
      </Card>
      <Card className="!pb-1"><div className="text-xs font-semibold uppercase tracking-wide text-muted">Weekly completion</div><Bars data={week} height={90} color="#14a3a8" /></Card>
      <Tabs tabs={[{ id: 'today', label: 'Today' }, { id: 'all', label: 'Full programme' }, { id: 'history', label: 'History' }]} value={tab} onChange={setTab} />

      {(tab === 'today' || tab === 'all') && (tasks.length === 0 ? <Empty icon="🏃" title="No exercises yet" body="Your therapist will assign a home programme after your assessment." /> : (
        <div className="space-y-2.5">
          {tasks.map(({ a, done }) => {
            const ex = getExercise(a.exerciseId)!
            return (
              <Card key={a.id} onClick={() => nav(`/patient/exercise/${a.id}`)}>
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 text-3xl">{ex.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold">{ex.name}</div>
                    <div className="text-xs text-muted">{a.sets} sets × {a.reps} reps · {a.frequency}</div>
                    <div className="mt-1 flex gap-1.5">{ex.movementId && <Badge tone="teal"><Camera size={11} /> Camera</Badge>}<Badge tone="gray">{ex.difficulty}</Badge></div>
                  </div>
                  {done ? <CheckCircle2 className="text-ok" /> : <ChevronRight className="text-muted" />}
                </div>
                {tab === 'all' && a.notes && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Therapist: {a.notes}</p>}
              </Card>
            )
          })}
        </div>
      ))}

      {tab === 'history' && (
        <div>
          <H>Completed exercises</H>
          <Card pad={false} className="divide-y divide-line">
            {logs.slice(0, 15).map((l) => { const ex = getExercise(db.assignments.find((a) => a.id === l.assignmentId)?.exerciseId ?? ''); return (
              <div key={l.id} className="flex items-center gap-3 p-3 text-sm"><span className="text-xl">{ex?.emoji}</span><div className="min-w-0 flex-1"><div className="truncate font-semibold">{ex?.name}</div><div className="text-xs text-muted">{fmtDate(l.date)}{l.time ? ` at ${fmtTime(l.time)}` : ''} · {l.repsDone} reps · {l.difficulty} · pain {l.pain}</div></div>{l.camera && <Badge tone="teal">Camera</Badge>}</div>
            ) })}
            {!logs.length && <p className="p-5 text-center text-sm text-muted">Nothing logged yet.</p>}
          </Card>
        </div>
      )}
    </Screen>
  )
}
