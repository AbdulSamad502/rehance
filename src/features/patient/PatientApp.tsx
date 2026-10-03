import { Suspense, useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ClipboardList, CreditCard, Dumbbell, HeartPulse, Home as HomeIcon, LineChart, Menu, MessageCircle, Monitor } from 'lucide-react'
import { Avatar, Logo } from '../../components/ui'
import { cn } from '../../lib/utils'
import { useStore } from '../../store'
import Appointments from './pages/Appointments'
import CheckIn from './pages/CheckIn'
import ExerciseSession from './pages/ExerciseSession'
import Exercises from './pages/Exercises'
import Home from './pages/Home'
import Medical from './pages/Medical'
import Messages from './pages/Messages'
import More from './pages/More'
import Notifications from './pages/Notifications'
import Payments from './pages/Payments'
import Plan from './pages/Plan'
import Profile from './pages/Profile'
import Progress from './pages/Progress'
import Reports from './pages/Reports'
import Sessions from './pages/Sessions'
import Support from './pages/Support'
import Welcome from './pages/Welcome'

const tabs = [
  { to: '/patient/home', label: 'Home', icon: HomeIcon },
  { to: '/patient/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/patient/appointments', label: 'Visits', icon: CalendarDays },
  { to: '/patient/progress', label: 'Progress', icon: LineChart },
  { to: '/patient/more', label: 'More', icon: Menu },
]
const extras = [
  { to: '/patient/checkin', label: 'Symptom check-in', icon: HeartPulse },
  { to: '/patient/plan', label: 'Treatment plan', icon: ClipboardList },
  { to: '/patient/messages', label: 'Messages', icon: MessageCircle },
  { to: '/patient/payments', label: 'Payments', icon: CreditCard },
]

export default function PatientApp() {
  const pid = useStore((s) => s.ui.patientId)
  const patient = useStore((s) => s.patients.find((p) => p.id === s.ui.patientId))
  const unread = useStore((s) => s.notices.filter((n) => (n.audience === 'all' || (n.audience === 'patient' && n.patientId === s.ui.patientId)) && !n.read).length)
  const loc = useLocation()
  const nav = useNavigate()

  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])

  const authed = !!pid && !!patient
  const onWelcome = loc.pathname === '/patient' || loc.pathname === '/patient/' || loc.pathname.startsWith('/patient/welcome')
  const immersive = loc.pathname.startsWith('/patient/exercise/') // exercise player hides navigation
  const showChrome = authed && !onWelcome

  if (!showChrome) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="welcome" element={<Welcome />} />
          <Route index element={authed ? <Navigate to="home" replace /> : <Welcome />} />
          <Route path="*" element={<Navigate to={authed ? '/patient/home' : '/patient/welcome'} replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <div className="min-h-dvh bg-surface md:flex">
      {/* Desktop / tablet side rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white p-4 md:flex">
        <div className="px-1 pb-5 pt-1"><Logo /></div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {tabs.slice(0, 4).map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50')}>
              <t.icon size={19} />{t.label}
            </NavLink>
          ))}
          <div className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">My care</div>
          {extras.map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50')}>
              <t.icon size={19} />{t.label}
            </NavLink>
          ))}
          <NavLink to="/patient/more" className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50')}><Menu size={19} />More</NavLink>
        </nav>
        <button onClick={() => nav('/physio')} className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"><Monitor size={16} /> Switch to clinic workspace</button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-line bg-white/90 px-4 pb-2.5 pt-3 backdrop-blur md:px-8">
          <button onClick={() => nav('/patient/profile')} className="flex items-center gap-2.5 text-left">
            <Avatar name={patient!.name} tint={patient!.tint} size={36} />
            <div className="leading-tight"><div className="text-[11px] text-muted">Welcome back</div><div className="text-sm font-extrabold">{patient!.name.split(' ')[0]}</div></div>
          </button>
          <button onClick={() => nav('/patient/notifications')} className="relative grid h-10 w-10 place-items-center rounded-full bg-surface" aria-label="Notifications">
            <Bell size={19} />
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[9px] font-bold text-white">{unread}</span>}
          </button>
        </header>

        <main className={cn('mx-auto w-full max-w-2xl flex-1', immersive ? 'pb-6' : 'pb-24 md:pb-10')}>
          <Suspense fallback={null}>
            <Routes>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="exercises" element={<Exercises />} />
              <Route path="exercise/:id" element={<ExerciseSession />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="progress" element={<Progress />} />
              <Route path="more" element={<More />} />
              <Route path="checkin" element={<CheckIn />} />
              <Route path="plan" element={<Plan />} />
              <Route path="medical" element={<Medical />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="messages" element={<Messages />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="support" element={<Support />} />
              <Route path="welcome" element={<Navigate to="/patient/home" replace />} />
              <Route path="*" element={<Navigate to="/patient/home" replace />} />
            </Routes>
          </Suspense>
        </main>

        {!immersive && (
          <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden">
            <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-1.5 pt-1.5">
              {tabs.map((t) => (
                <NavLink key={t.to} to={t.to} className={({ isActive }) => cn('flex w-16 flex-col items-center gap-0.5 rounded-xl py-1 text-[10.5px] font-semibold transition', isActive ? 'text-brand-600' : 'text-slate-400')}>
                  {({ isActive }) => (<><span className={cn('grid h-8 w-12 place-items-center rounded-full transition', isActive && 'bg-brand-50')}><t.icon size={20} strokeWidth={isActive ? 2.4 : 2} /></span>{t.label}</>)}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
