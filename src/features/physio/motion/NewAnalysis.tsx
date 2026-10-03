import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, Check, ChevronRight, FlipHorizontal, Info, RotateCcw, ShieldCheck, Square, Upload, Wand2, X } from 'lucide-react'
import { Badge, Button, Card, Field, Notice, PageHeader, Segmented, Select, toast } from '../../../components/ui'
import { cn, round } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { MotionCategory } from '../../../types'
import type { Focus } from '../../motion/engine/draw'
import { CATEGORIES, getMovement, MOVEMENTS, type MovementDef } from '../../motion/engine/movements'
import { checkPositioning, type Positioning } from '../../motion/engine/quality'
import { MotionSession, type DraftResult, type LiveState, type Replay } from '../../motion/engine/session'
import type { ModelKind } from '../../motion/engine/tracker'
import type { Pose, SideChoice } from '../../motion/engine/types'
import { PoseStage, type StageSource, type StageStatus } from '../../motion/ui/PoseStage'
import { qualityTone, replayCache, ReplayPlayer, ResultSummary } from './ResultSummary'

type Src = 'webcam' | 'file' | 'sim'
type Rec = 'idle' | 'countdown' | 'recording'
const STEPS = ['Setup', 'Position', 'Capture', 'Review']
const MAX_REPS = 6

function defaultSide(def: MovementDef, affected: string): SideChoice {
  if (def.sideMode === 'both') return 'Both'
  if (def.sideMode === 'none') return 'NA'
  return affected === 'Left' ? 'Left' : 'Right'
}

