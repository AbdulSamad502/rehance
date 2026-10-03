import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { Badge, Button, Card, Chip, Field, Input, ProgressBar, SectionTitle, Select, Sheet, Textarea, Toggle, toast } from '../../../components/ui'
import { TREATMENT_MODES } from '../../../data/catalog'
import { addDays, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { Goal, Patient, TreatmentPlan } from '../../../types'

const PROBLEMS = ['Pain-related limitation', 'Restricted range of motion', 'Muscle weakness', 'Balance deficit', 'Gait abnormality', 'Functional limitation', 'Reduced endurance', 'Coordination problem']
const KINDS: Goal['kind'][] = ['Short-term', 'Long-term', 'Functional', 'Pain', 'ROM', 'Strength', 'Mobility']

export default function PlanTab({ p }: { p: Patient }) {
  const goals = useStore((s) => s.goals).filter((g) => g.patientId === p.id)
  const plan = useStore((s) => s.plans.find((x) => x.patientId === p.id))
  const updateGoal = useStore((s) => s.updateGoal)
  const savePlan = useStore((s) => s.savePlan)
  const role = useStore((s) => s.ui.physioRole)
  const edit = role === 'physio'
  const problems = useStore((s) => s.problems[p.id]) ?? []
  const setProblems = useStore((s) => s.setProblems)
  const [goalOpen, setGoalOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Clinical problem list" />
        <div className="flex flex-wrap gap-1.5">{PROBLEMS.map((x) => <Chip key={x} active={problems.includes(x)} onClick={() => edit && setProblems(p.id, problems.includes(x) ? problems.filter((y) => y !== x) : [...problems, x])}>{x}</Chip>)}</div>
        <p className="mt-2 text-xs text-muted">Select the impairments identified in assessment. They drive goal setting and treatment selection.</p>
      </Card>

      <div>
        <SectionTitle title="Rehabilitation goals" action={edit && <Button size="sm" variant="soft" icon={<Plus size={14} />} onClick={() => setGoalOpen(true)}>Add goal</Button>} />
        <div className="grid gap-3 md:grid-cols-2">
          {goals.map((g) => (
            <Card key={g.id} className="!p-3.5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600"><Target size={17} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><Badge tone="blue">{g.kind}</Badge><Badge tone={g.status === 'Achieved' ? 'green' : g.status === 'Modified' ? 'amber' : 'gray'}>{g.status}</Badge></div>
                  <div className="mt-1 text-sm font-bold">{g.text}</div>
                  <div className="text-xs text-muted">Target: {g.target}</div>
                  <div className="mt-2 flex items-center gap-2"><ProgressBar value={g.progress} tone={g.progress >= 100 ? 'green' : 'teal'} /><span className="w-10 text-right text-xs font-bold">{g.progress}%</span></div>
                  {edit && (
                    <div className="mt-2 flex items-center gap-2">
                      <input type="range" min={0} max={100} step={5} value={g.progress} onChange={(e) => updateGoal(g.id, { progress: Number(e.target.value), status: Number(e.target.value) >= 100 ? 'Achieved' : g.status === 'Achieved' ? 'Active' : g.status })} className="h-1.5 flex-1 accent-teal-500" aria-label="Goal progress" />
                      <button className="text-xs font-semibold text-brand-600" onClick={() => { updateGoal(g.id, { status: 'Modified' }); toast('Goal marked as modified') }}>Modify</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title="Treatment plan" action={edit && <Button size="sm" variant="soft" onClick={() => setPlanOpen(true)}>{plan ? 'Edit plan' : 'Create plan'}</Button>} />
        {plan ? (
          <Card>
            <p className="text-sm font-medium">{plan.summary}</p>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div><div className="text-xs text-muted">Frequency</div><b>{plan.frequency}</b></div>
              <div><div className="text-xs text-muted">Session duration</div><b>{plan.sessionDuration}</b></div>
              <div><div className="text-xs text-muted">Reassess every</div><b>{plan.reassessEvery}</b></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">{plan.modes.map((m) => <Badge key={m} tone="teal">{m}</Badge>)}</div>
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900"><b>Precautions:</b> {plan.precautions}</div>
            <div className="mt-2 text-[13px] text-muted"><b className="text-ink">Patient education:</b> {plan.education}</div>
            <div className="mt-2 text-xs text-muted">Review due {plan.reviewDate} · {plan.shared ? 'Shared with patient' : 'Not shared with patient'}</div>
          </Card>
        ) : <Card className="text-center text-sm text-muted">No treatment plan yet.</Card>}
      </div>

      <GoalSheet p={p} open={goalOpen} onClose={() => setGoalOpen(false)} />
      <PlanSheet p={p} plan={plan} open={planOpen} onClose={() => setPlanOpen(false)} onSave={(x) => { savePlan(x); toast('Treatment plan saved'); setPlanOpen(false) }} />
    </div>
  )
}

function GoalSheet({ p, open, onClose }: { p: Patient; open: boolean; onClose: () => void }) {
  const add = useStore((s) => s.addGoal)
  const [f, setF] = useState({ kind: 'Short-term' as Goal['kind'], text: '', target: '' })
  return (
    <Sheet open={open} onClose={onClose} title="Add rehabilitation goal">
      <div className="space-y-3">
        <Field label="Type"><Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Goal['kind'] })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</Select></Field>
        <Field label="Measurable goal"><Textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="e.g. Achieve 110° knee flexion" className="!min-h-[64px]" /></Field>
        <Field label="Target value"><Input value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} placeholder="e.g. 110°" /></Field>
        <Button full disabled={!f.text} onClick={() => { add({ patientId: p.id, kind: f.kind, text: f.text, target: f.target || '–', progress: 0, status: 'Active' }); toast('Goal added'); setF({ kind: 'Short-term', text: '', target: '' }); onClose() }}>Add goal</Button>
      </div>
    </Sheet>
  )
}

function PlanSheet({ p, plan, open, onClose, onSave }: { p: Patient; plan?: TreatmentPlan; open: boolean; onClose: () => void; onSave: (p: TreatmentPlan) => void }) {
  const [f, setF] = useState<TreatmentPlan>(plan ?? { patientId: p.id, summary: '', frequency: '2 sessions per week', sessionDuration: '45 minutes', modes: ['Therapeutic exercise'], precautions: '', education: '', reviewDate: addDays(todayISO(), 14), reassessEvery: '2 weeks', shared: true })
  return (
    <Sheet open={open} onClose={onClose} title="Treatment plan" wide>
      <div className="space-y-3">
        <Field label="Plan summary and rehabilitation goals"><Textarea value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Frequency"><Input value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} /></Field>
          <Field label="Session duration"><Input value={f.sessionDuration} onChange={(e) => setF({ ...f, sessionDuration: e.target.value })} /></Field>
          <Field label="Reassess every"><Input value={f.reassessEvery} onChange={(e) => setF({ ...f, reassessEvery: e.target.value })} /></Field>
        </div>
        <div>
          <span className="mb-1 block text-[12.5px] font-semibold text-slate-600">Modes of treatment</span>
          <div className="flex flex-wrap gap-1.5">{TREATMENT_MODES.map((m) => <Chip key={m} active={f.modes.includes(m)} onClick={() => setF({ ...f, modes: f.modes.includes(m) ? f.modes.filter((x) => x !== m) : [...f.modes, m] })}>{m}</Chip>)}</div>
        </div>
        <Field label="Precautions"><Textarea value={f.precautions} onChange={(e) => setF({ ...f, precautions: e.target.value })} className="!min-h-[64px]" /></Field>
        <Field label="Patient education"><Textarea value={f.education} onChange={(e) => setF({ ...f, education: e.target.value })} className="!min-h-[64px]" /></Field>
        <Field label="Next review date"><Input type="date" value={f.reviewDate} onChange={(e) => setF({ ...f, reviewDate: e.target.value })} /></Field>
        <Toggle checked={f.shared} onChange={(v) => setF({ ...f, shared: v })} label="Share this plan with the patient" />
        <Button full size="lg" disabled={!f.summary} onClick={() => onSave(f)}>Save plan</Button>
      </div>
    </Sheet>
  )
}
