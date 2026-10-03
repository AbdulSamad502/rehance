import { useMemo, useState } from 'react'
import { Camera, Plus } from 'lucide-react'
import { Bars } from '../../../components/charts'
import { Badge, Button, Card, Chip, Empty, Field, Input, Ring, SectionTitle, Sheet, Textarea, toast } from '../../../components/ui'
import { EXERCISES, getExercise } from '../../../data/catalog'
import { adherence } from '../../../lib/derive'
import { addDays, fmtDate, mean, round, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { ExerciseDef, Patient } from '../../../types'

export default function ExercisesTab({ p }: { p: Patient }) {
  const db = useStore()
  const [open, setOpen] = useState(false)
  const [editAsg, setEditAsg] = useState<string | null>(null)
  const canEdit = db.ui.physioRole === 'physio'
  const asg = db.assignments.filter((a) => a.patientId === p.id)
  const logs = db.logs.filter((l) => l.patientId === p.id)
  const ad = adherence(db, p.id, 7)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(todayISO(), i - 6)
    return { x: fmtDate(d, { weekday: 'short' }), v: logs.filter((l) => l.date === d).length }
  })
  const last7 = logs.filter((l) => l.date >= addDays(todayISO(), -6))
  const avgPain = last7.length ? round(mean(last7.map((l) => l.pain)), 1) : null
  const diff = { Easy: 0, 'Just right': 0, Hard: 0 }
  last7.forEach((l) => diff[l.difficulty]++)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <Ring value={ad ?? 0} size={70} />
          <div><div className="text-xs font-semibold uppercase tracking-wide text-muted">Adherence (7 days)</div><div className="text-sm font-bold">{ad === null ? 'No exercises assigned' : ad >= 70 ? 'On track' : ad >= 40 ? 'Needs encouragement' : 'Low: follow up'}</div></div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Average pain after exercise</div>
          <div className="mt-1 text-3xl font-extrabold text-brand-700">{avgPain ?? '–'}<span className="text-base text-muted">/10</span></div>
          <div className="mt-1 text-xs text-muted">Easy {diff.Easy} · Just right {diff['Just right']} · Hard {diff.Hard}</div>
        </Card>
        <Card className="!pb-1"><div className="text-xs font-semibold uppercase tracking-wide text-muted">Exercises logged per day</div><Bars data={week} height={92} color="#14a3a8" /></Card>
      </div>

      <div>
        <SectionTitle title="Assigned programme" action={canEdit && <Button size="sm" icon={<Plus size={14} />} onClick={() => setOpen(true)}>Assign exercise</Button>} />
        {asg.length === 0 ? <Empty icon="🏃" title="No exercises assigned" body="Build a home programme from the library." /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {asg.map((a) => {
              const ex = getExercise(a.exerciseId)
              if (!ex) return null
              const mine = logs.filter((l) => l.assignmentId === a.id)
              const weekDone = mine.filter((l) => l.date >= addDays(todayISO(), -6)).length
              const lastLog = mine.map((l) => l.date).sort().pop()
              const pain = mine.length ? round(mean(mine.slice(-7).map((l) => l.pain)), 1) : null
              return (
                <Card key={a.id} className={a.status === 'Discontinued' ? 'opacity-60' : ''}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">{ex.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-sm font-extrabold">{ex.name}</span>{ex.movementId && <Badge tone="teal"><Camera size={11} /> Trackable</Badge>}</div>
                      <div className="text-xs text-muted">{a.sets} × {a.reps} · {a.frequency}{a.notes ? ` · ${a.notes}` : ''}</div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span>This week: <b className="text-ink">{weekDone}/7</b></span>
                        <span>Last done: <b className="text-ink">{lastLog ? fmtDate(lastLog) : 'never'}</b></span>
                        {pain !== null && <span>Avg pain: <b className="text-ink">{pain}</b></span>}
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="mt-3 flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="soft" onClick={() => setEditAsg(a.id)}>Edit dosage</Button>
                      {a.status === 'Active'
                        ? <Button size="sm" variant="ghost" className="!text-bad" onClick={() => { db.setAssignmentStatus(a.id, 'Discontinued'); toast('Exercise discontinued', 'info') }}>Discontinue</Button>
                        : <Button size="sm" variant="soft" onClick={() => db.setAssignmentStatus(a.id, 'Active')}>Resume</Button>}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <SectionTitle title="Patient feedback (latest)" />
        <Card pad={false} className="divide-y divide-line">
          {[...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((l) => {
            const ex = getExercise(db.assignments.find((a) => a.id === l.assignmentId)?.exerciseId ?? '')
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="text-xl">{ex?.emoji ?? '🏃'}</span>
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{ex?.name}</div><div className="text-xs text-muted">{fmtDate(l.date)} · {l.repsDone} reps</div></div>
                {l.camera && <Badge tone="teal"><Camera size={11} /> {l.formScore ? `Form ${l.formScore}` : 'Camera'}</Badge>}
                <Badge tone={l.pain >= 6 ? 'red' : l.pain >= 4 ? 'amber' : 'green'}>Pain {l.pain}</Badge>
                <Badge tone="gray">{l.difficulty}</Badge>
              </div>
            )
          })}
          {logs.length === 0 && <p className="p-5 text-center text-sm text-muted">No feedback yet</p>}
        </Card>
      </div>
      <AssignSheet p={p} open={open} onClose={() => setOpen(false)} />
      <EditAssignment id={editAsg} onClose={() => setEditAsg(null)} />
    </div>
  )
}

function EditAssignment({ id, onClose }: { id: string | null; onClose: () => void }) {
  const a = useStore((s) => s.assignments.find((x) => x.id === id))
  const update = useStore((s) => s.updateAssignment)
  const [f, setF] = useState({ sets: 3, reps: 10, frequency: '', notes: '', start: '', review: '' })
  const [loaded, setLoaded] = useState<string | null>(null)
  if (a && loaded !== a.id) { setLoaded(a.id); setF({ sets: a.sets, reps: a.reps, frequency: a.frequency, notes: a.notes, start: a.start, review: a.review }) }
  const ex = a ? getExercise(a.exerciseId) : undefined
  return (
    <Sheet open={!!a} onClose={onClose} title={ex ? `Edit: ${ex.name}` : 'Edit exercise'}>
      {a && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sets"><Input type="number" value={f.sets} onChange={(e) => setF({ ...f, sets: Number(e.target.value) })} /></Field>
            <Field label="Repetitions"><Input type="number" value={f.reps} onChange={(e) => setF({ ...f, reps: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Frequency"><Input value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><Input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
            <Field label="Review date"><Input type="date" value={f.review} onChange={(e) => setF({ ...f, review: e.target.value })} /></Field>
          </div>
          <Field label="Instructions for this patient"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="!min-h-[56px]" /></Field>
          <Button full onClick={() => { update(a.id, f); toast('Exercise updated. The patient is notified'); onClose() }}>Save changes</Button>
        </div>
      )}
    </Sheet>
  )
}

function AssignSheet({ p, open, onClose }: { p: Patient; open: boolean; onClose: () => void }) {
  const assign = useStore((s) => s.assignExercise)
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('All')
  const [sel, setSel] = useState<ExerciseDef | null>(null)
  const [f, setF] = useState({ sets: 3, reps: 10, frequency: 'Daily', notes: '', start: todayISO(), review: addDays(todayISO(), 14) })
  const regions = useMemo(() => ['All', ...new Set(EXERCISES.map((e) => e.region))], [])
  const list = EXERCISES.filter((e) => (region === 'All' || e.region === region) && e.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <Sheet open={open} onClose={() => { setSel(null); onClose() }} title={sel ? 'Set dosage' : 'Exercise library'} wide>
      {!sel ? (
        <div className="space-y-3">
          <Input placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">{regions.map((r) => <Chip key={r} active={region === r} onClick={() => setRegion(r)}>{r}</Chip>)}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {list.map((e) => (
              <button key={e.id} onClick={() => { setSel(e); setF({ sets: e.sets, reps: e.reps, frequency: 'Daily', notes: '', start: todayISO(), review: addDays(todayISO(), 14) }) }} className="flex items-center gap-3 rounded-2xl border border-line p-3 text-left hover:border-brand-300">
                <span className="text-2xl">{e.emoji}</span>
                <div className="min-w-0"><div className="truncate text-sm font-bold">{e.name}</div><div className="text-xs text-muted">{e.region} · {e.difficulty}{e.movementId ? ' · camera' : ''}</div></div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-3"><span className="text-3xl">{sel.emoji}</span><div><div className="font-bold">{sel.name}</div><div className="text-xs text-muted">{sel.instructions}</div></div></div>
          <div className="rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900"><b>Precautions:</b> {sel.precautions}</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sets"><Input type="number" value={f.sets} onChange={(e) => setF({ ...f, sets: Number(e.target.value) })} /></Field>
            <Field label="Repetitions"><Input type="number" value={f.reps} onChange={(e) => setF({ ...f, reps: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Frequency"><Input value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><Input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
            <Field label="Review date"><Input type="date" value={f.review} onChange={(e) => setF({ ...f, review: e.target.value })} /></Field>
          </div>
          <Field label="Instructions for this patient"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="!min-h-[56px]" /></Field>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSel(null)}>Back</Button>
            <Button full onClick={() => { assign({ patientId: p.id, exerciseId: sel.id, ...f }); toast('Exercise assigned. The patient is notified'); setSel(null); onClose() }}>Assign to {p.name.split(' ')[0]}</Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
