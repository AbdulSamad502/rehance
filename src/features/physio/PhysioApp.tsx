import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Bell, CalendarDays, Dumbbell, FileText, Inbox, LayoutDashboard, Lock, MoreHorizontal, Play, Plus, Search, Settings, Smartphone, Users, Wallet } from 'lucide-react'
import { Avatar, Badge, Button, Logo, LogoMark, Select, Sheet, Notice } from '../../components/ui'
import { canSee, ROLE_LABEL, type Area } from '../../lib/access'
import { cn, fmtDateTime } from '../../lib/utils'
import { ACTORS, useStore } from '../../store'
import type { PhysioRole } from '../../types'
import Admin from './pages/Admin'
import Billing from './pages/Billing'
import ClinicWelcome from './pages/ClinicWelcome'
import ExerciseLibrary from './pages/ExerciseLibrary'
import InboxPage from './pages/Inbox'
import More from './pages/More'
import PatientDetail from './pages/PatientDetail'
import Patients from './pages/Patients'
import Reports from './pages/Reports'
import Schedule from './pages/Schedule'
import Today from './pages/Today'

const MotionHub = lazy(() => import('./motion/MotionHub'))
const NewAnalysis = lazy(() => import('./motion/NewAnalysis'))
const Review = lazy(() => import('./motion/Review'))

interface NavItem { to: string; label: string; icon: ReactNode; area: Area; end?: boolean }
const NAV: NavItem[] = [
  { to: '/physio', label: 'Today', icon: <LayoutDashboard size={19} />, area: 'patients', end: true },
  { to: '/physio/patients', label: 'Patients', icon: <Users size={19} />, area: 'patients' },
  { to: '/physio/schedule', label: 'Schedule', icon: <CalendarDays size={19} />, area: 'schedule' },
  { to: '/physio/motion', label: 'Motion Analysis', icon: <Activity size={19} />, area: 'motion' },
  { to: '/physio/exercises', label: 'Exercise Library', icon: <Dumbbell size={19} />, area: 'clinical' },
  { to: '/physio/inbox', label: 'Inbox', icon: <Inbox size={19} />, area: 'patients' },
  { to: '/physio/billing', label: 'Billing', icon: <Wallet size={19} />, area: 'billing' },
  { to: '/physio/reports', label: 'Reports', icon: <FileText size={19} />, area: 'patients' },
  { to: '/physio/admin', label: 'Clinic Admin', icon: <Settings size={19} />, area: 'admin' },
]

export function Guard({ area, children }: { area: Area; children: ReactNode }) {
  const role = useStore((s) => s.ui.physioRole)
  if (canSee(role, area)) return <>{children}</>
  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600"><Lock /></div>
        <h2 className="text-lg font-extrabold">Restricted for {ROLE_LABEL[role]}</h2>
        <p className="mt-1 text-sm text-muted">Access follows role-based permissions: clinical records and AI Motion Analysis are limited to treating professionals. Switch role from the top bar to see the difference.</p>
      </div>
    </div>
  )
}

interface Cmd { label: string; hint: string; icon: ReactNode; run: () => void; area?: Area }

