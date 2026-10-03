import { Link, useNavigate } from 'react-router-dom'
import { Activity, CalendarDays, ChevronRight, CreditCard, HeartPulse, MapPin, MessageCircle, Sparkles, Stethoscope } from 'lucide-react'
import { Badge, Button, Card, ProgressBar, Ring } from '../../../components/ui'
import { getExercise } from '../../../data/catalog'
import { motionsOf, nextAppt, packageSummary, therapistName, todaysTasks } from '../../../lib/derive'
import { addDays, fmtDate, fmtTime, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import { H, Screen, usePatient } from '../ui'

export default function Home() {
  const db = useStore()
  const nav = useNavigate()
  const p = usePatient()
  const next = nextAppt(db, p.id)
  const tasks = todaysTasks(db, p.id)
  const done = tasks.filter((t) => t.done).length
  const sum = packageSummary(db, p.id)
  const goals = db.goals.filter((g) => g.patientId === p.id && g.status !== 'Achieved').slice(0, 2)
  const approved = motionsOf(db, p.id, true)
  const latest = approved[approved.length - 1]
  const shared = db.sessions.filter((s) => s.patientId === p.id && s.shared).sort((a, b) => b.no - a.no)[0]
  const notices = db.notices.filter((n) => (n.audience === 'all' || (n.audience === 'patient' && n.patientId === p.id))).slice(0, 2)
  const logDays = new Set(db.logs.filter((l) => l.patientId === p.id).map((l) => l.date))
  let streak = 0
  for (let n = logDays.has(todayISO()) ? 0 : 1; logDays.has(addDays(todayISO(), -n)); n++) streak++
  const checkedToday = db.checkins.some((c) => c.patientId === p.id && c.at.slice(0, 10) === new Date().toISOString().slice(0, 10))

  return (
    <Screen>
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-brand-700 to-teal-600 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Current rehabilitation</div>
          <div className="mt-1 text-lg font-extrabold leading-snug">{p.episodeTitle}</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white/85"><Stethoscope size={15} /> {therapistName(db, p.therapistId)}</div>
          {sum.pkg && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-white/80"><span>{sum.used} of {sum.sessionsTotal} sessions completed</span><span>{sum.remaining} left</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-teal-300" style={{ width: `${(sum.used / sum.sessionsTotal) * 100}%` }} /></div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {[
          { to: '/patient/checkin', label: 'Check-in', icon: <HeartPulse size={20} />, c: 'bg-amber-100 text-amber-600' },
          { to: '/patient/messages', label: 'Message', icon: <MessageCircle size={20} />, c: 'bg-pink-100 text-pink-600' },
          { to: '/patient/appointments', label: 'Book', icon: <CalendarDays size={20} />, c: 'bg-brand-100 text-brand-600' },
          { to: '/patient/payments', label: 'Pay', icon: <CreditCard size={20} />, c: 'bg-emerald-100 text-emerald-600' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white p-3 text-center shadow-sm active:scale-95">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${a.c}`}>{a.icon}</span>
            <span className="text-[11.5px] font-bold">{a.label}</span>
          </Link>
        ))}
      </div>

      {streak > 0 && (
        <Card className="flex items-center gap-3 !p-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-100 text-xl">🔥</div>
          <div className="flex-1"><div className="text-sm font-extrabold">{streak}-day exercise streak</div><div className="text-xs text-muted">{done === tasks.length && tasks.length > 0 ? 'Today is done. See you tomorrow!' : 'Finish today\'s exercises to keep it going'}</div></div>
          <div className="flex gap-1">{Array.from({ length: 7 }, (_, i) => <span key={i} className={`h-6 w-1.5 rounded-full ${i < Math.min(streak, 7) ? 'bg-orange-400' : 'bg-slate-200'}`} />)}</div>
        </Card>
      )}

      <div>
        <H>Next appointment</H>
        {next ? (
          <Card onClick={() => nav('/patient/appointments')}>
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-center leading-none"><div><div className="text-[10px] font-bold uppercase text-brand-500">{fmtDate(next.date, { month: 'short' })}</div><div className="text-xl font-extrabold text-brand-700">{fmtDate(next.date, { day: 'numeric' })}</div></div></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold">{fmtTime(next.time)} · {next.type}</div>
                <div className="flex items-center gap-1 text-xs text-muted"><MapPin size={12} /> {next.mode === 'Online' ? 'Online session' : p.location}</div>
                <div className="mt-1"><Badge tone={next.status === 'Confirmed' ? 'green' : 'blue'}>{next.status}</Badge></div>
              </div>
              <ChevronRight className="text-muted" size={18} />
            </div>
          </Card>
        ) : <Card className="text-center text-sm text-muted"><CalendarDays className="mx-auto mb-1" />No upcoming appointments. <Link className="font-semibold text-brand-600" to="/patient/appointments">Request one</Link></Card>}
      </div>

      <div>
        <H right={<Link to="/patient/exercises" className="text-xs font-bold text-brand-600">See all</Link>}>Today's exercises</H>
        <Card>
          {tasks.length === 0 ? <p className="text-sm text-muted">Your therapist hasn't assigned exercises yet. They'll appear here after your first visit.</p> : (
            <>
              <div className="mb-3 flex items-center gap-4">
                <Ring value={(done / tasks.length) * 100} label={`${done}/${tasks.length}`} size={62} />
                <div><div className="text-sm font-extrabold">{done === tasks.length ? 'All done for today! 🎉' : `${tasks.length - done} left to do`}</div><div className="text-xs text-muted">Consistency drives recovery</div></div>
              </div>
              <div className="space-y-2">
                {tasks.slice(0, 3).map(({ a, done: d }) => {
                  const ex = getExercise(a.exerciseId)!
                  return (
                    <button key={a.id} onClick={() => nav(`/patient/exercise/${a.id}`)} className="flex w-full items-center gap-3 rounded-xl bg-surface p-2.5 text-left">
                      <span className="text-2xl">{ex.emoji}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{ex.name}</span><span className="text-xs text-muted">{a.sets} × {a.reps}{ex.movementId ? ' · camera' : ''}</span></span>
                      {d ? <Badge tone="green">Done</Badge> : <Badge tone="blue">Start</Badge>}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      {latest && (
        <Card className="border-teal-200 bg-teal-50/50" onClick={() => nav('/patient/progress')}>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500 text-white"><Activity size={19} /></div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-700"><Sparkles size={12} /> Latest approved update</div>
              <div className="mt-0.5 text-sm font-extrabold">{latest.movementLabel}: {latest.headline}{latest.unit}</div>
              <p className="text-xs text-muted">{latest.target ? `Your goal is ${latest.target}${latest.unit}. ` : ''}Approved by {latest.reviewedBy}.</p>
            </div>
          </div>
        </Card>
      )}
      {shared && (
        <Card><div className="text-xs font-bold uppercase tracking-wide text-muted">From your last session</div><p className="mt-1 text-sm">{shared.notes || shared.subjective}</p><p className="mt-1 text-xs text-muted">Next: {shared.nextPlan}</p></Card>
      )}

      {goals.length > 0 && (
        <div>
          <H right={<Link to="/patient/plan" className="text-xs font-bold text-brand-600">My plan</Link>}>My goals</H>
          <Card className="space-y-3">{goals.map((g) => <div key={g.id}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{g.text}</span><b>{g.progress}%</b></div><ProgressBar value={g.progress} tone="teal" /></div>)}</Card>
        </div>
      )}

      <Card onClick={() => nav('/patient/checkin')} className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600"><HeartPulse /></div>
        <div className="flex-1"><div className="text-sm font-extrabold">How are you feeling?</div><div className="text-xs text-muted">{checkedToday ? 'You checked in today. Thank you!' : 'Share pain or symptoms with your therapist'}</div></div>
        <Button size="sm" variant="soft">Check in</Button>
      </Card>

      <div>
        <H right={<Link to="/patient/notifications" className="text-xs font-bold text-brand-600">All</Link>}>Notifications</H>
        <div className="space-y-2">
          {notices.map((n) => <Card key={n.id} className="!p-3"><div className="flex items-start gap-2.5"><MessageCircle size={16} className="mt-0.5 text-brand-500" /><div><div className="text-sm font-bold">{n.title}</div><div className="text-xs text-muted">{n.body}</div></div></div></Card>)}
        </div>
      </div>
    </Screen>
  )
}
