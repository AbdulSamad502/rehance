import { Link, useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, CalendarClock, CalendarX, ClipboardList, HeartPulse, IndianRupee, MessageSquareWarning, TrendingUp, UserPlus, Users, Wallet } from 'lucide-react'
import { Bars } from '../../../components/charts'
import { Badge, Button, Card, Ring, SectionTitle, StatCard, toast } from '../../../components/ui'
import { canSee } from '../../../lib/access'
import { adherence, clinicKpis, daysSinceLastLog, packageSummary, patientById, therapistName } from '../../../lib/derive'
import { daysFromToday, fmtDate, fmtDateLong, fmtDateTime, fmtTime, inr, todayISO } from '../../../lib/utils'
import { ACTORS, useStore } from '../../../store'
import { PatientChip, StatusBadge } from '../shared'

export default function Today() {
  const db = useStore()
  const nav = useNavigate()
  const role = db.ui.physioRole
  const k = clinicKpis(db)
  const clinical = canSee(role, 'clinical')
  const first = ACTORS[role].replace(' (Reception)', '')
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const pendingMotions = db.motions.filter((m) => m.status === 'pending')
  const newCheckins = db.checkins.filter((c) => !c.reviewed)
  const lowAdherence = db.patients.filter((p) => p.status === 'active' && p.invite.status === 'accepted').map((p) => ({ p, a: adherence(db, p.id, 7), gap: daysSinceLastLog(db, p.id) })).filter((x) => x.a !== null && (x.a < 40 || (x.gap ?? 0) >= 5))
  const draftAssessments = db.assessments.filter((a) => a.status === 'draft')
  const reassessDue = db.patients.filter((p) => p.status === 'active' && p.invite.status === 'accepted').filter((p) => {
    const last = db.appointments.filter((a) => a.patientId === p.id && a.type === 'Reassessment' && a.status === 'Completed').map((a) => a.date).sort().pop()
    return !last || last < daysFromToday(-14)
  })
  const overdue = db.patients.filter((p) => packageSummary(db, p.id).outstanding > 0 && p.status === 'active')
  const pulse = Array.from({ length: 7 }, (_, i) => { const day = daysFromToday(i - 6); return { x: fmtDate(day, { weekday: 'short' }), v: db.payments.filter((x) => x.date === day && x.kind !== 'Refund').reduce((s, x) => s + x.amount, 0) } })
  const done30 = db.appointments.filter((a) => a.status === 'Completed' && a.date >= daysFromToday(-30)).length
  const missed30 = db.appointments.filter((a) => a.status === 'No-show' && a.date >= daysFromToday(-30)).length
  const attendanceRate = done30 + missed30 ? Math.round((done30 / (done30 + missed30)) * 100) : 100
  const plansDue = db.plans.filter((pl) => pl.reviewDate <= daysFromToday(7) && db.patients.find((p) => p.id === pl.patientId)?.status === 'active')
  const progressAlerts = db.patients.filter((p) => p.status === 'active').flatMap((p) => {
    const ms = db.motions.filter((m) => m.patientId === p.id && m.status === 'approved').sort((a, b) => a.at.localeCompare(b.at))
    const last = ms[ms.length - 1], prev = ms.slice(0, -1).reverse().find((m) => last && m.movementId === last.movementId && m.side === last.side)
    return last && prev && last.category === 'rom' && last.headline - prev.headline >= 8 ? [{ p, last, delta: Math.round(last.headline - prev.headline) }] : []
  })

  const todays = [...k.todays].sort((a, b) => a.time.localeCompare(b.time))
  const nextAction = (id: string, status: string) => {
    if (status === 'Scheduled' || status === 'Confirmed') return <Button size="sm" variant="soft" onClick={() => { db.setApptStatus(id, 'Checked in'); toast('Checked in') }}>Check in</Button>
    if (status === 'Checked in') return <Button size="sm" variant="soft" onClick={() => db.setApptStatus(id, 'In progress')}>Start</Button>
    if (status === 'In progress') return <Button size="sm" variant="teal" onClick={() => { db.setApptStatus(id, 'Completed'); toast('Session completed') }}>Complete</Button>
    return null
  }

  return (
    <div className="fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{fmtDateLong(todayISO())} · {db.ui.clinic}</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{hello}, {first}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<UserPlus size={16} />} onClick={() => nav('/physio/patients?new=1')}>Register patient</Button>
          {clinical && <Button variant="teal" icon={<Activity size={16} />} onClick={() => nav('/physio/motion/new')}>New motion analysis</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active patients" value={k.activePatients} sub={`${k.totalPatients} registered`} icon={<Users size={18} />} onClick={() => nav('/physio/patients')} />
        <StatCard label="Today's appointments" value={k.todays.length} sub={`${k.attended} attended · ${k.upcoming.length} upcoming`} icon={<CalendarClock size={18} />} tone="teal" onClick={() => nav('/physio/schedule')} />
        <StatCard label="Collected today" value={inr(k.collectionsToday)} sub="All payment methods" icon={<IndianRupee size={18} />} tone="green" onClick={() => nav('/physio/billing')} />
        <StatCard label="Pending payments" value={inr(k.totalOutstanding)} sub={`${overdue.length} patients`} icon={<Wallet size={18} />} tone="amber" onClick={() => nav('/physio/billing')} />
        <StatCard label="No-shows today" value={k.absent} icon={<CalendarX size={18} />} tone="red" />
        <StatCard label="Cancelled / moved" value={k.cancelled} icon={<CalendarX size={18} />} tone="gray" />
        <StatCard label="New registrations (7d)" value={k.newRegistrations} icon={<UserPlus size={18} />} tone="purple" />
        <StatCard label="Sessions delivered" value={k.sessionsCompleted} sub={`${k.sessionsScheduled} scheduled`} icon={<TrendingUp size={18} />} tone="blue" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <div>
            <SectionTitle title="Today's schedule" action={<Link to="/physio/schedule" className="text-sm font-semibold text-brand-600">Open calendar</Link>} />
            <Card pad={false} className="divide-y divide-line">
              {todays.length === 0 && <p className="p-6 text-center text-sm text-muted">No appointments today</p>}
              {todays.map((a) => {
                const p = patientById(db, a.patientId)
                if (!p) return null
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3">
                    <div className="w-16 shrink-0 text-center">
                      <div className="text-sm font-extrabold text-brand-700">{fmtTime(a.time).replace(' ', '')}</div>
                      <div className="text-[10px] text-muted">{a.duration} min</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <PatientChip p={p} sub={`${a.type} · ${therapistName(db, a.therapistId).replace('Dr. ', '')}${a.mode === 'Online' ? ' · Online' : ''}`} />
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                      <StatusBadge status={a.status} />
                      {nextAction(a.id, a.status)}
                    </div>
                  </div>
                )
              })}
            </Card>
          </div>

          <div>
            <SectionTitle title="Clinic pulse" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="sm:col-span-2 !pb-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">Collections, last 7 days</div>
                <Bars data={pulse} height={120} color="#14a3a8" />
              </Card>
              <Card className="flex flex-col items-center justify-center gap-2 text-center">
                <Ring value={attendanceRate} size={84} />
                <div><div className="text-sm font-extrabold">Attendance rate</div><div className="text-xs text-muted">Last 30 days, attended vs no-show</div></div>
              </Card>
            </div>
          </div>

          <div>
            <SectionTitle title="Therapist availability today" />
            <div className="grid gap-3 sm:grid-cols-3">
              {db.staff.filter((s) => s.role.includes('Physio')).map((t) => {
                const mine = todays.filter((a) => a.therapistId === t.id && !['Cancelled', 'Rescheduled'].includes(a.status))
                return (
                  <Card key={t.id} className="!p-3.5">
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="text-xs text-muted">{t.speciality}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge tone={mine.length > 5 ? 'amber' : 'green'}>{mine.length} booked</Badge>
                      <span className="text-[11px] text-muted">{t.hours}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div>
            <SectionTitle title="Needs your attention" />
            <div className="space-y-2.5">
              {clinical && pendingMotions.length > 0 && (
                <Card onClick={() => nav(`/physio/motion/review/${pendingMotions[0].id}`)} className="border-teal-200 bg-teal-50/50">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-500 text-white"><Activity size={18} /></div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold">AI review queue <Badge tone="teal">{pendingMotions.length}</Badge></div>
                      <div className="text-[13px] text-muted">{pendingMotions.map((m) => `${patientById(db, m.patientId)?.name.split(' ')[0]}: ${m.movementLabel}`).join(' · ')}</div>
                    </div>
                  </div>
                </Card>
              )}
              {clinical && newCheckins.map((c) => (
                <Card key={c.id} onClick={() => nav('/physio/inbox')}>
                  <div className="flex items-start gap-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${c.pain >= 7 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}><MessageSquareWarning size={18} /></div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold">Symptom check-in · pain {c.pain}/10</div>
                      <div className="truncate text-[13px] text-muted">{patientById(db, c.patientId)?.name}: {c.newSymptoms || c.location}</div>
                      <div className="text-[11px] text-slate-400">{fmtDateTime(c.at)}</div>
                    </div>
                  </div>
                </Card>
              ))}
              {clinical && lowAdherence.map(({ p, a, gap }) => (
                <Card key={p.id} onClick={() => nav(`/physio/patients/${p.id}?tab=exercises`)}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><HeartPulse size={18} /></div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold">Low exercise adherence</div>
                      <div className="text-[13px] text-muted">{p.name}: {a}% this week{gap !== null && gap >= 3 ? `, nothing logged for ${gap} days` : ''}</div>
                    </div>
                  </div>
                </Card>
              ))}
              {clinical && reassessDue.slice(0, 2).map((p) => (
                <Card key={p.id} onClick={() => nav(`/physio/patients/${p.id}?tab=assess`)}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600"><ClipboardList size={18} /></div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold">Reassessment due</div>
                      <div className="text-[13px] text-muted">{p.name}: last reassessment over 2 weeks ago</div>
                    </div>
                  </div>
                </Card>
              ))}
              {clinical && plansDue.slice(0, 2).map((pl) => (
                <Card key={pl.patientId} onClick={() => nav(`/physio/patients/${pl.patientId}?tab=plan`)}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600"><ClipboardList size={18} /></div>
                    <div><div className="text-sm font-bold">Treatment plan review due</div><div className="text-[13px] text-muted">{patientById(db, pl.patientId)?.name}: review date {fmtDate(pl.reviewDate)}</div></div>
                  </div>
                </Card>
              ))}
              {clinical && progressAlerts.slice(0, 2).map(({ p, last, delta }) => (
                <Card key={p.id} onClick={() => nav(`/physio/patients/${p.id}?tab=progress`)}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><TrendingUp size={18} /></div>
                    <div><div className="text-sm font-bold">Progress: {last.movementLabel} +{delta}{last.unit}</div><div className="text-[13px] text-muted">{p.name}: approved measurement is now {last.headline}{last.unit}</div></div>
                  </div>
                </Card>
              ))}
              {clinical && draftAssessments.map((a) => (
                <Card key={a.id} onClick={() => nav(`/physio/patients/${a.patientId}?tab=assess`)}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><ClipboardList size={18} /></div>
                    <div><div className="text-sm font-bold">Pending clinical note</div><div className="text-[13px] text-muted">{patientById(db, a.patientId)?.name}: {a.kind} assessment is still a draft</div></div>
                  </div>
                </Card>
              ))}
              {overdue.slice(0, 2).map((p) => {
                const s = packageSummary(db, p.id)
                return (
                  <Card key={p.id} onClick={() => nav('/physio/billing')}>
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><AlertTriangle size={18} /></div>
                      <div><div className="text-sm font-bold">Outstanding balance {inr(s.outstanding)}</div><div className="text-[13px] text-muted">{p.name} · last payment {s.lastPay ? fmtDate(s.lastPay.date) : 'none'}</div></div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          <div>
            <SectionTitle title="Recent activity" />
            <Card pad={false} className="divide-y divide-line">
              {db.audit.slice(0, 6).map((a) => (
                <div key={a.id} className="px-3.5 py-2.5">
                  <div className="text-[13px] text-ink">{a.action}</div>
                  <div className="text-[11px] text-slate-400">{a.who} · {fmtDateTime(a.at)}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
