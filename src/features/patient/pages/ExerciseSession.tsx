import { useCallback, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, Check, Hand, PartyPopper, Play, Plus, ShieldCheck, Square } from 'lucide-react'
import { Badge, Button, Card, Chip, Notice, Scale, Segmented, SimBadge } from '../../../components/ui'
import { getExercise } from '../../../data/catalog'
import { clamp, cn, todayISO } from '../../../lib/utils'
import { useStore } from '../../../store'
import { getMovement } from '../../motion/engine/movements'
import { checkPositioning } from '../../motion/engine/quality'
import { MotionSession, type DraftResult, type LiveState } from '../../motion/engine/session'
import type { Pose } from '../../motion/engine/types'
import { PoseStage, type StageStatus } from '../../motion/ui/PoseStage'
import { Screen, usePatient } from '../ui'

type Mode = 'detail' | 'camera' | 'manual' | 'feedback' | 'done'

export default function ExerciseSession() {
  const { id } = useParams()
  const nav = useNavigate()
  const p = usePatient()
  const a = useStore((s) => s.assignments.find((x) => x.id === id))
  const logExercise = useStore((s) => s.logExercise)
  const addMotion = useStore((s) => s.addMotion)
  const ex = a ? getExercise(a.exerciseId) : undefined
  const def = ex?.movementId ? getMovement(ex.movementId) : undefined
  const target = a ? a.sets * a.reps : 0
  const cameraTarget = a?.reps ?? 0 // one tracked set keeps camera sessions short

  const [mode, setMode] = useState<Mode>('detail')
  const [src, setSrc] = useState<'webcam' | 'sim'>('webcam')
  const [counting, setCounting] = useState(false)
  const [ready, setReady] = useState(false)
  const [live, setLive] = useState<LiveState | null>(null)
  const [status, setStatus] = useState<StageStatus>({ phase: 'idle', fps: 0, infMs: 0 })
  const [manual, setManual] = useState(0)
  const [fb, setFb] = useState({ difficulty: 'Just right' as 'Easy' | 'Just right' | 'Hard', pain: 2 })
  const [used, setUsed] = useState<'camera' | 'sim' | 'manual'>('manual')
  const sessionRef = useRef<MotionSession | null>(null)
  const draftRef = useRef<DraftResult | null>(null)
  const countingRef = useRef(false)
  const lastUi = useRef(0)
  const okSince = useRef<number | null>(null)
  const finishRef = useRef<() => void>(() => {})

  const finishCamera = useCallback(() => {
    if (!sessionRef.current) return
    draftRef.current = sessionRef.current.finish()
    sessionRef.current = null
    countingRef.current = false
    setCounting(false)
    setMode('feedback')
  }, [])
  finishRef.current = finishCamera

  const onPose = useCallback((pose: Pose | null, tMs: number, size: { w: number; h: number }) => {
    if (!def || !a) return
    const now = performance.now()
    if (countingRef.current) {
      sessionRef.current ??= new MotionSession(def, 'Right', size.w, size.h)
      const lv = sessionRef.current.push(pose, tMs)
      if (now - lastUi.current > 100) { lastUi.current = now; setLive({ ...lv }) }
      if (lv.reps >= a.reps) finishRef.current()
    } else if (now - lastUi.current > 200) {
      lastUi.current = now
      const p2 = checkPositioning(pose, def, 'Right', size.w, size.h)
      if (p2.ok) { okSince.current ??= now; setReady(now - okSince.current > 600) } else { okSince.current = null; setReady(false) }
    }
  }, [def, a])

  if (!a || !ex) return <Screen title="Exercise"><Card>Exercise not found.</Card></Screen>

  const reps = mode === 'manual' ? manual : live?.reps ?? 0
  const setNo = mode === 'camera' ? 1 : Math.min(a.sets, Math.floor(reps / a.reps) + 1)
  const inSet = mode === 'camera' ? Math.min(reps, cameraTarget) : reps >= target ? a.reps : reps % a.reps
  const cue = (() => {
    if (!live) return def?.cue ?? ''
    if (live.quality < 0.55) return 'Move so your whole body stays in view'
    if (live.lastRep && live.lastRep.durationMs < 1300) return 'Slow down. Control the movement'
    if (live.lastRep && def?.target && live.lastRep.peak < def.target * 0.45) return 'Try to go a little further, within comfort'
    if (live.lastRep) return 'Nice, steady repetition!'
    return def?.cue ?? ''
  })()

  const startCamera = (s: 'webcam' | 'sim') => { setSrc(s); setUsed(s === 'webcam' ? 'camera' : 'sim'); setMode('camera'); setCounting(false); setReady(false); setLive(null) }
  const begin = () => { sessionRef.current = null; countingRef.current = true; setCounting(true); setLive(null) }

  const submit = () => {
    const d = draftRef.current
    const total = mode === 'feedback' && used !== 'manual' ? d?.reps.length ?? 0 : manual
    const form = d ? clamp(Math.round(d.quality * 0.5 + (d.consistency ?? 80) * 0.5), 0, 100) : undefined
    logExercise({ patientId: p.id, assignmentId: a.id, date: todayISO(), time: new Date().toTimeString().slice(0, 5), repsDone: total || a.sets * a.reps, pain: fb.pain, difficulty: fb.difficulty, camera: used !== 'manual', formScore: form, bestAngle: d && d.reps.length ? Math.round(d.headline) : undefined })
    if (d && used !== 'manual' && d.reps.length >= 3 && (d.category === 'rom' || d.category === 'functional')) {
      addMotion({ ...d, patientId: p.id, at: new Date().toISOString(), status: 'pending', visibleToPatient: false, source: used === 'sim' ? 'Simulated demo' : 'Patient home session' })
    }
    setMode('done')
  }

  if (mode === 'done') {
    return (
      <Screen>
        <div className="grid place-items-center pt-10 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-brand-500 text-white shadow-xl"><PartyPopper size={44} /></div>
          <h1 className="mt-5 text-2xl font-extrabold">Well done, {p.name.split(' ')[0]}!</h1>
          <p className="mt-1 max-w-xs text-sm text-muted">Your session was saved. {used !== 'manual' ? 'Your therapist will review the movement data.' : 'Your therapist can see your feedback.'}</p>
          <div className="mt-6 w-full space-y-2.5"><Button full size="lg" onClick={() => nav('/patient/exercises')}>Back to exercises</Button><Button full variant="secondary" onClick={() => nav('/patient/home')}>Go home</Button></div>
        </div>
      </Screen>
    )
  }

  if (mode === 'feedback') {
    return (
      <Screen title="How did that feel?" back={false}>
        <Card className="space-y-5">
          <div className="text-center"><div className="text-4xl">{ex.emoji}</div><div className="mt-1 text-lg font-extrabold">{ex.name}</div>{draftRef.current && (draftRef.current.reps.length > 0
            ? <div className="text-sm text-muted">{draftRef.current.reps.length} repetitions tracked · best {Math.round(draftRef.current.headline)}°</div>
            : <div className="text-sm text-amber-700">The camera couldn't track a full repetition this time. You can still save how it felt.</div>)}</div>
          <div><div className="mb-2 text-sm font-bold">Difficulty</div><div className="grid grid-cols-3 gap-2">{(['Easy', 'Just right', 'Hard'] as const).map((d) => <Chip key={d} active={fb.difficulty === d} onClick={() => setFb({ ...fb, difficulty: d })}>{d}</Chip>)}</div></div>
          <div><div className="mb-2 text-sm font-bold">Pain during or after (0 to 10)</div><Scale value={fb.pain} onChange={(n) => setFb({ ...fb, pain: n })} /></div>
          {fb.pain >= 7 && <Notice tone="red" title="That sounds like a lot of pain">Stop this exercise. If the pain is severe or you feel unwell, contact your clinic or seek medical care.</Notice>}
          <Button full size="lg" variant="teal" onClick={submit}>Save session</Button>
        </Card>
      </Screen>
    )
  }

  if (mode === 'manual') {
    return (
      <Screen title={ex.name} back={false}>
        <Card className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Set {setNo} of {a.sets}</div>
          <div className="my-3 text-7xl font-extrabold tabular-nums text-brand-700">{inSet}<span className="text-3xl text-muted">/{a.reps}</span></div>
          <button onClick={() => setManual((m) => m + 1)} className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow-xl active:scale-95" aria-label="Count one repetition"><Plus size={48} /></button>
          <p className="mt-3 text-sm text-muted">Tap after each repetition. Total {manual} of {target}.</p>
        </Card>
        <Button full size="lg" variant="teal" onClick={() => setMode('feedback')} icon={<Check size={18} />}>{manual >= target ? 'Finish' : 'Finish early'}</Button>
      </Screen>
    )
  }

  if (mode === 'camera' && def) {
    return (
      <Screen title={ex.name} back={false}>
        <PoseStage source={src === 'webcam' ? { kind: 'webcam' } : { kind: 'sim', def, side: 'Right', speed: 1.7 }} active mirror focus={def.joint ? [{ joint: def.joint, side: 'R' }] : undefined} onPose={onPose} onStatus={setStatus} className="!rounded-3xl">
          <div className="pointer-events-none absolute inset-0">
            {counting && (
              <div className="absolute left-3 top-12 rounded-2xl bg-black/55 px-4 py-2 text-white backdrop-blur">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Tracked set</div>
                <div className="text-4xl font-extrabold leading-none">{inSet}<span className="text-lg text-white/60">/{a.reps}</span></div>
              </div>
            )}
            {status.phase === 'running' && src === 'webcam' && <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white/90">{status.fps} fps</span>}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-center text-sm font-semibold text-white">{counting ? cue : ready || src === 'sim' ? 'You are in position. Press start.' : 'Step back so your whole body is in view'}</div>
          </div>
        </PoseStage>
        {!counting ? (
          <>
            <Segmented options={['Camera', 'Demo skeleton'] as const} value={src === 'webcam' ? 'Camera' : 'Demo skeleton'} onChange={(v) => startCamera(v === 'Camera' ? 'webcam' : 'sim')} />
            <Card className="!p-3.5 text-[13px]"><b>How to set up:</b> {def.camera}</Card>
            <Button full size="lg" variant="teal" icon={<Play size={18} />} onClick={begin} disabled={src === 'webcam' && status.phase !== 'running'}>{ready || src === 'sim' ? 'Start' : 'Start anyway'}</Button>
            <Button full variant="ghost" onClick={() => setMode('detail')}>Cancel</Button>
          </>
        ) : (
          <Button full size="lg" variant="danger" icon={<Square size={16} />} onClick={finishCamera}>Finish now</Button>
        )}
        <div className="flex items-start gap-2 rounded-xl bg-white p-3 text-[11.5px] leading-snug text-slate-600 ring-1 ring-line"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-teal-600" />Guidance only, not a diagnosis. Video stays on your phone. {src === 'sim' && <SimBadge label="Demo skeleton" />}</div>
      </Screen>
    )
  }

  // detail
  return (
    <Screen title={ex.name} sub={`${ex.region} · ${ex.category}`}>
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-teal-600 text-white">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_30%_30%,#fff_0,transparent_55%)]" />
        <div className="relative text-center"><div className="text-6xl">{ex.emoji}</div><div className="mx-auto mt-2 grid h-11 w-11 place-items-center rounded-full bg-white/25 backdrop-blur"><Play className="ml-0.5" size={20} /></div><div className="mt-1.5 text-[11px] text-white/80">Demonstration video (placeholder)</div></div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Card className="!p-3"><div className="text-xl font-extrabold text-brand-700">{a.sets}</div><div className="text-[11px] text-muted">sets</div></Card>
        <Card className="!p-3"><div className="text-xl font-extrabold text-brand-700">{a.reps}</div><div className="text-[11px] text-muted">reps</div></Card>
        <Card className="!p-3"><div className="text-xl font-extrabold text-brand-700">{ex.holdSec || '–'}</div><div className="text-[11px] text-muted">sec hold</div></Card>
      </div>
      <Card><div className="text-sm font-extrabold">How to do it</div><p className="mt-1 text-sm leading-relaxed text-slate-700">{ex.instructions}</p>{a.notes && <p className="mt-2 rounded-lg bg-teal-50 p-2.5 text-sm text-teal-900"><b>From your therapist:</b> {a.notes}</p>}<div className="mt-2 flex flex-wrap gap-1.5"><Badge tone="gray">{ex.equipment}</Badge><Badge tone="gray">{a.frequency}</Badge></div></Card>
      <Notice tone="amber" title="Precautions">{ex.precautions} Stop if you feel sharp pain, dizziness or chest discomfort.</Notice>
      <div className="space-y-2.5">
        {def && <Button full size="lg" variant="teal" icon={<Camera size={18} />} onClick={() => startCamera('webcam')}>Start with camera tracking</Button>}
        {def && <Button full variant="secondary" onClick={() => startCamera('sim')}>Try with demo skeleton</Button>}
        <Button full variant={def ? 'soft' : 'primary'} size={def ? 'md' : 'lg'} icon={<Hand size={17} />} onClick={() => { setUsed('manual'); setManual(0); setMode('manual') }}>Follow along and count myself</Button>
      </div>
      <div className={cn('text-center text-xs text-muted', !def && 'hidden')}>Camera tracking counts reps and gives form tips. It cannot diagnose or change your treatment.</div>
    </Screen>
  )
}
