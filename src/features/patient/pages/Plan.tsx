import { Target } from 'lucide-react'
import { Badge, Card, Notice, ProgressBar } from '../../../components/ui'
import { getExercise } from '../../../data/catalog'
import { apptsOf } from '../../../lib/derive'
import { fmtDate, fmtTime, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import { H, Screen, usePatient } from '../ui'

export default function Plan() {
  const db = useStore()
  const p = usePatient()
  const plan = db.plans.find((x) => x.patientId === p.id && x.shared)
  const goals = db.goals.filter((g) => g.patientId === p.id)
  const asg = db.assignments.filter((a) => a.patientId === p.id && a.status === 'Active')
  const follow = apptsOf(db, p.id).filter((a) => a.date >= todayISO() && !['Cancelled', 'Completed', 'No-show'].includes(a.status)).slice(0, 3)
  return (
    <Screen title="My treatment plan">
      {!plan ? <Card className="text-center text-sm text-muted">Your therapist will share your plan after your assessment.</Card> : (
        <>
          <Card className="bg-gradient-to-br from-teal-50 to-white"><p className="text-sm font-medium leading-relaxed">{plan.summary}</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-white p-2.5 ring-1 ring-line"><div className="text-xs text-muted">How often</div><b>{plan.frequency}</b></div><div className="rounded-xl bg-white p-2.5 ring-1 ring-line"><div className="text-xs text-muted">Each session</div><b>{plan.sessionDuration}</b></div></div></Card>
          <div><H>What your treatment includes</H><div className="flex flex-wrap gap-1.5">{plan.modes.map((m) => <Badge key={m} tone="teal">{m}</Badge>)}</div></div>
          <Notice tone="amber" title="Precautions">{plan.precautions}</Notice>
          <Card><div className="text-sm font-extrabold">Advice from your therapist</div><p className="mt-1 text-sm text-slate-700">{plan.education}</p></Card>
        </>
      )}
      <div>
        <H>My goals</H>
        <div className="space-y-2.5">{goals.map((g) => <Card key={g.id} className="!p-3.5"><div className="flex items-start gap-2.5"><Target size={17} className="mt-0.5 text-teal-600" /><div className="min-w-0 flex-1"><div className="text-sm font-bold">{g.text}</div><div className="text-xs text-muted">{g.kind} · target {g.target}</div><div className="mt-2 flex items-center gap-2"><ProgressBar value={g.progress} tone="teal" /><b className="text-xs">{g.progress}%</b></div></div></div></Card>)}{!goals.length && <Card className="text-sm text-muted">No goals set yet.</Card>}</div>
      </div>
      <div>
        <H>Exercise schedule</H>
        <Card pad={false} className="divide-y divide-line">{asg.map((a) => { const ex = getExercise(a.exerciseId)!; return <div key={a.id} className="flex items-center gap-3 p-3"><span className="text-2xl">{ex.emoji}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{ex.name}</div><div className="text-xs text-muted">{a.sets} × {a.reps} · {a.frequency}</div></div></div> })}{!asg.length && <p className="p-4 text-sm text-muted">No exercises assigned yet.</p>}</Card>
      </div>
      <div>
        <H>Follow-up schedule</H>
        <Card pad={false} className="divide-y divide-line">{follow.map((a) => <div key={a.id} className="p-3 text-sm"><b>{fmtDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</b> · {fmtTime(a.time)} · {a.type}</div>)}{!follow.length && <p className="p-4 text-sm text-muted">No follow-ups scheduled.</p>}</Card>
        {plan && <p className="mt-2 text-xs text-muted">Your plan will be reviewed on {fmtDate(plan.reviewDate)}. You cannot change the plan yourself; message your therapist if something is not working.</p>}
      </div>
    </Screen>
  )
}
