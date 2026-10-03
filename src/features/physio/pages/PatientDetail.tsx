import { useMemo, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Activity, CalendarPlus, Lock, MessageSquare } from 'lucide-react'
import { Avatar, Badge, Button, Empty, PageHeader, Tabs } from '../../../components/ui'
import { canSee } from '../../../lib/access'
import { therapistName } from '../../../lib/derive'
import { useStore } from '../../../store'
import { statusTone } from '../shared'
import AssessTab from '../patient/AssessTab'
import BillingTab from '../patient/BillingTab'
import CopilotTab from '../patient/CopilotTab'
import ExercisesTab from '../patient/ExercisesTab'
import HistoryTab from '../patient/HistoryTab'
import MotionTab from '../patient/MotionTab'
import OverviewTab from '../patient/OverviewTab'
import PlanTab from '../patient/PlanTab'
import ProgressTab from '../patient/ProgressTab'
import ReassessTab from '../patient/ReassessTab'
import SessionsTab from '../patient/SessionsTab'

type TabId = 'overview' | 'history' | 'assess' | 'plan' | 'sessions' | 'exercises' | 'progress' | 'motion' | 'copilot' | 'reassess' | 'billing'

export default function PatientDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const db = useStore()
  const p = db.patients.find((x) => x.id === id)
  const role = db.ui.physioRole
  const clinical = canSee(role, 'clinical')
  const billing = canSee(role, 'billing')

  const tabs = useMemo(() => {
    const all: { id: TabId; label: ReactNode; need?: 'clinical' | 'billing'; badge?: number }[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'history', label: 'Medical history', need: 'clinical' },
      { id: 'assess', label: 'Assessment', need: 'clinical' },
      { id: 'plan', label: 'Plan & goals', need: 'clinical' },
      { id: 'sessions', label: 'Sessions', need: 'clinical' },
      { id: 'exercises', label: 'Exercises', need: 'clinical' },
      { id: 'progress', label: 'Progress', need: 'clinical' },
      { id: 'motion', label: (<span className="inline-flex items-center gap-1"><Activity size={13} /> Motion</span>), need: 'clinical' },
      { id: 'copilot', label: 'AI Copilot', need: 'clinical' },
      { id: 'reassess', label: 'Reassess & discharge', need: 'clinical' },
      { id: 'billing', label: 'Billing', need: 'billing' },
    ]
    return all
  }, [])

  if (!p) return <Empty title="Patient not found" action={<Link to="/physio/patients" className="font-semibold text-brand-600">Back to patients</Link>} />

  const tab = (sp.get('tab') as TabId) || 'overview'
  const allowed = (t: { need?: 'clinical' | 'billing' }) => (t.need === 'clinical' ? clinical : t.need === 'billing' ? billing : true)
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  const locked = !allowed(current)

  return (
    <div className="fade-up">
      <PageHeader title={<span className="flex items-center gap-3"><Avatar name={p.name} tint={p.tint} size={44} /><span className="min-w-0 truncate">{p.name}</span></span>} back={() => nav('/physio/patients')} subtitle={`${p.code} · ${p.age}y ${p.sex} · ${p.condition}`}
        actions={<div className="hidden gap-2 sm:flex">
          <Button variant="secondary" size="sm" icon={<CalendarPlus size={15} />} onClick={() => nav(`/physio/schedule?book=${p.id}`)}>Book</Button>
          {clinical && <Button variant="teal" size="sm" icon={<Activity size={15} />} onClick={() => nav(`/physio/motion/new?patient=${p.id}`)}>Motion analysis</Button>}
        </div>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(p.status)}>{p.status}</Badge>
        <Badge tone="blue">{p.episodeTitle}</Badge>
        <Badge tone="gray">Therapist: {therapistName(db, p.therapistId)}</Badge>
        {p.invite.status === 'accepted' && <Badge tone="teal">On the app</Badge>}
        {p.invite.status === 'sent' && <Badge tone="amber">Invite pending</Badge>}
        <div className="flex w-full gap-2 sm:hidden">
          <Button variant="secondary" size="sm" full icon={<CalendarPlus size={15} />} onClick={() => nav(`/physio/schedule?book=${p.id}`)}>Book</Button>
          {clinical && <Button variant="teal" size="sm" full icon={<Activity size={15} />} onClick={() => nav(`/physio/motion/new?patient=${p.id}`)}>Analyse</Button>}
          <Button variant="soft" size="sm" icon={<MessageSquare size={15} />} onClick={() => nav('/physio/inbox')} aria-label="Messages" />
        </div>
      </div>

      <Tabs className="mb-4" tabs={tabs.map((t) => ({ id: t.id, label: (<>{!allowed(t) && <Lock size={11} />}{t.label}</>) }))} value={current.id} onChange={(v) => setSp({ tab: v })} />

      {locked ? (
        <div className="rounded-3xl border border-line bg-white p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><Lock /></div>
          <h3 className="font-extrabold">Clinical records are restricted for this role</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Front-desk staff manage registration, appointments and billing. Medical history, assessments and treatment notes are available to treating professionals only.</p>
        </div>
      ) : (
        <div key={current.id} className="fade-up">
          {current.id === 'overview' && <OverviewTab p={p} />}
          {current.id === 'history' && <HistoryTab p={p} />}
          {current.id === 'assess' && <AssessTab p={p} />}
          {current.id === 'plan' && <PlanTab p={p} />}
          {current.id === 'sessions' && <SessionsTab p={p} />}
          {current.id === 'exercises' && <ExercisesTab p={p} />}
          {current.id === 'progress' && <ProgressTab p={p} />}
          {current.id === 'motion' && <MotionTab p={p} />}
          {current.id === 'copilot' && <CopilotTab p={p} />}
          {current.id === 'reassess' && <ReassessTab p={p} />}
          {current.id === 'billing' && <BillingTab p={p} />}
        </div>
      )}
    </div>
  )
}
