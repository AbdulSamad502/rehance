import { useMemo, useState } from 'react'
import { Camera, Play, Search } from 'lucide-react'
import { Badge, Button, Card, Chip, Field, Input, Notice, PageHeader, Select, Sheet, toast } from '../../../components/ui'
import { EXERCISES } from '../../../data/catalog'
import { addDays, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { ExerciseDef } from '../../../types'

export default function ExerciseLibrary() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [sel, setSel] = useState<ExerciseDef | null>(null)
  const cats = useMemo(() => ['All', ...new Set(EXERCISES.map((e) => e.category))], [])
  const list = EXERCISES.filter((e) => (cat === 'All' || e.category === cat) && (e.name + e.region).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="fade-up">
      <PageHeader title="Exercise library" subtitle={`${EXERCISES.length} exercises · ${EXERCISES.filter((e) => e.movementId).length} support camera tracking`} />
      <div className="mb-4 space-y-3">
        <div className="relative"><Search size={16} className="absolute left-3.5 top-3.5 text-muted" /><Input className="pl-10" placeholder="Search by name or region" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">{cats.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <Card key={e.id} onClick={() => setSel(e)}>
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 text-3xl">{e.emoji}</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold">{e.name}</div>
                <div className="text-xs text-muted">{e.region} · {e.category}</div>
                <div className="mt-1.5 flex flex-wrap gap-1"><Badge tone={e.difficulty === 'Easy' ? 'green' : e.difficulty === 'Moderate' ? 'amber' : 'red'}>{e.difficulty}</Badge>{e.movementId && <Badge tone="teal"><Camera size={11} /> Camera</Badge>}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Detail ex={sel} onClose={() => setSel(null)} />
    </div>
  )
}

function Detail({ ex, onClose }: { ex: ExerciseDef | null; onClose: () => void }) {
  const patients = useStore((s) => s.patients)
  const assign = useStore((s) => s.assignExercise)
  const [pid, setPid] = useState('p1')
  if (!ex) return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  return (
    <Sheet open onClose={onClose} title={ex.name} wide>
      <div className="space-y-4">
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-teal-600 text-white">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_30%,#fff_0,transparent_50%)]" />
          <div className="relative text-center"><div className="mb-2 text-6xl">{ex.emoji}</div><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/25 backdrop-blur"><Play className="ml-0.5" /></div><div className="mt-2 text-xs text-white/80">Demonstration video placeholder</div></div>
        </div>
        <p className="text-sm leading-relaxed">{ex.instructions}</p>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-surface p-3"><div className="text-xs text-muted">Sets × reps</div><b>{ex.sets} × {ex.reps}</b></div>
          <div className="rounded-xl bg-surface p-3"><div className="text-xs text-muted">Hold</div><b>{ex.holdSec ? `${ex.holdSec} s` : '–'}</b></div>
          <div className="rounded-xl bg-surface p-3"><div className="text-xs text-muted">Equipment</div><b>{ex.equipment}</b></div>
          <div className="rounded-xl bg-surface p-3"><div className="text-xs text-muted">Level</div><b>{ex.difficulty}</b></div>
        </div>
        <Notice tone="amber" title="Precautions">{ex.precautions}</Notice>
        {ex.movementId && <Notice tone="teal" title="Camera tracking supported">The patient can do this with their phone camera for rep counting and form cues.</Notice>}
        <div className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <Field label="Assign to patient" className="min-w-[200px] flex-1"><Select value={pid} onChange={(e) => setPid(e.target.value)}>{patients.filter((p) => p.status === 'active' && p.invite.status === 'accepted').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Button onClick={() => { assign({ patientId: pid, exerciseId: ex.id, sets: ex.sets, reps: ex.reps, frequency: 'Daily', notes: '', start: todayISO(), review: addDays(todayISO(), 14) }); toast('Assigned. The patient is notified'); onClose() }}>Assign</Button>
        </div>
      </div>
    </Sheet>
  )
}