function CommandSheet({ open, onClose, mode }: { open: boolean; onClose: () => void; mode: 'search' | 'create' }) {
  const patients = useStore((s) => s.patients)
  const role = useStore((s) => s.ui.physioRole)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const go = (to: string) => () => { onClose(); setQ(''); nav(to) }
  const rawActions: Cmd[] = [
    { label: 'Register a patient', hint: 'Add a new patient and send the app invite', icon: <Users size={17} />, run: go('/physio/patients?new=1'), area: 'patients' },
    { label: 'Book an appointment', hint: 'Find a free slot and notify the patient', icon: <CalendarDays size={17} />, run: go('/physio/schedule?book=p1'), area: 'schedule' },
    { label: 'New motion analysis', hint: 'Capture range of motion, posture, gait or function', icon: <Activity size={17} />, run: go('/physio/motion/new'), area: 'motion' },
    { label: 'Record a payment', hint: 'Open billing to collect a balance', icon: <Wallet size={17} />, run: go('/physio/billing'), area: 'billing' },
  ]
  const actions = rawActions.filter((a) => canSee(role, a.area!))
  const pages: Cmd[] = NAV.filter((n) => canSee(role, n.area)).map((n) => ({ label: n.label, hint: 'Go to page', icon: n.icon, run: go(n.to) }))
  const needle = q.toLowerCase().trim()
  const hits = patients.filter((p) => (p.name + p.code + p.condition).toLowerCase().includes(needle)).slice(0, needle ? 6 : 0)
  const acts = (mode === 'create' && !needle ? actions : actions.filter((a) => needle && (a.label + a.hint).toLowerCase().includes(needle)))
  const pgs = needle ? pages.filter((x) => x.label.toLowerCase().includes(needle)) : mode === 'search' ? pages.slice(0, 5) : []
  const row = (c: Cmd) => (
    <button key={c.label} onClick={c.run} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-brand-50">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">{c.icon}</span>
      <span className="min-w-0"><span className="block truncate text-sm font-bold">{c.label}</span><span className="block truncate text-xs text-muted">{c.hint}</span></span>
    </button>
  )
  return (
    <Sheet open={open} onClose={() => { onClose(); setQ('') }} title={mode === 'create' ? 'Create new' : 'Search or jump to'}>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-3.5 text-muted" />
        <input autoFocus={mode === 'search'} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Patients, pages or actions" className="h-11 w-full rounded-xl border border-line pl-9 pr-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
      </div>
      <div className="space-y-1">
        {acts.length > 0 && <div className="px-1 pb-0.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</div>}
        {acts.map(row)}
        {pgs.length > 0 && <div className="px-1 pb-0.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Pages</div>}
        {pgs.map(row)}
        {hits.length > 0 && <div className="px-1 pb-0.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Patients</div>}
        {hits.map((p) => (
          <button key={p.id} onClick={go(`/physio/patients/${p.id}`)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-brand-50">
            <Avatar name={p.name} tint={p.tint} size={36} />
            <div className="min-w-0"><div className="truncate text-sm font-bold">{p.name}</div><div className="truncate text-xs text-muted">{p.code} · {p.condition}</div></div>
          </button>
        ))}
        {needle && !acts.length && !pgs.length && !hits.length && <p className="py-6 text-center text-sm text-muted">Nothing matches “{q}”</p>}
      </div>
    </Sheet>
  )
}
function Bell_({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notices = useStore((s) => s.notices)
  const markAll = useStore((s) => s.markAllRead)
  const list = notices.filter((n) => n.audience !== 'patient')
  const icon: Record<string, string> = { alert: '⚠️', ai: '🤖', appointment: '📅', announcement: '📣', payment: '💳', exercise: '🏃', recovery: '💚' }
  return (
    <Sheet open={open} onClose={onClose} title="Notifications">
      <div className="mb-2 flex justify-end"><Button size="sm" variant="soft" onClick={() => markAll('physio')}>Mark all read</Button></div>
      <div className="space-y-2">
        {list.map((n) => (
          <div key={n.id} className={cn('flex gap-3 rounded-xl border p-3', n.read ? 'border-line bg-white' : 'border-brand-200 bg-brand-50/60')}>
            <div className="text-xl">{icon[n.kind] ?? '🔔'}</div>
            <div className="min-w-0">
              <div className="text-sm font-bold">{n.title}</div>
              <div className="text-[13px] text-muted">{n.body}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{fmtDateTime(n.at)}</div>
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}

export default function PhysioApp() {
  const role = useStore((s) => s.ui.physioRole)
  const setRole = useStore((s) => s.setPhysioRole)
  const clinic = useStore((s) => s.ui.clinic)
  const setClinic = useStore((s) => s.setClinic)
  const notices = useStore((s) => s.notices)
  const reqs = useStore((s) => s.requests)
  const checkins = useStore((s) => s.checkins)
  const setTour = useStore((s) => s.setTour)
  const setPatientId = useStore((s) => s.setPatientId)
  const nav = useNavigate()
  const loc = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])

  const unread = notices.filter((n) => n.audience !== 'patient' && !n.read).length
  const inboxCount = reqs.filter((r) => r.status === 'open').length + checkins.filter((c) => !c.reviewed).length
  const items = NAV.filter((n) => canSee(role, n.area))
  const mobile = [NAV[0], NAV[1], NAV[3], NAV[2]].filter((n) => canSee(role, n.area))

  if (loc.pathname.startsWith('/physio/welcome')) return <ClinicWelcome />

  return (
    <div className="flex min-h-dvh bg-surface">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white p-4 lg:flex">
        <div className="px-1 pb-5 pt-1"><Logo /></div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50')}>
              {n.icon}
              <span className="flex-1">{n.label}</span>
              {n.label === 'Inbox' && inboxCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">{inboxCount}</span>}
              {n.label === 'Motion Analysis' && <Badge tone="teal">AI</Badge>}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-line pt-3">
          <Button variant="soft" full size="sm" icon={<Smartphone size={16} />} onClick={() => { setPatientId('p1'); nav('/patient/home') }}>Open patient app</Button>
          <Button variant="ghost" full size="sm" icon={<Play size={16} />} onClick={() => { setTour(true, 0); nav('/physio') }}>Guided tour</Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-white/90 px-3 py-2.5 backdrop-blur sm:px-5">
          <div className="lg:hidden"><LogoMark size={32} /></div>
          <Select value={clinic} onChange={(e) => setClinic(e.target.value)} className="!hidden !h-9 max-w-[170px] !rounded-lg !py-0 text-[13px] font-semibold sm:!block" aria-label="Clinic location">
            <option>GearPhys Pune (Main)</option>
            <option>GearPhys Thane</option>
          </Select>
          <button onClick={() => setSearchOpen(true)} className="hidden h-9 flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-left text-sm text-muted sm:flex sm:max-w-sm">
            <Search size={15} /> Search patients <kbd className="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] ring-1 ring-line">Ctrl K</kbd>
          </button>
          <div className="flex-1 sm:hidden" />
          <button onClick={() => setSearchOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white sm:hidden" aria-label="Search"><Search size={17} /></button>
          <Select value={role} onChange={(e) => setRole(e.target.value as PhysioRole)} className="!h-9 !w-auto !rounded-lg !py-0 text-[13px] font-semibold" aria-label="View as role" title="View as role (demonstrates role-based access)">
            {(Object.keys(ROLE_LABEL) as PhysioRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
          <button onClick={() => setCreateOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow-sm active:scale-95" aria-label="Create new" title="Create new"><Plus size={18} /></button>
          <button onClick={() => setBellOpen(true)} className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-white" aria-label="Notifications">
            <Bell size={17} />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[9px] font-bold text-white">{unread}</span>}
          </button>
          <div className="hidden items-center gap-2 pl-1 md:flex"><Avatar name={ACTORS[role]} tint="#14a3a8" size={34} /></div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
          {role !== 'physio' && (
            <div className="mb-4"><Notice tone="teal" title={`Viewing as ${ROLE_LABEL[role]}`}>Menus and records are filtered by role, as described in the permissions matrix.</Notice></div>
          )}
          <Suspense fallback={<div className="grid h-60 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" /></div>}>
            <Routes>
              <Route index element={<Today />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientDetail />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="motion" element={<Guard area="motion"><MotionHub /></Guard>} />
              <Route path="motion/new" element={<Guard area="motion"><NewAnalysis /></Guard>} />
              <Route path="motion/review/:id" element={<Guard area="motion"><Review /></Guard>} />
              <Route path="exercises" element={<Guard area="clinical"><ExerciseLibrary /></Guard>} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="billing" element={<Guard area="billing"><Billing /></Guard>} />
              <Route path="reports" element={<Reports />} />
              <Route path="admin" element={<Guard area="admin"><Admin /></Guard>} />
              <Route path="more" element={<More />} />
              <Route path="*" element={<Today />} />
            </Routes>
          </Suspense>
        </main>

        {/* Mobile bottom nav */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-1.5 pt-1.5">
            {mobile.map((n) => {
              const isMotion = n.label === 'Motion Analysis'
              return (
                <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('flex w-16 flex-col items-center gap-0.5 text-[10.5px] font-semibold', isMotion ? '' : isActive ? 'text-brand-600' : 'text-slate-500')}>
                  {({ isActive }) =>
                    isMotion ? (
                      <>
                        <span className={cn('-mt-6 grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg ring-4 ring-white', 'bg-gradient-to-br from-teal-600 to-brand-500', isActive && 'scale-105')}><Activity size={22} /></span>
                        <span className={isActive ? 'text-teal-700' : 'text-slate-500'}>Motion</span>
                      </>
                    ) : (<>{n.icon}<span>{n.label}</span></>)
                  }
                </NavLink>
              )
            })}
            <NavLink to="/physio/more" className={({ isActive }) => cn('relative flex w-16 flex-col items-center gap-0.5 text-[10.5px] font-semibold', isActive ? 'text-brand-600' : 'text-slate-500')}>
              <MoreHorizontal size={19} /><span>More</span>
              {inboxCount > 0 && <span className="absolute right-3 top-0 h-2 w-2 rounded-full bg-bad" />}
            </NavLink>
          </div>
        </nav>
      </div>

      <CommandSheet open={searchOpen} onClose={() => setSearchOpen(false)} mode="search" />
      <CommandSheet open={createOpen} onClose={() => setCreateOpen(false)} mode="create" />
      <Bell_ open={bellOpen} onClose={() => setBellOpen(false)} />
    </div>
  )
}