export default function NewAnalysis() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const patients = useStore((s) => s.patients)
  const motions = useStore((s) => s.motions)
  const addMotion = useStore((s) => s.addMotion)

  const [patientId, setPatientId] = useState(sp.get('patient') ?? 'p1')
  const patient = patients.find((p) => p.id === patientId) ?? patients[0]
  const [category, setCategory] = useState<MotionCategory>('rom')
  const [moveId, setMoveId] = useState('knee-flex')
  const def = getMovement(moveId)!
  const [side, setSide] = useState<SideChoice>(defaultSide(def, patient.side))
  const [step, setStep] = useState(0)
  const [src, setSrc] = useState<Src>('webcam')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [model, setModel] = useState<ModelKind>('lite')
  const [mirror, setMirror] = useState(true)
  const [deviceId, setDeviceId] = useState<string | undefined>()
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [status, setStatus] = useState<StageStatus>({ phase: 'idle', fps: 0, infMs: 0 })

  const [positioning, setPositioning] = useState<Positioning | null>(null)
  const [ready, setReady] = useState(false)
  const [rec, setRec] = useState<Rec>('idle')
  const [count, setCount] = useState(3)
  const [live, setLive] = useState<LiveState | null>(null)
  const [draft, setDraft] = useState<DraftResult | null>(null)
  const [replay, setReplay] = useState<Replay | null>(null)

  const recRef = useRef<Rec>('idle')
  const sessionRef = useRef<MotionSession | null>(null)
  const sizeRef = useRef({ w: 640, h: 480 })
  const lastUi = useRef(0)
  const okSince = useRef<number | null>(null)
  const finishRef = useRef<() => void>(() => {})

  const setRecBoth = (r: Rec) => { recRef.current = r; setRec(r) }

  const finish = useCallback(() => {
    const s = sessionRef.current
    if (!s || recRef.current === 'idle') return
    const d = s.finish()
    setDraft(d)
    setReplay(s.getReplay())
    sessionRef.current = null
    setRecBoth('idle')
    setStep(3)
  }, [])
  finishRef.current = finish

  const onPose = useCallback((pose: Pose | null, tMs: number, size: { w: number; h: number }) => {
    sizeRef.current = size
    const now = performance.now()
    if (recRef.current === 'recording') {
      // uploaded video: the real frame size is only known once frames arrive
      sessionRef.current ??= new MotionSession(def, side, size.w, size.h)
      const lv = sessionRef.current.push(pose, tMs)
      if (now - lastUi.current > 90) { lastUi.current = now; setLive({ ...lv }) }
      const s = sessionRef.current
      const maxSec = s.def.seconds ?? (s.def.kind === 'gait' ? 25 : 60)
      if (lv.done || lv.elapsed > maxSec || (s.def.rep && lv.reps >= MAX_REPS)) finishRef.current()
    } else if (recRef.current === 'idle' && now - lastUi.current > 180) {
      lastUi.current = now
      const p = checkPositioning(pose, def, side, size.w, size.h)
      setPositioning(p)
      if (p.ok) {
        okSince.current ??= now
        setReady(now - okSince.current > 700)
      } else { okSince.current = null; setReady(false) }
    }
  }, [def, side])

  // list cameras once the stream is running (labels need permission)
  useEffect(() => {
    if (src !== 'webcam' || status.phase !== 'running') return
    navigator.mediaDevices?.enumerateDevices().then((d) => setDevices(d.filter((x) => x.kind === 'videoinput'))).catch(() => {})
  }, [src, status.phase])

  const startCapture = () => {
    setStep(2)
    if (src === 'file') { sessionRef.current = null; setLive(null); setRecBoth('recording'); return }
    setLive(null)
    setRecBoth('countdown')
    setCount(3)
    let c = 3
    const id = setInterval(() => {
      c--
      if (c <= 0) {
        clearInterval(id)
        sessionRef.current = new MotionSession(def, side, sizeRef.current.w, sizeRef.current.h)
        setRecBoth('recording')
      } else setCount(c)
    }, 1000)
  }

  const cancelCapture = () => { sessionRef.current = null; setRecBoth('idle'); setStep(1) }

  const save = () => {
    if (!draft) return
    const id = addMotion({
      ...draft, patientId, at: new Date().toISOString(), status: 'pending', visibleToPatient: false,
      source: src === 'webcam' ? 'Webcam' : src === 'file' ? 'Video upload' : 'Simulated demo',
    })
    if (replay) replayCache.set(id, replay)
    toast('Saved. Review and approve the result')
    nav(`/physio/motion/review/${id}`)
  }

  const chooseMovement = (m: MovementDef) => { setMoveId(m.id); setSide(defaultSide(m, patient.side)) }
  const catMoves = MOVEMENTS.filter((m) => m.category === category)
  const history = useMemo(() => motions.filter((m) => m.patientId === patientId), [motions, patientId])

  const source: StageSource = src === 'webcam' ? { kind: 'webcam', deviceId } : src === 'sim' ? { kind: 'sim', def, side } : { kind: 'file', url: fileUrl ?? '' }
  const focus: Focus[] | undefined = def.kind === 'rom' && def.joint ? (side === 'Both' ? [{ joint: def.joint, side: 'L' }, { joint: def.joint, side: 'R' }] : [{ joint: def.joint, side: side === 'Left' ? 'L' : 'R' }])
    : def.kind === 'squat' || def.kind === 'sts' ? [{ joint: 'knee', side: 'L' }, { joint: 'knee', side: 'R' }] : undefined

  const showStage = (step === 1 && src !== 'file') || (step === 2 && (src !== 'file' || fileUrl))
  const q = qualityTone(Math.round((live?.quality ?? 0) * 100))
  const unusable = !!draft && (draft.quality < 30 || (draft.headline === 0 && draft.reps.length === 0))

  return (
    <div className="fade-up">
      <PageHeader title="New motion analysis" subtitle={`${patient.name} · ${patient.episodeTitle}`} back={() => (step > 0 && step < 3 ? (recRef.current !== 'idle' ? cancelCapture() : setStep(step - 1)) : nav('/physio/motion'))} />

      {/* Stepper */}
      <div className="mb-4 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1.5">
            <div className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold', i < step ? 'bg-teal-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500')}>{i < step ? <Check size={13} /> : i + 1}</div>
            <span className={cn('hidden text-xs font-semibold sm:block', i === step ? 'text-ink' : 'text-muted')}>{s}</span>
            {i < STEPS.length - 1 && <div className={cn('h-0.5 flex-1 rounded', i < step ? 'bg-teal-400' : 'bg-slate-200')} />}
          </div>
        ))}
      </div>

      {/* STEP 0: setup */}
      {step === 0 && (
        <div className="space-y-5">
          <Card>
            <Field label="Patient">
              <Select value={patientId} onChange={(e) => { setPatientId(e.target.value); const p = patients.find((x) => x.id === e.target.value)!; setSide(defaultSide(def, p.side)) }}>
                {patients.filter((p) => p.status !== 'discharged').map((p) => <option key={p.id} value={p.id}>{p.name} · {p.code}</option>)}
              </Select>
            </Field>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge tone="blue">Episode: {patient.episodeTitle}</Badge>
              <Badge tone="gray">{history.length} previous analyses</Badge>
              {patient.side !== 'NA' && <Badge tone="teal">Affected side: {patient.side}</Badge>}
            </div>
          </Card>

          <div>
            <h3 className="mb-2 text-[15px] font-bold">1. What are you assessing?</h3>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => { setCategory(c.id); chooseMovement(MOVEMENTS.find((m) => m.category === c.id)!) }} className={cn('rounded-2xl border p-3.5 text-left transition', category === c.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-line bg-white hover:border-brand-200')}>
                  <div className="text-2xl">{c.emoji}</div>
                  <div className="mt-1 text-sm font-bold">{c.label}</div>
                  <div className="text-[11.5px] leading-snug text-muted">{c.blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[15px] font-bold">2. Which movement?</h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {catMoves.map((m) => (
                <button key={m.id} onClick={() => chooseMovement(m)} className={cn('flex items-center gap-3 rounded-2xl border p-3 text-left transition', moveId === m.id ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-100' : 'border-line bg-white hover:border-teal-300')}>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm ring-1 ring-line">{m.emoji}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold">{m.label}</div>
                    <div className="text-xs text-muted">{m.region} · {m.view === 'side' ? 'Side-on view' : 'Front view'} · goal {m.target}{m.unit === '/100' ? '/100' : m.unit === 's' ? ' s' : m.unit}</div>
                  </div>
                </button>
              ))}
            </div>
            {def.sideMode === 'select' && (
              <div className="mt-3">
                <Field label="Side to measure"><Segmented options={['Left', 'Right'] as const} value={side === 'Left' ? 'Left' : 'Right'} onChange={(v) => setSide(v)} /></Field>
              </div>
            )}
            <Card className="mt-3 border-brand-100 bg-brand-50/50">
              <div className="mb-1 flex items-center gap-1.5 text-sm font-bold text-brand-800"><Info size={15} /> Instructions for the patient</div>
              <ol className="list-decimal space-y-1 pl-5 text-[13px] text-slate-700">{def.how.map((h) => <li key={h}>{h}</li>)}</ol>
            </Card>
          </div>
          <div className="flex justify-end"><Button size="lg" onClick={() => setStep(1)} icon={<ChevronRight size={18} />}>Continue to camera</Button></div>
        </div>
      )}

      {/* STEP 1 & 2: stage */}
      {(step === 1 || step === 2) && (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-3">
            {step === 1 && (
              <Segmented options={['Camera', 'Upload video', 'Simulated demo'] as const} value={src === 'webcam' ? 'Camera' : src === 'file' ? 'Upload video' : 'Simulated demo'}
                onChange={(v) => { setSrc(v === 'Camera' ? 'webcam' : v === 'Upload video' ? 'file' : 'sim'); setReady(false); setPositioning(null) }} />
            )}

            {step === 1 && src === 'file' && (
              <Card>
                <div className="grid place-items-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-8 text-center">
                  <Upload className="mb-2 text-brand-500" />
                  <p className="text-sm font-semibold">Choose a recorded video of the movement</p>
                  <p className="mt-1 max-w-xs text-xs text-muted">Processed on this device only. Use a clear, full-body clip with the same camera placement as a live capture.</p>
                  <label className="mt-3 inline-flex cursor-pointer items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                    Select video
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFileUrl(URL.createObjectURL(f)) }} />
                  </label>
                </div>
                {fileUrl && <video src={fileUrl} controls muted playsInline className="mt-3 w-full rounded-2xl bg-black" />}
              </Card>
            )}

            {showStage && (
              <PoseStage source={source} active mirror={mirror} model={model} focus={focus} onPose={onPose} onStatus={setStatus} onEnded={() => finishRef.current()}>
                {/* HUD */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
                    {status.phase === 'running' && src !== 'sim' && <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10.5px] font-semibold text-white/90 backdrop-blur" title="Performance">{status.delegate ?? 'CPU'} · {status.fps} fps · {status.infMs} ms</span>}
                    {rec === 'recording' && live && <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', q.tone === 'green' ? 'bg-emerald-500 text-white' : q.tone === 'amber' ? 'bg-amber-400 text-amber-950' : 'bg-red-500 text-white')}>{q.label}</span>}
                  </div>
                  {rec === 'countdown' && <div className="absolute inset-0 grid place-items-center bg-black/35"><div className="text-8xl font-extrabold text-white drop-shadow-lg">{count}</div></div>}
                  {rec === 'recording' && (
                    <>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-white backdrop-blur">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                        <span className="text-xs font-bold tabular-nums">REC {(live?.elapsed ?? 0).toFixed(1)}s</span>
                      </div>
                      {def.rep && <div className="absolute left-3 top-12 rounded-2xl bg-black/55 px-3.5 py-2 text-white backdrop-blur"><div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Reps</div><div className="text-3xl font-extrabold leading-none">{live?.reps ?? 0}<span className="text-base text-white/60">/{MAX_REPS}</span></div></div>}
                    </>
                  )}
                  {rec === 'idle' && step === 1 && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-center text-[13px] font-medium text-white">{def.cue}</div>
                  )}
                </div>
              </PoseStage>
            )}

            {step === 1 && src === 'webcam' && (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" icon={<FlipHorizontal size={15} />} onClick={() => setMirror((m) => !m)}>Mirror {mirror ? 'on' : 'off'}</Button>
                {devices.length > 1 && (
                  <Select value={deviceId ?? ''} onChange={(e) => setDeviceId(e.target.value || undefined)} className="!h-9 !w-auto max-w-[220px] !rounded-lg text-[13px]" aria-label="Camera">
                    <option value="">Default camera</option>
                    {devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
                  </Select>
                )}
                <Select value={model} onChange={(e) => setModel(e.target.value as ModelKind)} className="!h-9 !w-auto !rounded-lg text-[13px]" aria-label="Model quality">
                  <option value="lite">Fast model</option>
                  <option value="full">Accurate model</option>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-3 lg:col-span-2">
            {step === 1 && (
              <>
                <Card>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold">Positioning check</h3>
                    {(src === 'sim' || ready) ? <Badge tone="green"><Check size={12} /> Ready</Badge> : <Badge tone="amber">Adjusting</Badge>}
                  </div>
                  {src === 'file' ? (
                    <p className="text-sm text-muted">For uploaded video, make sure the full movement is visible. The analysis runs from the start of the clip.</p>
                  ) : src === 'sim' ? (
                    <p className="text-sm text-muted">A simulated skeleton performs the movement so you can demo the full flow without a camera. Results are labelled "Simulated demo".</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {positioning?.good.map((g) => <li key={g} className="flex items-center gap-2 text-sm text-emerald-700"><Check size={15} /> {g}</li>)}
                      {positioning?.issues.map((g) => <li key={g} className="flex items-start gap-2 text-sm text-red-600"><X size={15} className="mt-0.5 shrink-0" /> {g}</li>)}
                      {!positioning && <li className="text-sm text-muted">Waiting for the camera…</li>}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-muted"><Camera size={12} className="mr-1 inline" />{def.camera}</p>
                </Card>
                <Button full size="lg" variant="teal" icon={<Wand2 size={18} />} disabled={(src === 'file' && !fileUrl) || (src === 'webcam' && status.phase !== 'running')} onClick={startCapture}>
                  {src === 'file' ? 'Analyse video' : ready || src === 'sim' ? 'Start capture' : 'Start anyway'}
                </Button>
                {src === 'webcam' && !ready && <p className="text-center text-xs text-muted">Capture works best once all checks are green.</p>}
              </>
            )}

            {step === 2 && (
              <>
                <Card>
                  <h3 className="mb-2 text-[15px] font-bold">Live measurements</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Metric label={def.kind === 'gait' ? 'Steps' : def.kind === 'balance' ? 'Hold (s)' : def.kind.startsWith('posture') ? 'Alignment' : 'Angle now'}
                      value={def.kind === 'gait' ? live?.steps : def.kind === 'balance' ? round(live?.holdSec ?? 0, 1) : def.kind.startsWith('posture') ? live?.postureScore : live?.angle != null ? `${Math.round(live.angle)}°` : undefined} big />
                    <Metric label="Tracking" value={live ? `${Math.round(live.quality * 100)}%` : undefined} big />
                    {def.rep && <Metric label="Reps" value={live?.reps ?? 0} />}
                    {def.kind === 'rom' && side !== 'Both' ? null : def.rep ? <Metric label="Left / Right" value={live ? `${live.angleL != null ? Math.round(live.angleL) : '–'}° / ${live.angleR != null ? Math.round(live.angleR) : '–'}°` : undefined} /> : null}
                  </div>
                  {live && live.issues.length > 0 && <div className="mt-3"><Notice tone="amber">{live.issues[0]}</Notice></div>}
                </Card>
                {rec !== 'idle' ? (
                  <Button full size="lg" variant="danger" icon={<Square size={16} />} onClick={() => (rec === 'recording' ? finish() : cancelCapture())}>{rec === 'recording' ? 'Stop and analyse' : 'Cancel'}</Button>
                ) : null}
                <p className="text-center text-xs text-muted">{def.rep ? `Auto-stops after ${MAX_REPS} complete repetitions.` : def.seconds ? `Captures for ${def.seconds} seconds.` : 'Press Stop when finished.'}</p>
              </>
            )}
            <div className="flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-[11.5px] leading-snug text-slate-600"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-teal-600" />Estimates from 2D camera input, not a diagnosis. Video is processed on this device and never uploaded.</div>
          </div>
        </div>
      )}

      {/* STEP 3: review */}
      {step === 3 && draft && (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <ResultSummary m={draft} history={history} />
          </div>
          <div className="space-y-4 lg:col-span-2">
            {replay && replay.frames.length > 0 && <ReplayPlayer replay={replay} />}
            <Card>
              <h3 className="mb-1 text-[15px] font-bold">Next</h3>
              {unusable ? (
                <>
                  <div className="mb-3"><Notice tone="red" title="This capture could not be analysed">Tracking was too poor to measure anything. Check lighting and framing, make sure the whole body is in view, and try again.</Notice></div>
                  <div className="flex gap-2">
                    <Button full variant="teal" icon={<RotateCcw size={16} />} onClick={() => { setDraft(null); setLive(null); setStep(1) }}>Repeat capture</Button>
                    <Button variant="ghost" onClick={save}>Save anyway</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-3 text-sm text-muted">Save this capture to the patient's record for clinical review. Nothing is visible to the patient until you approve it.</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => { setDraft(null); setLive(null); setStep(1) }}>Repeat</Button>
                    <Button full variant="teal" onClick={save}>Save for review</Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, big }: { label: string; value?: string | number | null; big?: boolean }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className={cn('font-extrabold tabular-nums text-brand-700', big ? 'text-3xl' : 'text-xl')}>{value ?? '–'}</div>
    </div>
  )
}
